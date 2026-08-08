/* ============================================================================
   Monte Carlo Simulation Utilities for Goal Achievement Probability
   ============================================================================ */

export interface SimulationParams {
  targetAmount: number;
  timeHorizonYears: number;
  currentSavings: number;
  monthlySIP: number;
  expectedReturnPct: number;   // annual %
  sipStepUpPct: number;        // annual %
  inflationPct: number;        // annual %
  lumpSumInvestment: number;
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
  iterations?: number;
}

export interface SimulationResult {
  probability: number;                  // 0–100
  confidenceLevel: 'High' | 'Medium' | 'Low';
  expectedPortfolioValue: number;       // median (p50)
  bestCase: number;                     // p90
  worstCase: number;                    // p10
  requiredSIPFor100: number;
  additionalInvestmentNeeded: number;
  monthsRemaining: number;
  projectedGain: number;
  totalInvested: number;
  recommendations: string[];
  // percentile curve data for chart
  yearlyProjection: YearlyPoint[];
  // distribution buckets for histogram
  distributionBuckets: DistBucket[];
}

export interface YearlyPoint {
  year: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  target: number;
  invested: number;
}

export interface DistBucket {
  rangeLabel: string;
  count: number;
  pct: number;
}

// ── Risk profile → annualised volatility (standard deviation) ──
const RISK_VOLATILITY: Record<string, number> = {
  conservative: 5,
  moderate: 10,
  aggressive: 15,
};

// ── Box–Muller transform for normal random number ──
function gaussianRandom(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// ── Percentile helper (sorted array) ──
function percentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

// ── Single simulation run — returns array of year-end corpus values ──
function runSinglePath(
  params: SimulationParams,
  annualSigma: number,
): number[] {
  const totalMonths = params.timeHorizonYears * 12;
  const monthlyMu = params.expectedReturnPct / 12 / 100;
  const monthlySigma = annualSigma / Math.sqrt(12) / 100;

  let corpus = params.currentSavings + params.lumpSumInvestment;
  const yearEndValues: number[] = [];

  for (let m = 1; m <= totalMonths; m++) {
    const yearIndex = Math.floor((m - 1) / 12);
    const sip = params.monthlySIP * Math.pow(1 + params.sipStepUpPct / 100, yearIndex);

    // Stochastic monthly return
    const monthlyReturn = monthlyMu + monthlySigma * gaussianRandom();
    corpus = (corpus + sip) * (1 + monthlyReturn);
    if (corpus < 0) corpus = 0;

    if (m % 12 === 0) {
      yearEndValues.push(corpus);
    }
  }

  // If total months is not a multiple of 12, capture the tail value
  if (totalMonths % 12 !== 0) {
    yearEndValues.push(corpus);
  }

  return yearEndValues;
}

// ── Deterministic single path (no noise) ──
function runDeterministicPath(params: SimulationParams): { yearEndValues: number[]; totalInvested: number } {
  const totalMonths = params.timeHorizonYears * 12;
  const monthlyRate = params.expectedReturnPct / 12 / 100;

  let corpus = params.currentSavings + params.lumpSumInvestment;
  let totalInvested = params.currentSavings + params.lumpSumInvestment;
  const yearEndValues: number[] = [];

  for (let m = 1; m <= totalMonths; m++) {
    const yearIndex = Math.floor((m - 1) / 12);
    const sip = params.monthlySIP * Math.pow(1 + params.sipStepUpPct / 100, yearIndex);

    corpus = (corpus + sip) * (1 + monthlyRate);
    totalInvested += sip;

    if (m % 12 === 0) {
      yearEndValues.push(corpus);
    }
  }

  if (totalMonths % 12 !== 0) {
    yearEndValues.push(corpus);
  }

  return { yearEndValues, totalInvested };
}

// ── Binary search for required SIP to reach target at ~100% probability ──
function findRequiredSIP(params: SimulationParams): number {
  // Use deterministic path for SIP search (faster + stable)
  let lo = 0;
  let hi = params.targetAmount / Math.max(1, params.timeHorizonYears * 12);
  // Clamp hi to something reasonable
  hi = Math.max(hi, params.monthlySIP * 10);

  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const testParams = { ...params, monthlySIP: mid };
    const { yearEndValues } = runDeterministicPath(testParams);
    const finalValue = yearEndValues[yearEndValues.length - 1] || 0;

    if (finalValue >= params.targetAmount) {
      hi = mid;
    } else {
      lo = mid;
    }
  }

  return Math.ceil(hi / 100) * 100; // round up to nearest 100
}

