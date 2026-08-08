/* ============================================================================
   Asset Allocation Analyzer Utilities
   ============================================================================ */

export interface AllocationInputs {
  // Demographics & Basics
  age: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  
  // Liabilities & Safety
  debtEMI: number;
  emergencyFund: number;
  
  // Current Portfolio (in amounts)
  equity: number;
  debt: number;
  gold: number;
  realEstate: number;
  cash: number;
  others: number;
  
  // Goals
  goalAmount: number;
  goalHorizonYears: number;
  monthlySIP: number;
  
  // Risk Tolerance (Subjective)
  riskTolerance: 'low' | 'medium' | 'high';
}

export interface AllocationOutput {
  // Risk metrics (0 to 10 scale)
  riskCapacity: number;
  effectiveRisk: number; // Combined capacity and tolerance
  
  // Portfolio Totals (Excluding Emergency Fund from investment pool)
  totalNetWorth: number;
  investableAssets: number;
  
  // Allocations (%)
  currentAllocations: Record<string, number>;
  targetAllocations: Record<string, number>;
  
  // Allocation Gaps (Current % - Target %)
  allocationGapsPct: Record<string, number>;
  // Absolute Gap in Currency
  allocationGapsAmount: Record<string, number>;
  
  // Quality Scores
  allocationScore: number;
  diversificationScore: number;
  liquidityScore: number;
  concentrationRisk: 'low' | 'moderate' | 'high';
  
  // Feedback
  recommendations: { category: string; advice: string; priority: 'high' | 'medium' | 'low' }[];
}

/**
 * Objective measure of financial ability to take risk (1-10)
 */
function calculateRiskCapacity(inputs: AllocationInputs): number {
  let score = 5; // Base score
  
  // 1. Age Factor (Younger = More Capacity)
  if (inputs.age < 30) score += 2;
  else if (inputs.age < 45) score += 1;
  else if (inputs.age > 60) score -= 2;
  
  // 2. Savings Rate Factor
  const savingsRate = inputs.monthlyIncome > 0 ? (inputs.monthlyIncome - inputs.monthlyExpenses - inputs.debtEMI) / inputs.monthlyIncome : 0;
  if (savingsRate > 0.4) score += 2;
  else if (savingsRate > 0.2) score += 1;
  else if (savingsRate < 0.1) score -= 1;
  
  // 3. Debt Burden Factor
  const emiRatio = inputs.monthlyIncome > 0 ? inputs.debtEMI / inputs.monthlyIncome : 0;
  if (emiRatio > 0.4) score -= 2;
  else if (emiRatio > 0.2) score -= 1;
  
  // 4. Emergency Fund Factor (months of expenses covered)
  const monthlyOutflow = inputs.monthlyExpenses + inputs.debtEMI;
  const efMonths = monthlyOutflow > 0 ? inputs.emergencyFund / monthlyOutflow : 0;
  if (efMonths >= 6) score += 1;
  else if (efMonths < 2) score -= 1;
  
  // 5. Time Horizon Factor
  if (inputs.goalHorizonYears > 15) score += 1;
  else if (inputs.goalHorizonYears < 3) score -= 2;
  
  return Math.max(1, Math.min(10, score));
}

/**
 * Returns Target Allocations based on Risk Level (1-10) and Time Horizon
 */
function generateTargetAllocations(effectiveRisk: number, horizon: number): Record<string, number> {
  // effectiveRisk is 1 (Very Conservative) to 10 (Very Aggressive)
  
  // Base targets
  let eq = 50;
  let dt = 35;
  let gl = 10;
  let re = 0;
  let ca = 5;
  
  if (effectiveRisk >= 8) {
    eq = 70; dt = 15; gl = 10; ca = 5;
  } else if (effectiveRisk >= 6) {
    eq = 60; dt = 25; gl = 10; ca = 5;
  } else if (effectiveRisk >= 4) {
    eq = 40; dt = 45; gl = 10; ca = 5;
  } else {
    eq = 20; dt = 70; gl = 5; ca = 5;
  }
  
  // Time Horizon Adjustments (Overrides risk if horizon is too short)
  if (horizon <= 3) {
    // Ultra short term -> Cannot have high equity
    eq = Math.min(eq, 15);
    dt = 75;
    gl = 0;
    ca = 10;
  } else if (horizon <= 7) {
    // Medium term
    eq = Math.min(eq, 45);
    dt = Math.max(dt, 40);
    gl = 10;
    ca = 5;
  }
  
  // Ensure sum is exactly 100
  const total = eq + dt + gl + re + ca;
  const adjust = 100 - total;
  dt += adjust; // put remainder in debt
  
  return { equity: eq, debt: dt, gold: gl, realEstate: re, cash: ca, others: 0 };
}

