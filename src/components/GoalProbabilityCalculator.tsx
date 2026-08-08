import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Target,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronDown,
  Zap,
  BarChart3,
  Award,
} from 'lucide-react';
import {
  runMonteCarloSimulation,
  type SimulationParams,
  type SimulationResult,
  type YearlyPoint,
} from '../utils/simulationUtils';

/* ============================================================================
   HELPERS
   ============================================================================ */

const formatCurrency = (val: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

const formatCompact = (val: number): string => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
  return `₹${val.toFixed(0)}`;
};

const formatCompactShort = (val: number): string => {
  if (val >= 10000000) return `${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
  return val.toFixed(0);
};

/* ============================================================================
   STEPPER INPUT (reusable — matches Calculators.tsx)
   ============================================================================ */

interface StepperInputProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  step: number;
  suffix?: string;
}

function StepperInput({ label, value, onChange, min, max, step, suffix = '' }: StepperInputProps) {
  const [localVal, setLocalVal] = useState<string>(value.toString());

  useEffect(() => {
    setLocalVal(value.toString());
  }, [value]);

  const handleIncrement = () => {
    const next = Number((value + step).toFixed(2));
    if (next <= max) { onChange(next); setLocalVal(next.toString()); }
    else { onChange(max); setLocalVal(max.toString()); }
  };

  const handleDecrement = () => {
    const next = Number((value - step).toFixed(2));
    if (next >= min) { onChange(next); setLocalVal(next.toString()); }
    else { onChange(min); setLocalVal(min.toString()); }
  };

  const handleBlur = () => {
    let num = Number(localVal);
    if (isNaN(num)) num = min;
    const clamped = Math.max(min, Math.min(max, num));
    onChange(clamped);
    setLocalVal(clamped.toString());
  };

  return (
    <div className="form-group" style={{ marginBottom: '20px' }}>
      <div className="stepper-header-row">
        <label className="form-label" style={{ margin: 0 }}>{label}</label>
        <div className="stepper-input-wrapper">
          <input
            type="number"
            value={localVal}
            step={step}
            min={min}
            max={max}
            onChange={(e) => {
              let valStr = e.target.value;
              if (valStr === '') { setLocalVal(''); return; }
              let val = Number(valStr);
              if (!isNaN(val)) {
                if (val > max) { val = max; valStr = max.toString(); }
                setLocalVal(valStr);
                if (val >= min) onChange(val);
              }
            }}
            onBlur={handleBlur}
            className="stepper-input-field"
          />
          {suffix && <span className="stepper-suffix">{suffix}</span>}
          <div className="stepper-actions">
            <button type="button" onClick={handleIncrement} className="stepper-btn">▲</button>
            <button type="button" onClick={handleDecrement} className="stepper-btn">▼</button>
          </div>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="form-range-input"
        style={{ width: '100%', marginTop: '8px' }}
      />
    </div>
  );
}

/* ============================================================================
   SVG GAUGE COMPONENT
   ============================================================================ */

function ProbabilityGauge({ probability, confidence }: { probability: number; confidence: string }) {
  const size = 200;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // half-circle
  const offset = circumference - (probability / 100) * circumference;

  const getColor = (p: number) => {
    if (p >= 90) return '#059669';
    if (p >= 70) return '#D97706';
    if (p >= 50) return '#EA580C';
    return '#DC2626';
  };

  const color = getColor(probability);

  return (
    <div className="gp-gauge-wrap">
      <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
        {/* Background arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke="#ECEAE4"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Foreground arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 0.5s ease' }}
        />
        {/* Center text */}
        <text x={size / 2} y={size / 2 - 10} textAnchor="middle" fontSize="36" fontWeight="800" fill={color} fontFamily="Space Grotesk, sans-serif">
          {probability}%
        </text>
        <text x={size / 2} y={size / 2 + 12} textAnchor="middle" fontSize="11" fontWeight="600" fill="#8E8679" fontFamily="Montserrat, sans-serif" letterSpacing="0.1em">
          {confidence.toUpperCase()} CONFIDENCE
        </text>
      </svg>
    </div>
  );
}

/* ============================================================================
   SCENARIO COMPARISON BARS
   ============================================================================ */

function ScenarioBars({ worst, expected, best, target }: { worst: number; expected: number; best: number; target: number }) {
  const maxVal = Math.max(best, target) * 1.1;
  const barHeight = (val: number) => Math.max(8, (val / maxVal) * 160);
  const targetY = (target / maxVal) * 160;

  const scenarios = [
    { label: 'Worst Case', sublabel: '10th Percentile', value: worst, color: '#DC2626', bg: 'rgba(220, 38, 38, 0.1)' },
    { label: 'Expected', sublabel: '50th Percentile', value: expected, color: '#D97706', bg: 'rgba(217, 119, 6, 0.1)' },
    { label: 'Best Case', sublabel: '90th Percentile', value: best, color: '#059669', bg: 'rgba(5, 150, 105, 0.1)' },
  ];

  return (
    <div className="gp-scenario-bars">
      <div className="gp-scenario-bars-inner">
        {scenarios.map((s) => (
          <div key={s.label} className="gp-scenario-bar-col">
            <span className="gp-scenario-value" style={{ color: s.color }}>{formatCompact(s.value)}</span>
            <div className="gp-scenario-bar-track">
              <div
                className="gp-scenario-bar-fill"
                style={{
                  height: `${barHeight(s.value)}px`,
                  background: s.color,
                  boxShadow: `0 2px 8px ${s.bg}`,
                }}
              />
              {/* target line */}
              <div
                className="gp-scenario-target-line"
                style={{ bottom: `${targetY}px` }}
              />
            </div>
            <span className="gp-scenario-label">{s.label}</span>
            <span className="gp-scenario-sublabel">{s.sublabel}</span>
          </div>
        ))}
      </div>
      <div className="gp-scenario-legend">
        <span className="gp-scenario-legend-line" />
        <span className="gp-scenario-legend-text">Target: {formatCompact(target)}</span>
      </div>
    </div>
  );
}

/* ============================================================================
   GOAL TIMELINE SVG
   ============================================================================ */

function GoalTimeline({ monthsRemaining, timeHorizonYears }: { monthsRemaining: number; timeHorizonYears: number }) {
  const totalMonths = timeHorizonYears * 12;
  const years = Math.floor(monthsRemaining / 12);
  const months = monthsRemaining % 12;

  return (
    <div className="gp-timeline-card">
      <div className="gp-timeline-header">
        <Target size={16} color="var(--gold-dark)" />
        <span>Goal Timeline</span>
      </div>
      <div className="gp-timeline-track">
        <div className="gp-timeline-fill" style={{ width: '0%' }} />
        <div className="gp-timeline-marker gp-timeline-start">
          <div className="gp-timeline-dot" />
          <span>Today</span>
        </div>
        <div className="gp-timeline-marker gp-timeline-end">
          <div className="gp-timeline-dot gp-timeline-dot-gold" />
          <span>Goal</span>
        </div>
      </div>
      <div className="gp-timeline-stats">
        <div>
          <span className="gp-timeline-stat-label">Time Remaining</span>
          <span className="gp-timeline-stat-value">{years}y {months}m</span>
        </div>
        <div>
          <span className="gp-timeline-stat-label">Total SIP Months</span>
          <span className="gp-timeline-stat-value">{totalMonths}</span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   PROJECTION CHART (SVG Area + Percentile Bands)
   ============================================================================ */

function ProjectionChart({ data, targetAmount }: { data: YearlyPoint[]; targetAmount: number }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const width = 680;
  const height = 280;
  const padL = 60;
  const padR = 20;
  const padT = 20;
  const padB = 36;
  const cW = width - padL - padR;
  const cH = height - padT - padB;

  const allVals = data.flatMap(d => [d.p10, d.p90, d.target]);
  const yMax = Math.max(...allVals) * 1.15;
  const yMin = 0;

  const getX = (i: number) => padL + (i / Math.max(1, data.length - 1)) * cW;
  const getY = (v: number) => padT + cH - ((v - yMin) / (yMax - yMin)) * cH;

  // Build band paths
  const p10to90Path = data.map((d, i) => `${getX(i)},${getY(d.p10)}`).join(' ')
    + ' ' + [...data].reverse().map((d, i) => `${getX(data.length - 1 - i)},${getY(d.p90)}`).join(' ');

  const p25to75Path = data.map((d, i) => `${getX(i)},${getY(d.p25)}`).join(' ')
    + ' ' + [...data].reverse().map((d, i) => `${getX(data.length - 1 - i)},${getY(d.p75)}`).join(' ');

  const p50Line = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.p50)}`).join(' ');
  const investedLine = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.invested)}`).join(' ');

  // Target line
  const targetY = getY(targetAmount);

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(p => yMin + (yMax - yMin) * p);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (width / rect.width);
    const relX = x - padL;
    const pct = Math.max(0, Math.min(1, relX / cW));
    setHoverIndex(Math.round(pct * (data.length - 1)));
  };

  const hoveredPoint = hoverIndex !== null ? data[hoverIndex] : null;

  return (
    <div className="gp-projection-chart-wrap">
      <div className="gp-chart-title-row">
        <TrendingUp size={14} color="var(--gold-dark)" />
        <span>Goal Progress Projection</span>
      </div>
      <div className="gp-chart-legend-row">
        <span className="gp-legend-item"><span className="gp-legend-swatch" style={{ background: 'rgba(15, 76, 129, 0.12)' }} />10–90th Band</span>
        <span className="gp-legend-item"><span className="gp-legend-swatch" style={{ background: 'rgba(15, 76, 129, 0.25)' }} />25–75th Band</span>
        <span className="gp-legend-item"><span className="gp-legend-swatch" style={{ background: '#0F4C81' }} />Median (P50)</span>
        <span className="gp-legend-item"><span className="gp-legend-swatch" style={{ background: '#BCA374', border: '1px dashed #8E703F' }} />Invested</span>
      </div>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
        style={{ cursor: 'crosshair', display: 'block' }}
      >
        {/* Grid */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={padL} y1={getY(t)} x2={width - padR} y2={getY(t)} stroke="#ECEAE4" strokeDasharray="4 4" />
            <text x={padL - 8} y={getY(t) + 4} textAnchor="end" fontSize="9" fill="#8E8679" fontFamily="Montserrat">{formatCompactShort(t)}</text>
          </g>
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => (
          (i % Math.max(1, Math.floor(data.length / 8)) === 0 || i === data.length - 1) && (
            <text key={i} x={getX(i)} y={height - padB + 16} textAnchor="middle" fontSize="9" fill="#8E8679" fontFamily="Montserrat">
              Y{d.year}
            </text>
          )
        ))}

        {/* P10-P90 band */}
        <polygon points={p10to90Path} fill="rgba(15, 76, 129, 0.08)" />

        {/* P25-P75 band */}
        <polygon points={p25to75Path} fill="rgba(15, 76, 129, 0.15)" />

        {/* Invested line */}
        <path d={investedLine} fill="none" stroke="#BCA374" strokeWidth={1.5} strokeDasharray="6 4" />

        {/* P50 line */}
        <path d={p50Line} fill="none" stroke="#0F4C81" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {/* Target line */}
        {targetY >= padT && targetY <= height - padB && (
          <g>
            <line x1={padL} y1={targetY} x2={width - padR} y2={targetY} stroke="#DC2626" strokeWidth={1.5} strokeDasharray="8 4" />
            <text x={width - padR + 4} y={targetY + 4} fontSize="9" fill="#DC2626" fontWeight="600" fontFamily="Montserrat">Target</text>
          </g>
        )}

        {/* Hover */}
        {hoverIndex !== null && hoveredPoint && (
          <g>
            <line x1={getX(hoverIndex)} y1={padT} x2={getX(hoverIndex)} y2={height - padB} stroke="#0F4C81" strokeWidth={1} strokeDasharray="2 2" />
            <circle cx={getX(hoverIndex)} cy={getY(hoveredPoint.p50)} r={5} fill="#FFF" stroke="#0F4C81" strokeWidth={2} />
          </g>
        )}
      </svg>

      {/* Tooltip */}
      {hoverIndex !== null && hoveredPoint && (
        <div className="gp-chart-tooltip" style={{ left: `${(getX(hoverIndex) / width) * 100}%` }}>
          <div className="gp-tooltip-title">Year {hoveredPoint.year}</div>
          <div className="gp-tooltip-row"><span>P90 (Best):</span> <strong>{formatCompact(hoveredPoint.p90)}</strong></div>
          <div className="gp-tooltip-row"><span>P50 (Expected):</span> <strong>{formatCompact(hoveredPoint.p50)}</strong></div>
          <div className="gp-tooltip-row"><span>P10 (Worst):</span> <strong>{formatCompact(hoveredPoint.p10)}</strong></div>
          <div className="gp-tooltip-row"><span>Invested:</span> <strong>{formatCompact(hoveredPoint.invested)}</strong></div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   WHAT-IF SIMULATOR
   ============================================================================ */

function WhatIfSimulator({
  baseSIP,
  baseReturn,
  baseYears,
  params,
  onResult,
}: {
  baseSIP: number;
  baseReturn: number;
  baseYears: number;
  params: SimulationParams;
  onResult: (r: SimulationResult) => void;
}) {
  const [wipSIP, setWipSIP] = useState(baseSIP);
  const [wipReturn, setWipReturn] = useState(baseReturn);
  const [wipYears, setWipYears] = useState(baseYears);
  const [isRunning, setIsRunning] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync base values when parent recalculates
  useEffect(() => {
    setWipSIP(baseSIP);
    setWipReturn(baseReturn);
    setWipYears(baseYears);
  }, [baseSIP, baseReturn, baseYears]);

  const runWhatIf = useCallback(() => {
    setIsRunning(true);
    // Use requestAnimationFrame to allow UI to update first
    requestAnimationFrame(() => {
      const result = runMonteCarloSimulation({
        ...params,
        monthlySIP: wipSIP,
        expectedReturnPct: wipReturn,
        timeHorizonYears: wipYears,
        iterations: 3000, // slightly fewer for responsiveness
      });
      onResult(result);
      setIsRunning(false);
    });
  }, [wipSIP, wipReturn, wipYears, params, onResult]);

  const handleChange = useCallback((setter: (v: number) => void, val: number) => {
    setter(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      // Trigger will happen on explicit button click
    }, 500);
  }, []);

  return (
    <div className="gp-whatif-card">
      <div className="gp-whatif-header">
        <Zap size={16} color="#D97706" />
        <span>What-If Simulator</span>
      </div>
      <p className="gp-whatif-desc">Adjust parameters below and simulate to see updated probability in real time.</p>

      <div className="gp-whatif-controls">
        <div className="gp-whatif-control">
          <label>Monthly SIP</label>
          <div className="gp-whatif-input-row">
            <input
              type="range"
              min={1000}
              max={500000}
              step={1000}
              value={wipSIP}
              onChange={(e) => handleChange(setWipSIP, Number(e.target.value))}
              className="form-range-input"
            />
            <span className="gp-whatif-val">{formatCurrency(wipSIP)}</span>
          </div>
        </div>

        <div className="gp-whatif-control">
          <label>Expected Return (%)</label>
          <div className="gp-whatif-input-row">
            <input
              type="range"
              min={4}
              max={20}
              step={0.5}
              value={wipReturn}
              onChange={(e) => handleChange(setWipReturn, Number(e.target.value))}
              className="form-range-input"
            />
            <span className="gp-whatif-val">{wipReturn}%</span>
          </div>
        </div>

        <div className="gp-whatif-control">
          <label>Time Horizon (Years)</label>
          <div className="gp-whatif-input-row">
            <input
              type="range"
              min={1}
              max={40}
              step={1}
              value={wipYears}
              onChange={(e) => handleChange(setWipYears, Number(e.target.value))}
              className="form-range-input"
            />
            <span className="gp-whatif-val">{wipYears} yrs</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={runWhatIf}
        className="calculate-btn"
        style={{ width: '100%', marginTop: '16px' }}
        disabled={isRunning}
      >
        {isRunning ? '⏳ Simulating…' : '⚡ Re-Simulate'}
      </button>
    </div>
  );
}

/* ============================================================================
   MAIN COMPONENT
   ============================================================================ */

const GOAL_PRESETS = [
  { name: 'House', icon: '🏠', target: 8000000, years: 10 },
  { name: 'Retirement', icon: '🏖️', target: 50000000, years: 25 },
  { name: 'Education', icon: '🎓', target: 3000000, years: 8 },
  { name: "Child's Education", icon: '👶', target: 5000000, years: 15 },
  { name: 'Car', icon: '🚗', target: 1500000, years: 5 },
  { name: 'Custom', icon: '✨', target: 10000000, years: 10 },
];

export default function GoalProbabilityCalculator() {
  // ── Input state ──
  const [goalName, setGoalName] = useState('House');
  const [targetAmount, setTargetAmount] = useState(8000000);
  const [timeHorizon, setTimeHorizon] = useState(10);
  const [currentSavings, setCurrentSavings] = useState(500000);
  const [monthlySIP, setMonthlySIP] = useState(25000);
  const [expectedReturn, setExpectedReturn] = useState(12);
  const [sipStepUp, setSipStepUp] = useState(10);
  const [inflationRate, setInflationRate] = useState(6);
  const [lumpSum, setLumpSum] = useState(0);
  const [riskProfile, setRiskProfile] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');

  // ── Result state ──
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // ── Goal preset handler ──
  const handleGoalPreset = (preset: typeof GOAL_PRESETS[number]) => {
    setGoalName(preset.name);
    setTargetAmount(preset.target);
    setTimeHorizon(preset.years);
    setResult(null);
  };

  // ── Run simulation ──
  const handleCalculate = useCallback(() => {
    setIsCalculating(true);
    // Allow UI to show loading state
    requestAnimationFrame(() => {
      setTimeout(() => {
        const params: SimulationParams = {
          targetAmount,
          timeHorizonYears: timeHorizon,
          currentSavings,
          monthlySIP,
          expectedReturnPct: expectedReturn,
          sipStepUpPct: sipStepUp,
          inflationPct: inflationRate,
          lumpSumInvestment: lumpSum,
          riskProfile,
          iterations: 5000,
        };
        const res = runMonteCarloSimulation(params);
        setResult(res);
        setIsCalculating(false);
      }, 50);
    });
  }, [targetAmount, timeHorizon, currentSavings, monthlySIP, expectedReturn, sipStepUp, inflationRate, lumpSum, riskProfile]);

  // ── What-if handler ──
  const handleWhatIfResult = useCallback((r: SimulationResult) => {
    setResult(r);
  }, []);

  const getConfidenceIcon = (level: string) => {
    if (level === 'High') return <CheckCircle2 size={16} color="#059669" />;
    if (level === 'Medium') return <AlertTriangle size={16} color="#D97706" />;
    return <AlertTriangle size={16} color="#DC2626" />;
  };

  return (
    <div className="gp-container">
      {/* Header */}
      <div className="calculator-header">
        <h3 className="royal-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Sparkles size={28} color="var(--gold-dark)" />
          Goal Achievement Probability
        </h3>
        <p>Run Monte Carlo simulations to estimate the likelihood of reaching your financial goals. Adjust parameters and explore "What-If" scenarios.</p>
      </div>

      {/* Goal Preset Cards */}
      <div className="gp-presets-row">
        {GOAL_PRESETS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            className={`gp-preset-card ${goalName === preset.name ? 'active' : ''}`}
            onClick={() => handleGoalPreset(preset)}
          >
            <span className="gp-preset-icon">{preset.icon}</span>
            <span className="gp-preset-name">{preset.name}</span>
          </button>
        ))}
      </div>

      {/* Main Grid: Inputs | Results */}
      <div className="gp-main-grid">
        {/* LEFT: Inputs */}
        <div className="gp-inputs-col">
          <div className="gp-section-label">
            <BarChart3 size={14} />
            <span>Investment Parameters</span>
          </div>

          <StepperInput label="Target Amount" value={targetAmount} onChange={setTargetAmount} min={100000} max={500000000} step={100000} />
          <StepperInput label="Time Horizon" value={timeHorizon} onChange={setTimeHorizon} min={1} max={40} step={1} suffix="Years" />
          <StepperInput label="Current Savings / Investments" value={currentSavings} onChange={setCurrentSavings} min={0} max={100000000} step={10000} />
          <StepperInput label="Monthly SIP" value={monthlySIP} onChange={setMonthlySIP} min={500} max={1000000} step={500} />
          <StepperInput label="Expected Annual Return" value={expectedReturn} onChange={setExpectedReturn} min={4} max={25} step={0.5} suffix="%" />
          <StepperInput label="Annual SIP Step-Up" value={sipStepUp} onChange={setSipStepUp} min={0} max={50} step={1} suffix="%" />

          {/* Advanced toggle */}
          <button
            type="button"
            className="gp-advanced-toggle"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <ChevronDown size={14} style={{ transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0)', transition: '0.3s ease' }} />
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </button>

          {showAdvanced && (
            <div className="gp-advanced-section">
              <StepperInput label="Inflation Rate" value={inflationRate} onChange={setInflationRate} min={0} max={15} step={0.5} suffix="%" />
              <StepperInput label="Lump Sum Investment" value={lumpSum} onChange={setLumpSum} min={0} max={100000000} step={10000} />

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Risk Profile</label>
                <div className="gp-risk-toggles">
                  {(['conservative', 'moderate', 'aggressive'] as const).map((rp) => (
                    <button
                      key={rp}
                      type="button"
                      className={`gp-risk-btn ${riskProfile === rp ? 'active' : ''}`}
                      onClick={() => setRiskProfile(rp)}
                    >
                      {rp === 'conservative' && '🛡️'}
                      {rp === 'moderate' && '⚖️'}
                      {rp === 'aggressive' && '🔥'}
                      <span>{rp.charAt(0).toUpperCase() + rp.slice(1)}</span>
                    </button>
                  ))}
                </div>
                <div className="gp-risk-hint">
                  <Info size={12} />
                  <span>
                    {riskProfile === 'conservative' && 'Low volatility (σ ≈ 5%). Suitable for debt-heavy portfolios.'}
                    {riskProfile === 'moderate' && 'Medium volatility (σ ≈ 10%). Balanced equity-debt mix.'}
                    {riskProfile === 'aggressive' && 'High volatility (σ ≈ 15%). Equity-heavy portfolios.'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleCalculate}
            className="calculate-btn"
            style={{ width: '100%', marginTop: '8px', padding: '14px' }}
            disabled={isCalculating}
          >
            {isCalculating ? '⏳ Running 5,000 Simulations…' : '🎯 Calculate Probability'}
          </button>
        </div>

        {/* RIGHT: Results */}
        <div className="gp-results-col">
          {!result && !isCalculating && (
            <div className="gp-empty-state">
              <Sparkles size={48} color="#ECEAE4" />
              <h4>Configure & Calculate</h4>
              <p>Set your goal parameters on the left and hit Calculate to run Monte Carlo simulations.</p>
            </div>
          )}

          {isCalculating && (
            <div className="gp-empty-state">
              <div className="gp-spinner" />
              <h4>Running Simulations…</h4>
              <p>Analyzing 5,000 possible market scenarios.</p>
            </div>
          )}

          {result && !isCalculating && (
            <div className="gp-results-content">
              {/* Gauge */}
              <ProbabilityGauge probability={result.probability} confidence={result.confidenceLevel} />

              {/* Key Metrics Grid */}
              <div className="gp-metrics-grid">
                <div className="gp-metric-card">
                  <span className="gp-metric-label">Expected Portfolio</span>
                  <span className="gp-metric-value">{formatCompact(result.expectedPortfolioValue)}</span>
                </div>
                <div className="gp-metric-card">
                  <span className="gp-metric-label">Total Invested</span>
                  <span className="gp-metric-value">{formatCompact(result.totalInvested)}</span>
                </div>
                <div className="gp-metric-card">
                  <span className="gp-metric-label">Projected Gain</span>
                  <span className="gp-metric-value" style={{ color: result.projectedGain >= 0 ? '#059669' : '#DC2626' }}>
                    {result.projectedGain >= 0 ? '+' : ''}{formatCompact(result.projectedGain)}
                  </span>
                </div>
                <div className="gp-metric-card">
                  <span className="gp-metric-label">SIP for 100%</span>
                  <span className="gp-metric-value">{formatCurrency(result.requiredSIPFor100)}</span>
                </div>
              </div>

              {/* Confidence badge row */}
              <div className="gp-confidence-row">
                {getConfidenceIcon(result.confidenceLevel)}
                <span>
                  {result.confidenceLevel} Confidence — 
                  {result.probability >= 90 && ' Your goal is well within reach!'}
                  {result.probability >= 70 && result.probability < 90 && ' Good progress, but consider increasing your SIP.'}
                  {result.probability < 70 && ' Significant adjustments are recommended.'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Below-the-fold sections — only after calculation */}
      {result && !isCalculating && (
        <div className="gp-detailed-sections">

          {/* Scenario Comparison */}
          <div className="gp-detail-card">
            <h4 className="gp-detail-title">
              <BarChart3 size={16} />
              Best-Case vs Expected vs Worst-Case
            </h4>
            <ScenarioBars
              worst={result.worstCase}
              expected={result.expectedPortfolioValue}
              best={result.bestCase}
              target={targetAmount}
            />
          </div>

          {/* Projection Chart */}
          <div className="gp-detail-card">
            <ProjectionChart data={result.yearlyProjection} targetAmount={targetAmount} />
          </div>

          {/* Timeline + Recommendations Row */}
          <div className="gp-two-col">
            <div className="gp-detail-card" style={{ flex: 1 }}>
              <GoalTimeline monthsRemaining={result.monthsRemaining} timeHorizonYears={timeHorizon} />
            </div>
            <div className="gp-detail-card gp-reco-card" style={{ flex: 1 }}>
              <h4 className="gp-detail-title">
                <Award size={16} />
                AI Recommendations
              </h4>
              <ul className="gp-reco-list">
                {result.recommendations.map((r, i) => (
                  <li key={i}>
                    <Sparkles size={12} color="var(--gold-dark)" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* What-If Simulator */}
          <div className="gp-detail-card">
            <WhatIfSimulator
              baseSIP={monthlySIP}
              baseReturn={expectedReturn}
              baseYears={timeHorizon}
              params={{
                targetAmount,
                timeHorizonYears: timeHorizon,
                currentSavings,
                monthlySIP,
                expectedReturnPct: expectedReturn,
                sipStepUpPct: sipStepUp,
                inflationPct: inflationRate,
                lumpSumInvestment: lumpSum,
                riskProfile,
              }}
              onResult={handleWhatIfResult}
            />
          </div>
        </div>
      )}
    </div>
  );
}