// ── Main simulation entry point ──
export function runMonteCarloSimulation(params: SimulationParams): SimulationResult {
  const iterations = params.iterations || 5000;
  const annualSigma = RISK_VOLATILITY[params.riskProfile] || 10;
  const totalMonths = params.timeHorizonYears * 12;

  // Collect all simulation paths
  const allPaths: number[][] = [];
  const finalValues: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const path = runSinglePath(params, annualSigma);
    allPaths.push(path);
    finalValues.push(path[path.length - 1] || 0);
  }

  // Sort final values for percentile calculation
  const sorted = [...finalValues].sort((a, b) => a - b);

  // Probability = proportion of simulations that reached target
  const successCount = finalValues.filter(v => v >= params.targetAmount).length;
  const probability = Math.round((successCount / iterations) * 100);

  // Percentiles
  const p10 = percentile(sorted, 10);
  const p50 = percentile(sorted, 50);
  const p90 = percentile(sorted, 90);

  // Deterministic baseline for total invested
  const { totalInvested } = runDeterministicPath(params);

  // Yearly projection (percentile bands across years)
  const numYears = allPaths[0]?.length || 0;
  const yearlyProjection: YearlyPoint[] = [];
  let cumulativeInvested = params.currentSavings + params.lumpSumInvestment;

  for (let y = 0; y < numYears; y++) {
    const yearVals = allPaths.map(p => p[y] || 0).sort((a, b) => a - b);
    // Calculate invested up to this year
    let investedThisYear = 0;
    for (let m = 0; m < 12; m++) {
      const monthNum = y * 12 + m + 1;
      if (monthNum > totalMonths) break;
      const yearIdx = Math.floor((monthNum - 1) / 12);
      investedThisYear += params.monthlySIP * Math.pow(1 + params.sipStepUpPct / 100, yearIdx);
    }
    cumulativeInvested += investedThisYear;

    yearlyProjection.push({
      year: y + 1,
      p10: percentile(yearVals, 10),
      p25: percentile(yearVals, 25),
      p50: percentile(yearVals, 50),
      p75: percentile(yearVals, 75),
      p90: percentile(yearVals, 90),
      target: params.targetAmount,
      invested: cumulativeInvested,
    });
  }

  // Distribution histogram (10 buckets)
  const minVal = sorted[0];
  const maxVal = sorted[sorted.length - 1];
  const bucketCount = 10;
  const bucketWidth = (maxVal - minVal) / bucketCount || 1;
  const distributionBuckets: DistBucket[] = [];

  for (let b = 0; b < bucketCount; b++) {
    const lo = minVal + b * bucketWidth;
    const hi = lo + bucketWidth;
    const count = finalValues.filter(v => v >= lo && (b === bucketCount - 1 ? v <= hi : v < hi)).length;
    distributionBuckets.push({
      rangeLabel: formatCompact(lo) + '–' + formatCompact(hi),
      count,
      pct: Math.round((count / iterations) * 100),
    });
  }

  // Required SIP for ~100% success
  const requiredSIPFor100 = findRequiredSIP(params);
  const additionalInvestmentNeeded = Math.max(0, params.targetAmount - p50);

  // Confidence level
  let confidenceLevel: 'High' | 'Medium' | 'Low' = 'Low';
  if (probability >= 90) confidenceLevel = 'High';
  else if (probability >= 70) confidenceLevel = 'Medium';

  // Generate recommendations
  const recommendations: string[] = [];

  if (probability < 100) {
    const sipDiff = requiredSIPFor100 - params.monthlySIP;
    if (sipDiff > 0) {
      // Estimate new probability with a modest increase
      const modestIncrease = Math.ceil(sipDiff * 0.3 / 100) * 100;
      const newProb = Math.min(100, probability + Math.round((modestIncrease / sipDiff) * (100 - probability)));
      recommendations.push(
        `Increase SIP by ${formatINR(modestIncrease)}/month to improve success probability from ${probability}% to ~${newProb}%.`
      );
    }
  }

  if (probability < 80 && params.sipStepUpPct < 15) {
    recommendations.push(
      `Increase your annual SIP step-up from ${params.sipStepUpPct}% to ${Math.min(params.sipStepUpPct + 5, 20)}% for a significant boost.`
    );
  }

  if (probability < 70 && params.riskProfile === 'conservative') {
    recommendations.push(
      `Consider a Moderate risk profile to access higher expected returns and improve your probability.`
    );
  }

  if (probability >= 95) {
    recommendations.push(
      `Excellent! You are on track. Consider diversifying across asset classes to lock in gains.`
    );
  }

  if (params.timeHorizonYears >= 10 && params.lumpSumInvestment === 0) {
    recommendations.push(
      `A one-time lump sum investment can significantly boost your corpus due to extended compounding.`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      `You're making good progress. Stay consistent with your SIP and review annually.`
    );
  }

  return {
    probability,
    confidenceLevel,
    expectedPortfolioValue: p50,
    bestCase: p90,
    worstCase: p10,
    requiredSIPFor100,
    additionalInvestmentNeeded,
    monthsRemaining: totalMonths,
    projectedGain: p50 - totalInvested,
    totalInvested,
    recommendations,
    yearlyProjection,
    distributionBuckets,
  };
}

// ── Compact currency formatter ──
function formatCompact(val: number): string {
  if (val >= 10000000) return `${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
  return val.toFixed(0);
}

function formatINR(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}