export function analyzeAssetAllocation(inputs: AllocationInputs): AllocationOutput {
  const riskCapacity = calculateRiskCapacity(inputs);
  
  const toleranceMap: Record<string, number> = { low: 2, medium: 5, high: 8 };
  const riskToleranceVal = toleranceMap[inputs.riskTolerance];
  
  // Effective Risk is a blend of Capacity (60%) and Tolerance (40%), but bounded by Capacity.
  // You cannot take more risk than your capacity allows.
  let effectiveRisk = Math.round(riskCapacity * 0.6 + riskToleranceVal * 0.4);
  effectiveRisk = Math.min(effectiveRisk, riskCapacity + 1); // Cap tolerance exceeding capacity
  effectiveRisk = Math.max(1, Math.min(10, effectiveRisk));
  
  const totalNetWorth = inputs.equity + inputs.debt + inputs.gold + inputs.realEstate + inputs.cash + inputs.others + inputs.emergencyFund;
  
  // We exclude the designated emergency fund from "investable assets" for allocation purposes
  // if cash > emergencyFund, we just subtract emergencyFund. 
  // If not, emergency fund might be in debt or other. We'll simply treat total investable as totalNetWorth - emergencyFund.
  const investableAssets = Math.max(1, totalNetWorth - inputs.emergencyFund); // avoid div by 0
  
  // Calculate current allocations (%) based on investable assets
  // We'll proportionally reduce 'cash' or 'debt' if they contain the EF. For simplicity, we just calculate absolute % of total investable.
  // If Cash < EF, it means EF is sitting in other assets. 
  let adjustedCash = inputs.cash;
  let adjustedDebt = inputs.debt;
  
  let remainingEF = inputs.emergencyFund;
  if (adjustedCash >= remainingEF) {
    adjustedCash -= remainingEF;
    remainingEF = 0;
  } else {
    remainingEF -= adjustedCash;
    adjustedCash = 0;
    if (adjustedDebt >= remainingEF) {
      adjustedDebt -= remainingEF;
    } else {
      // It's in other assets, we just reduce it proportionally, but for now we won't over-complicate
    }
  }
  
  const currentAllocations = {
    equity: (inputs.equity / investableAssets) * 100,
    debt: (adjustedDebt / investableAssets) * 100,
    gold: (inputs.gold / investableAssets) * 100,
    realEstate: (inputs.realEstate / investableAssets) * 100,
    cash: (adjustedCash / investableAssets) * 100,
    others: (inputs.others / investableAssets) * 100
  };
  
  const targetAllocations = generateTargetAllocations(effectiveRisk, inputs.goalHorizonYears);
  
  const allocationGapsPct: Record<string, number> = {};
  const allocationGapsAmount: Record<string, number> = {};
  let totalAbsoluteDeviation = 0;
  
  Object.keys(currentAllocations).forEach(k => {
    const key = k as keyof typeof currentAllocations;
    const diff = currentAllocations[key] - targetAllocations[key];
    allocationGapsPct[key] = diff;
    allocationGapsAmount[key] = (diff / 100) * investableAssets;
    totalAbsoluteDeviation += Math.abs(diff);
  });
  
  // Allocation Score (100 - deviation)
  const allocationScore = Math.max(0, 100 - (totalAbsoluteDeviation / 2));
  
  // Diversification Score
  // Checks if money is spread across at least 3 classes
  const nonZeroClasses = Object.values(currentAllocations).filter(v => v > 5).length; // >5% is meaningful
  let diversificationScore = 50;
  if (nonZeroClasses >= 4) diversificationScore = 100;
  else if (nonZeroClasses === 3) diversificationScore = 80;
  else if (nonZeroClasses === 2) diversificationScore = 60;
  else if (nonZeroClasses <= 1) diversificationScore = 30;
  
  // Liquidity Score
  const liquidAssets = currentAllocations.cash + currentAllocations.equity + currentAllocations.debt; // Mutual funds/stocks/cash
  const liquidityScore = Math.min(100, liquidAssets);
  
  // Concentration Risk
  let maxConcentration = Math.max(...Object.values(currentAllocations));
  let concentrationRisk: 'low' | 'moderate' | 'high' = 'low';
  if (maxConcentration > 75) concentrationRisk = 'high';
  else if (maxConcentration > 50) concentrationRisk = 'moderate';
  
  // Generate Recommendations
  const recommendations: { category: string; advice: string; priority: 'high' | 'medium' | 'low' }[] = [];
  
  if (inputs.emergencyFund < (inputs.monthlyExpenses + inputs.debtEMI) * 3) {
    recommendations.push({
      category: 'Emergency Fund',
      advice: 'Your emergency fund is critically low. Prioritize building at least 3-6 months of expenses in a liquid savings account.',
      priority: 'high'
    });
  }
  
  if (concentrationRisk === 'high' && currentAllocations.realEstate > 75) {
    recommendations.push({
      category: 'Concentration Risk',
      advice: 'Your portfolio is heavily concentrated in Real Estate. This is highly illiquid. Direct future savings to Equity/Debt.',
      priority: 'high'
    });
  }
  
  Object.keys(allocationGapsPct).forEach(key => {
    const gap = allocationGapsPct[key];
    if (gap > 15) {
      recommendations.push({
        category: 'Rebalance Needed',
        advice: `You are heavily overweight in ${key.charAt(0).toUpperCase() + key.slice(1)} (+${gap.toFixed(1)}%). Consider halting SIPs here or harvesting profits.`,
        priority: 'medium'
      });
    } else if (gap < -15) {
      recommendations.push({
        category: 'Underweighted',
        advice: `You are underweight in ${key.charAt(0).toUpperCase() + key.slice(1)} (${gap.toFixed(1)}%). Direct future investments to reach your target allocation.`,
        priority: 'medium'
      });
    }
  });
  
  if (inputs.goalHorizonYears <= 3 && currentAllocations.equity > 30) {
    recommendations.push({
      category: 'Time Horizon Risk',
      advice: 'You have a short-term goal (<3 years) but high equity exposure. Move funds to safer Debt/Fixed deposits to protect capital.',
      priority: 'high'
    });
  }
  
  return {
    riskCapacity,
    effectiveRisk,
    totalNetWorth,
    investableAssets,
    currentAllocations,
    targetAllocations,
    allocationGapsPct,
    allocationGapsAmount,
    allocationScore,
    diversificationScore,
    liquidityScore,
    concentrationRisk,
    recommendations
  };
}
