import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  ArrowDownCircle, 
  Sliders, 
  Activity, 
  Coins, 
  Percent
} from 'lucide-react';

// Helper to format currency elegantly (e.g. Indian numbering or generic USD-style)
const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
};

interface ScheduleRow {
  label: string;
  openingBalance: number;
  deposited: number;
  withdrawn?: number;
  interest: number;
  closingBalance: number;
  peVal?: number;
  valuationStatus?: string;
}

interface AmortizationScheduleProps {
  data: {
    monthly: ScheduleRow[];
    yearly: ScheduleRow[];
  };
  hasWithdrawals?: boolean;
  isDip?: boolean;
  isDipPlan?: boolean;
}

function AmortizationSchedule({ data, hasWithdrawals = false, isDip = false, isDipPlan = false }: AmortizationScheduleProps) {
  const [isYearly, setIsYearly] = useState(true);
  const [page, setPage] = useState(1);

  // Reset page pagination state when filter toggle or underlying data updates
  useEffect(() => {
    setPage(1);
  }, [data, isYearly]);

  const scheduleData = isYearly ? data.yearly : data.monthly;
  const itemsPerPage = 10;
  const totalPages = Math.ceil(scheduleData.length / itemsPerPage);
  
  const startIndex = (page - 1) * itemsPerPage;
  const visibleData = scheduleData.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="schedule-container">
      <div className="schedule-toggle-row">
        <h4 className="brand-font" style={{ fontSize: '15px', color: 'var(--gold-dark)', textTransform: 'uppercase' }}>
          Detailed Schedule
        </h4>
        <div className="toggle-btn-group">
          <button 
            type="button" 
            className={`toggle-btn ${isYearly ? 'active' : ''}`}
            onClick={() => setIsYearly(true)}
          >
            Yearly
          </button>
          <button 
            type="button" 
            className={`toggle-btn ${!isYearly ? 'active' : ''}`}
            onClick={() => setIsYearly(false)}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="comparison-table-wrapper" style={{ marginTop: 0 }}>
        <table className="comparison-table">
          <thead>
            <tr>
              <th>{isYearly ? 'Year' : 'Month'}</th>
              <th>Opening Balance</th>
              {isDipPlan ? (
                <th>Contribution / Payout</th>
              ) : (
                <th>{hasWithdrawals ? 'Withdrawn Amount' : 'Deposited Amount'}</th>
              )}
              {isDip && <th>Market Valuation</th>}
              <th>Interest Gained</th>
              <th>Closing Balance</th>
            </tr>
          </thead>
          <tbody>
            {visibleData.map((row, idx) => {
              const isDeposit = row.deposited > 0;
              const isWithdrawal = (row.withdrawn || 0) > 0;
              
              return (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{row.label}</td>
                  <td>{formatCurrency(row.openingBalance)}</td>
                  {isDipPlan ? (
                    <td style={{ 
                      color: isDeposit ? 'var(--success)' : isWithdrawal ? 'var(--warning)' : 'var(--text-muted)',
                      fontWeight: (isDeposit || isWithdrawal) ? 600 : 400
                    }}>
                      {isDeposit ? `+${formatCurrency(row.deposited)}` : isWithdrawal ? `-${formatCurrency(row.withdrawn || 0)}` : '—'}
                    </td>
                  ) : (
                    <td style={{ color: hasWithdrawals ? 'var(--warning)' : 'var(--success)' }}>
                      {hasWithdrawals ? `-${formatCurrency(row.withdrawn || 0)}` : `+${formatCurrency(row.deposited)}`}
                    </td>
                  )}
                  {isDip && (
                    <td>
                      <span className="badge-gold" style={{ fontSize: '11px', padding: '3px 8px' }}>
                        {row.valuationStatus} (PE: {row.peVal?.toFixed(1)})
                      </span>
                    </td>
                  )}
                  <td style={{ color: 'var(--success)' }}>+{formatCurrency(row.interest)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--gold-dark)' }}>{formatCurrency(row.closingBalance)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination-controls">
          <button 
            type="button"
            className="pagination-btn"
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {page} of {totalPages}
          </span>
          <button 
            type="button"
            className="pagination-btn"
            disabled={page === totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

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

  // Keep local input in sync with external value state
  useEffect(() => {
    setLocalVal(value.toString());
  }, [value]);

  const handleIncrement = () => {
    const next = Number((value + step).toFixed(2));
    if (next <= max) {
      onChange(next);
      setLocalVal(next.toString());
    } else {
      onChange(max);
      setLocalVal(max.toString());
    }
  };

  const handleDecrement = () => {
    const next = Number((value - step).toFixed(2));
    if (next >= min) {
      onChange(next);
      setLocalVal(next.toString());
    } else {
      onChange(min);
      setLocalVal(min.toString());
    }
  };

  const handleBlur = () => {
    let num = Number(localVal);
    if (isNaN(num)) {
      num = min;
    }
    const clamped = Math.max(min, Math.min(max, num));
    onChange(clamped);
    setLocalVal(clamped.toString());
  };

  return (
    <div className="form-group" style={{ marginBottom: '28px' }}>
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
              if (valStr === '') {
                setLocalVal('');
                return;
              }
              let val = Number(valStr);
              if (!isNaN(val)) {
                if (val > max) {
                  val = max;
                  valStr = max.toString();
                }
                setLocalVal(valStr);
                if (val >= min) {
                  onChange(val);
                }
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
        style={{ width: '100%', marginTop: '10px' }}
      />
    </div>
  );
}

function PolishedNumberInput({ label, value, onChange, min, max, step }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number }) {
  const [localVal, setLocalVal] = useState<string>(value.toString());

  useEffect(() => {
    setLocalVal(value.toString());
  }, [value]);

  const handleBlur = () => {
    let num = Number(localVal);
    if (isNaN(num)) {
      num = min;
    }
    const clamped = Math.max(min, Math.min(max, num));
    onChange(clamped);
    setLocalVal(clamped.toString());
  };

  return (
    <div className="form-group">
      <label className="form-label" style={{ fontSize: '12px' }}>{label}</label>
      <input 
        type="number" 
        step={step || 1}
        min={min}
        max={max}
        value={localVal}
        onChange={(e) => {
          let valStr = e.target.value;
          if (valStr === '') {
            setLocalVal('');
            return;
          }
          let val = Number(valStr);
          if (!isNaN(val)) {
            if (val > max) {
              val = max;
              valStr = max.toString();
            }
            setLocalVal(valStr);
            if (val >= min) {
              onChange(val);
            }
          }
        }}
        onBlur={handleBlur}
        className="form-input-text"
        style={{ marginTop: '6px' }}
      />
    </div>
  );
}

interface CalculatorsProps {
  initialCalc?: 'sip' | 'swp' | 'dip' | 'inflation' | 'dip_sip' | 'fd_rd';
  hideSidebar?: boolean;
}

export default function Calculators({ initialCalc, hideSidebar = false }: CalculatorsProps) {
  const [activeCalc, setActiveCalc] = useState<'sip' | 'swp' | 'dip' | 'inflation' | 'dip_sip' | 'fd_rd'>(initialCalc || 'sip');

  const tabs = [
    { id: 'sip', label: 'SIP Calculator', desc: 'Systematic Investment Plan', icon: TrendingUp },
    { id: 'swp', label: 'SWP Calculator', desc: 'Systematic Withdrawal Plan', icon: ArrowDownCircle },
    { id: 'dip', label: 'DIP Calculator', desc: 'Deferred Income Plan', icon: Activity },
    { id: 'inflation', label: 'Inflation Calculator', desc: 'Purchasing Power Erosion', icon: Sliders },
    { id: 'dip_sip', label: 'DIP vs SIP+SWP', desc: 'Deferred Income vs DIY SIP', icon: Coins },
    { id: 'fd_rd', label: 'FD vs RD', desc: 'Fixed vs Recurring Deposit', icon: Percent },
  ] as const;

  return (
    <div className="subpage-layout" style={hideSidebar ? { gridTemplateColumns: '1fr' } : {}}>
      {/* Side Tabs for desktop, dropdown or cards for mobile */}
      {!hideSidebar && (
        <aside className="side-tabs-panel">
          <h3 className="side-tabs-title brand-font">Calculators</h3>
          <ul className="side-tab-list">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <li key={tab.id} className="side-tab-item">
                  <button
                    onClick={() => setActiveCalc(tab.id)}
                    className={`side-tab-btn ${activeCalc === tab.id ? 'active' : ''}`}
                  >
                    <Icon size={18} />
                    <div>
                      <div style={{ fontWeight: 600 }}>{tab.label}</div>
                      <div style={{ fontSize: '10px', opacity: 0.8 }}>{tab.desc}</div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>
      )}

      {/* Main active calculator screen */}
      <main className="tab-content-panel">
        {activeCalc === 'sip' && <SIPCalculator />}
        {activeCalc === 'swp' && <SWPCalculator />}
        {activeCalc === 'dip' && <DIPCalculator />}
        {activeCalc === 'inflation' && <InflationCalculator />}
        {activeCalc === 'dip_sip' && <DIPvsSIPCalculator />}
        {activeCalc === 'fd_rd' && <FDvsRDCalculator />}
      </main>
    </div>
  );
}

/* ============================================================================
   1. SIP Calculator Component
   ============================================================================ */
function SIPCalculator() {
  const [monthly, setMonthly] = useState(25000);
  const [rate, setRate] = useState(12);
  const [stepUp, setStepUp] = useState(10); // annual step up percentage
  const [years, setYears] = useState(15);
  const [showSchedule, setShowSchedule] = useState(false);

  // Reset showSchedule to false when parameters change
  useEffect(() => {
    setShowSchedule(false);
  }, [monthly, rate, stepUp, years]);

  // Run month-by-month simulation to account for annual Step Up
  const { totalInvested, maturityValue, estReturns, sipSchedule } = (() => {
    const monthlyList: ScheduleRow[] = [];
    const yearlyList: ScheduleRow[] = [];
    
    let currentBalance = 0;
    let cumulativeInvested = 0;
    const monthlyRate = rate / 12 / 100;
    
    for (let m = 1; m <= years * 12; m++) {
      const yearIndex = Math.floor((m - 1) / 12);
      const currentMonthly = monthly * Math.pow(1 + stepUp / 100, yearIndex);
      
      const opening = currentBalance;
      const interest = (opening + currentMonthly) * monthlyRate;
      currentBalance = opening + currentMonthly + interest;
      cumulativeInvested += currentMonthly;
      
      monthlyList.push({
        label: `Month ${m}`,
        openingBalance: opening,
        deposited: currentMonthly,
        interest: interest,
        closingBalance: currentBalance
      });
      
      // Yearly aggregates
      if (m % 12 === 0) {
        const y = m / 12;
        const prevYearClosing = y === 1 ? 0 : yearlyList[y - 2]?.closingBalance || 0;
        
        let yearDeposited = 0;
        for (let j = m - 11; j <= m; j++) {
          yearDeposited += monthlyList[j - 1]?.deposited || 0;
        }
        
        yearlyList.push({
          label: `Year ${y}`,
          openingBalance: prevYearClosing,
          deposited: yearDeposited,
          interest: currentBalance - prevYearClosing - yearDeposited,
          closingBalance: currentBalance
        });
      }
    }
    
    return {
      totalInvested: cumulativeInvested,
      maturityValue: currentBalance,
      estReturns: currentBalance - cumulativeInvested,
      sipSchedule: { monthly: monthlyList, yearly: yearlyList }
    };
  })();

  const investPercent = maturityValue > 0 ? (totalInvested / maturityValue) * 100 : 0;
  const gainPercent = 100 - investPercent;

  return (
    <div>
      <div className="calculator-header">
        <h3 className="royal-title">Systematic Investment Plan (SIP)</h3>
        <p>Calculate how regular monthly investments accumulate wealth over the long term.</p>
      </div>

      <div className="calculator-grid">
        {/* Left Inputs */}
        <div className="inputs-column" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '20px' }}>
          <StepperInput 
            label="Monthly Investment"
            value={monthly}
            onChange={setMonthly}
            min={500}
            max={1000000}
            step={100}
          />
          <StepperInput 
            label="Expected Return Rate (p.a.)"
            value={rate}
            onChange={setRate}
            min={1}
            max={30}
            step={0.5}
            suffix="%"
          />
          <StepperInput 
            label="Annual Step Up"
            value={stepUp}
            onChange={setStepUp}
            min={0}
            max={50}
            step={1}
            suffix="%"
          />
          <StepperInput 
            label="Time Period"
            value={years}
            onChange={setYears}
            min={1}
            max={40}
            step={1}
            suffix="Years"
          />

          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 'auto', paddingTop: '20px' }}>
            <button 
              type="button" 
              onClick={() => setShowSchedule(true)}
              className="calculate-btn"
            >
              Calculate
            </button>
          </div>
        </div>

        {/* Right Outputs & Custom SVG Chart */}
        <div className="outputs-column">
          <div className="results-display-card">
            <h4 className="brand-font">Wealth Summary</h4>
            
            <div className="result-row">
              <span className="result-label">Total Invested</span>
              <span className="result-value">{formatCurrency(totalInvested)}</span>
            </div>
            <div className="result-row">
              <span className="result-label">Estimated Returns</span>
              <span className="result-value">{formatCurrency(estReturns)}</span>
            </div>
            <div className="result-row">
              <span className="result-label">Total Maturity Value</span>
              <span className="result-value-highlight">{formatCurrency(maturityValue)}</span>
            </div>

            {/* Custom Interactive SVG Chart */}
            <div className="chart-container">
              <div className="chart-bar-group">
                <div 
                  className="chart-bar" 
                  style={{ 
                    height: `${Math.max(10, investPercent * 1.8)}px`, 
                    background: '#C2B299',
                    border: '1px solid var(--gold-primary)' 
                  }}
                >
                  <span className="chart-bar-value">{investPercent.toFixed(0)}%</span>
                </div>
                <span className="chart-bar-label">Invested Capital</span>
              </div>
              <div className="chart-bar-group">
                <div 
                  className="chart-bar" 
                  style={{ 
                    height: `${Math.max(10, gainPercent * 1.8)}px`, 
                    background: 'var(--gold-grad-1)',
                    border: '1px solid var(--gold-dark)'
                  }}
                >
                  <span className="chart-bar-value">{gainPercent.toFixed(0)}%</span>
                </div>
                <span className="chart-bar-label">Wealth Gained</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {showSchedule && <AmortizationSchedule data={sipSchedule} />}
    </div>
  );
}

/* ============================================================================
   2. SWP Calculator Component
   ============================================================================ */
interface SWPCorpusChartProps {
  monthlyList: ScheduleRow[];
  totalInv: number;
  depletionMonth: number;
}

function SWPCorpusChart({ monthlyList, totalInv, depletionMonth }: SWPCorpusChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const totalMonths = monthlyList.length;
  if (totalMonths === 0) return null;

  const width = 1200;
  const height = 250;
  const paddingLeft = 70;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Find max value in schedule (including initial fund)
  const closingBalances = monthlyList.map(row => row.closingBalance);
  const maxVal = Math.max(...closingBalances, totalInv);
  const yMax = maxVal > 0 ? maxVal * 1.15 : 10000;

  // Get SVG coordinate helper functions
  const getX = (mIndex: number) => paddingLeft + (mIndex / (totalMonths - 1)) * chartWidth;
  const getY = (val: number) => height - paddingBottom - (val / yMax) * chartHeight;

  // Generate SVG path description for the line
  let pathD = "";
  // Start at Month 0 (Opening balance = totalInv)
  pathD += `M ${getX(0)} ${getY(totalInv)}`;
  monthlyList.forEach((row, idx) => {
    pathD += ` L ${getX(idx)} ${getY(row.closingBalance)}`;
  });

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;

    // Convert mouse x to data index
    const relativeX = x - paddingLeft;
    const pct = Math.max(0, Math.min(1, relativeX / chartWidth));
    const index = Math.round(pct * (totalMonths - 1));

    setHoverIndex(index);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  // Hover details
  const hoveredRow = hoverIndex !== null ? monthlyList[hoverIndex] : null;
  const hoverX = hoverIndex !== null ? getX(hoverIndex) : 0;
  const hoverY = hoveredRow ? getY(hoveredRow.closingBalance) : 0;

  // Formatting helper for currency
  const formatCompact = (val: number) => {
    if (val >= 10000000) return `${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toFixed(0);
  };

  // Generate Y axis ticks (5 ticks)
  const yTicks = [0, 0.25, 0.5, 0.75, 1.0].map(p => yMax * p);

  // Generate X axis ticks (approx 6 ticks spread across months)
  const xTickIndices: number[] = [];
  const tickStep = Math.max(1, Math.floor(totalMonths / 6));
  for (let i = 0; i < totalMonths; i += tickStep) {
    xTickIndices.push(i);
  }
  if (!xTickIndices.includes(totalMonths - 1)) {
    xTickIndices.push(totalMonths - 1);
  }

  const isDepleted = depletionMonth !== -1;

  return (
    <div className="chart-container-root" style={{ position: 'relative', marginTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h5 className="brand-font" style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Corpus Over Time
        </h5>
        <span 
          style={{ 
            fontSize: '11px', 
            fontWeight: 600, 
            padding: '3px 8px', 
            borderRadius: '12px',
            background: isDepleted ? 'rgba(198, 40, 40, 0.1)' : 'rgba(15, 76, 129, 0.08)',
            color: isDepleted ? 'var(--warning)' : 'var(--success)',
            border: `1px solid ${isDepleted ? 'rgba(198, 40, 40, 0.2)' : 'rgba(15, 76, 129, 0.15)'}`
          }}
        >
          {isDepleted ? `Depletes in Month ${depletionMonth}` : '✓ Sustains full duration'}
        </span>
      </div>

      <svg 
        width="100%" 
        height={height} 
        viewBox={`0 0 ${width} ${height}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: 'crosshair', display: 'block', overflow: 'visible' }}
      >
        {/* Background Grid Lines */}
        {yTicks.map((tick, i) => (
          <line
            key={i}
            x1={paddingLeft}
            y1={getY(tick)}
            x2={width - paddingRight}
            y2={getY(tick)}
            stroke="#ECEAE4"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
        ))}

        {/* Y-Axis Ticks */}
        {yTicks.map((tick, i) => (
          <text
            key={i}
            x={paddingLeft - 10}
            y={getY(tick) + 4}
            textAnchor="end"
            fontSize="10px"
            fill="var(--text-secondary)"
            fontFamily="Montserrat, sans-serif"
          >
            {formatCompact(tick)}
          </text>
        ))}

        {/* X-Axis Ticks */}
        {xTickIndices.map((idx, i) => (
          <text
            key={i}
            x={getX(idx)}
            y={height - paddingBottom + 16}
            textAnchor="middle"
            fontSize="10px"
            fill="var(--text-secondary)"
            fontFamily="Montserrat, sans-serif"
          >
            {idx + 1}
          </text>
        ))}
        {/* X-Axis bottom label */}
        <text 
          x={paddingLeft + chartWidth / 2} 
          y={height - 4} 
          textAnchor="middle" 
          fontSize="9px" 
          fill="var(--text-muted)" 
          fontFamily="Montserrat, sans-serif"
          letterSpacing="0.05em"
        >
          MONTH NUMBER
        </text>

        {/* Main Line path */}
        <path
          d={pathD}
          fill="none"
          stroke="url(#swpCurveGradient)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Glow/Gradient Definitions */}
        <defs>
          <linearGradient id="swpCurveGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0F4C81" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>

        {/* Vertical tracking line and indicator circle on hover */}
        {hoverIndex !== null && hoveredRow && (
          <>
            <line
              x1={hoverX}
              y1={paddingTop}
              x2={hoverX}
              y2={height - paddingBottom}
              stroke="#0F4C81"
              strokeWidth={1}
              strokeDasharray="2 2"
            />
            <circle
              cx={hoverX}
              cy={hoverY}
              r={6}
              fill="#FFFFFF"
              stroke="#0F4C81"
              strokeWidth={2.5}
              style={{ filter: 'drop-shadow(0px 2px 4px rgba(15,76,129,0.3))' }}
            />
          </>
        )}
      </svg>

      {/* HTML Hover Tooltip */}
      {hoverIndex !== null && hoveredRow && (
        <div
          style={{
            position: 'absolute',
            left: `${Math.min(width - 160, Math.max(paddingLeft, hoverX - 70)) * 100 / width}%`,
            top: `${Math.max(10, hoverY - 65)}px`,
            background: 'var(--text-primary)',
            color: '#FFFFFF',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '11px',
            boxShadow: 'var(--shadow-hover)',
            border: '1px solid var(--gold-primary)',
            pointerEvents: 'none',
            zIndex: 100,
            fontFamily: 'Montserrat, sans-serif',
            transition: 'left 0.1s ease-out, top 0.1s ease-out'
          }}
        >
          <div style={{ fontWeight: 600, color: 'var(--gold-secondary)', marginBottom: '3px' }}>
            Month {hoverIndex + 1}
          </div>
          <div style={{ fontSize: '10px', color: '#ECEAE4' }}>
            corpus : <strong style={{ color: '#FFFFFF' }}>{formatCurrency(hoveredRow.closingBalance)}</strong>
          </div>
        </div>
      )}
    </div>
  );
}

function SWPCalculator() {
  const [totalInv, setTotalInv] = useState(5000000);
  const [withdrawal, setWithdrawal] = useState(30000);
  const [rate, setRate] = useState(8);
  const [years, setYears] = useState(20);
  const [showSchedule, setShowSchedule] = useState(false);

  // Reset showSchedule to false when parameters change
  useEffect(() => {
    setShowSchedule(false);
  }, [totalInv, withdrawal, rate, years]);

  // Month-by-month calculation to track remaining balance
  let currentBalance = totalInv;
  const monthlyRate = rate / 12 / 100;
  const totalMonths = years * 12;
  let totalWithdrawn = 0;
  let depletionMonth = -1;

  for (let m = 1; m <= totalMonths; m++) {
    if (currentBalance >= withdrawal) {
      currentBalance = currentBalance - withdrawal;
      totalWithdrawn += withdrawal;
      currentBalance = currentBalance * (1 + monthlyRate);
    } else if (currentBalance > 0) {
      totalWithdrawn += currentBalance;
      currentBalance = 0;
      depletionMonth = m;
      break;
    } else {
      currentBalance = 0;
      if (depletionMonth === -1) {
        depletionMonth = m - 1;
      }
      break;
    }
  }

  const isDepleted = currentBalance === 0;
  const finalBalance = currentBalance;
  
  const totalPayout = totalWithdrawn;
  const finalValueCombined = finalBalance + totalPayout;
  const returnGained = finalValueCombined - totalInv;

  // Generate projection schedule data for SWP
  const swpSchedule = (() => {
    const monthlyList: ScheduleRow[] = [];
    const yearlyList: ScheduleRow[] = [];
    
    let tempBalance = totalInv;
    
    for (let m = 1; m <= totalMonths; m++) {
      const opening = tempBalance;
      let actualWithdrawal = 0;
      let interest = 0;
      
      if (tempBalance >= withdrawal) {
        actualWithdrawal = withdrawal;
        tempBalance = tempBalance - withdrawal;
        interest = tempBalance * monthlyRate;
        tempBalance = tempBalance + interest;
      } else if (tempBalance > 0) {
        actualWithdrawal = tempBalance;
        tempBalance = 0;
        interest = 0;
      } else {
        tempBalance = 0;
      }
      
      monthlyList.push({
        label: `Month ${m}`,
        openingBalance: opening,
        deposited: 0,
        withdrawn: actualWithdrawal,
        interest: interest,
        closingBalance: tempBalance
      });
      
      // Yearly aggregates
      if (m % 12 === 0) {
        const y = m / 12;
        const prevYearClosing = y === 1 ? totalInv : yearlyList[y - 2]?.closingBalance || 0;
        
        let yearWithdrawn = 0;
        for (let j = m - 11; j <= m; j++) {
          yearWithdrawn += monthlyList[j - 1]?.withdrawn || 0;
        }
        
        yearlyList.push({
          label: `Year ${y}`,
          openingBalance: prevYearClosing,
          deposited: 0,
          withdrawn: yearWithdrawn,
          interest: tempBalance - prevYearClosing + yearWithdrawn,
          closingBalance: tempBalance
        });
      }
    }
    
    return { monthly: monthlyList, yearly: yearlyList };
  })();

  return (
    <div>
      <div className="calculator-header">
        <h3 className="royal-title">Systematic Withdrawal Plan (SWP)</h3>
        <p>Calculate how much cash you can systematically withdraw from your corpus while keeping it sustainable.</p>
      </div>

      <div className="calculator-grid">
        {/* Left Inputs */}
        <div className="inputs-column" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '20px' }}>
          <StepperInput 
            label="Total Corpus Fund"
            value={totalInv}
            onChange={setTotalInv}
            min={10000}
            max={100000000}
            step={1000}
          />
          <StepperInput 
            label="Monthly Withdrawal"
            value={withdrawal}
            onChange={setWithdrawal}
            min={500}
            max={1000000}
            step={100}
          />
          <StepperInput 
            label="Expected Return Rate (p.a.)"
            value={rate}
            onChange={setRate}
            min={1}
            max={25}
            step={0.5}
            suffix="%"
          />
          <StepperInput 
            label="Period"
            value={years}
            onChange={setYears}
            min={1}
            max={40}
            step={1}
            suffix="Years"
          />

          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 'auto', paddingTop: '20px' }}>
            <button 
              type="button" 
              onClick={() => setShowSchedule(true)}
              className="calculate-btn"
            >
              Calculate
            </button>
          </div>
        </div>

        {/* Right Outputs & Warning Alerts if depleted */}
        <div className="outputs-column">
          <div className="results-display-card">
            <h4 className="brand-font">Withdrawal Sustainability</h4>

            {isDepleted ? (
              <div style={{
                background: 'rgba(198, 40, 40, 0.08)',
                border: '1px solid var(--warning)',
                padding: '16px',
                borderRadius: '4px',
                marginBottom: '20px',
                color: 'var(--warning)',
                fontSize: '13px',
                fontWeight: 500
              }}>
                ⚠️ Capital depletion detected. Your corpus will survive only for <strong>{Math.floor(depletionMonth / 12)} years and {depletionMonth % 12} months</strong> before running dry.
              </div>
            ) : (
              <div style={{
                background: 'rgba(15, 76, 129, 0.06)',
                border: '1px solid var(--success)',
                padding: '16px',
                borderRadius: '4px',
                marginBottom: '20px',
                color: 'var(--success)',
                fontSize: '13px',
                fontWeight: 500
              }}>
                ✨ Sustainable Plan. Your corpus will retain a positive balance of <strong>{formatCurrency(finalBalance)}</strong> at the end of {years} years.
              </div>
            )}
            
            <div className="result-row">
              <span className="result-label">Initial Corpus</span>
              <span className="result-value">{formatCurrency(totalInv)}</span>
            </div>
            <div className="result-row">
              <span className="result-label">Total Cash Withdrawn</span>
              <span className="result-value">{formatCurrency(totalPayout)}</span>
            </div>
            <div className="result-row">
              <span className="result-label">Final Corpus Balance</span>
              <span className="result-value">{formatCurrency(finalBalance)}</span>
            </div>
            <div className="result-row">
              <span className="result-label">Capital Appreciation</span>
              <span className="result-value-highlight" style={{ color: returnGained >= 0 ? 'var(--gold-dark)' : 'var(--warning)' }}>
                {formatCurrency(returnGained)}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {showSchedule && (
        <div style={{ marginTop: '40px' }}>
          <SWPCorpusChart monthlyList={swpSchedule.monthly} totalInv={totalInv} depletionMonth={depletionMonth} />
          <div style={{ marginTop: '40px' }}>
            <AmortizationSchedule data={swpSchedule} hasWithdrawals={true} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   3. DIP (Deferred Income Plan) Calculator Component
   ============================================================================ */
interface DIPCorpusChartProps {
  monthlyList: ScheduleRow[];
  totalPremium: number;
  accumMonths: number;
  deferMonths: number;
}

function DIPCorpusChart({ monthlyList, totalPremium: _totalPremium, accumMonths, deferMonths }: DIPCorpusChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const totalMonths = monthlyList.length;
  if (totalMonths === 0) return null;

  const width = 1200;
  const height = 250;
  const paddingLeft = 70;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Find max value in schedule
  const closingBalances = monthlyList.map(row => row.closingBalance);
  const maxVal = Math.max(...closingBalances);
  const yMax = maxVal > 0 ? maxVal * 1.15 : 10000;

  // Get SVG coordinate helper functions
  const getX = (mIndex: number) => paddingLeft + (mIndex / (totalMonths - 1)) * chartWidth;
  const getY = (val: number) => height - paddingBottom - (val / yMax) * chartHeight;

  // Generate SVG path description for the line
  let pathD = "";
  pathD += `M ${getX(0)} ${getY(0)}`;
  monthlyList.forEach((row, idx) => {
    pathD += ` L ${getX(idx)} ${getY(row.closingBalance)}`;
  });

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const relativeX = x - paddingLeft;
    const pct = Math.max(0, Math.min(1, relativeX / chartWidth));
    const index = Math.round(pct * (totalMonths - 1));

    setHoverIndex(index);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const hoveredRow = hoverIndex !== null ? monthlyList[hoverIndex] : null;
  const hoverX = hoverIndex !== null ? getX(hoverIndex) : 0;
  const hoverY = hoveredRow ? getY(hoveredRow.closingBalance) : 0;

  const formatCompact = (val: number) => {
    if (val >= 10000000) return `${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toFixed(0);
  };

  const yTicks = [0, 0.25, 0.5, 0.75, 1.0].map(p => yMax * p);

  const xTickIndices: number[] = [];
  const tickStep = Math.max(1, Math.floor(totalMonths / 6));
  for (let i = 0; i < totalMonths; i += tickStep) {
    xTickIndices.push(i);
  }
  if (!xTickIndices.includes(totalMonths - 1)) {
    xTickIndices.push(totalMonths - 1);
  }

  const getPhaseName = (m: number) => {
    if (m <= accumMonths) return "Accumulation Phase";
    if (m <= accumMonths + deferMonths) return "Deferral Phase";
    return "Payout Phase";
  };

  return (
    <div className="chart-container-root" style={{ position: 'relative', marginTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h5 className="brand-font" style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Deferred Income Corpus Lifecycle
        </h5>
        {hoverIndex !== null && hoveredRow && (
          <span 
            style={{ 
              fontSize: '11px', 
              fontWeight: 600, 
              padding: '3px 8px', 
              borderRadius: '12px',
              background: 'rgba(188, 163, 116, 0.15)',
              color: 'var(--gold-dark)',
              border: '1px solid var(--border-gold)'
            }}
          >
            {getPhaseName(hoverIndex + 1)}
          </span>
        )}
      </div>

      <svg 
        width="100%" 
        height={height} 
        viewBox={`0 0 ${width} ${height}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: 'crosshair', display: 'block', overflow: 'visible' }}
      >
        {/* Background Grid Lines */}
        {yTicks.map((tick, i) => (
          <line
            key={i}
            x1={paddingLeft}
            y1={getY(tick)}
            x2={width - paddingRight}
            y2={getY(tick)}
            stroke="#ECEAE4"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
        ))}

        {/* Y-Axis Ticks */}
        {yTicks.map((tick, i) => (
          <text
            key={i}
            x={paddingLeft - 10}
            y={getY(tick) + 4}
            textAnchor="end"
            fontSize="10px"
            fill="var(--text-secondary)"
            fontFamily="Montserrat, sans-serif"
          >
            {formatCompact(tick)}
          </text>
        ))}

        {/* X-Axis Ticks */}
        {xTickIndices.map((idx, i) => (
          <text
            key={i}
            x={getX(idx)}
            y={height - paddingBottom + 16}
            textAnchor="middle"
            fontSize="10px"
            fill="var(--text-secondary)"
            fontFamily="Montserrat, sans-serif"
          >
            {idx + 1}
          </text>
        ))}
        {/* X-Axis bottom label */}
        <text 
          x={paddingLeft + chartWidth / 2} 
          y={height - 4} 
          textAnchor="middle" 
          fontSize="9px" 
          fill="var(--text-muted)" 
          fontFamily="Montserrat, sans-serif"
          letterSpacing="0.05em"
        >
          MONTH NUMBER
        </text>

        {/* Phase dividing vertical dotted lines */}
        {accumMonths > 0 && accumMonths < totalMonths && (
          <g>
            <line
              x1={getX(accumMonths - 1)}
              y1={paddingTop}
              x2={getX(accumMonths - 1)}
              y2={height - paddingBottom}
              stroke="var(--border-gold)"
              strokeDasharray="3 3"
              strokeWidth={1.5}
            />
            <text
              x={getX(accumMonths - 1) - 6}
              y={paddingTop + 15}
              textAnchor="end"
              fontSize="9px"
              fill="var(--text-muted)"
              fontWeight={600}
            >
              STOP PREMIUMS
            </text>
          </g>
        )}

        {(accumMonths + deferMonths) > accumMonths && (accumMonths + deferMonths) < totalMonths && (
          <g>
            <line
              x1={getX(accumMonths + deferMonths - 1)}
              y1={paddingTop}
              x2={getX(accumMonths + deferMonths - 1)}
              y2={height - paddingBottom}
              stroke="var(--border-gold)"
              strokeDasharray="3 3"
              strokeWidth={1.5}
            />
            <text
              x={getX(accumMonths + deferMonths - 1) + 6}
              y={paddingTop + 15}
              textAnchor="start"
              fontSize="9px"
              fill="var(--text-muted)"
              fontWeight={600}
            >
              START PAYOUTS
            </text>
          </g>
        )}

        {/* Main Line path */}
        <path
          d={pathD}
          fill="none"
          stroke="url(#dipCurveGradient)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Glow/Gradient Definitions */}
        <defs>
          <linearGradient id="dipCurveGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--gold-dark)" />
            <stop offset="50%" stopColor="var(--gold-primary)" />
            <stop offset="100%" stopColor="#C2B299" />
          </linearGradient>
        </defs>

        {/* Vertical tracking line and indicator circle on hover */}
        {hoverIndex !== null && hoveredRow && (
          <>
            <line
              x1={hoverX}
              y1={paddingTop}
              x2={hoverX}
              y2={height - paddingBottom}
              stroke="var(--gold-dark)"
              strokeWidth={1}
              strokeDasharray="2 2"
            />
            <circle
              cx={hoverX}
              cy={hoverY}
              r={6}
              fill="#FFFFFF"
              stroke="var(--gold-dark)"
              strokeWidth={2.5}
              style={{ filter: 'drop-shadow(0px 2px 4px rgba(188,163,116,0.3))' }}
            />
          </>
        )}
      </svg>

      {/* HTML Hover Tooltip */}
      {hoverIndex !== null && hoveredRow && (
        <div
          style={{
            position: 'absolute',
            left: `${Math.min(width - 180, Math.max(paddingLeft, hoverX - 80)) * 100 / width}%`,
            top: `${Math.max(10, hoverY - 65)}px`,
            background: 'var(--text-primary)',
            color: '#FFFFFF',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '11px',
            boxShadow: 'var(--shadow-hover)',
            border: '1px solid var(--gold-primary)',
            pointerEvents: 'none',
            zIndex: 100,
            fontFamily: 'Montserrat, sans-serif',
            transition: 'left 0.1s ease-out, top 0.1s ease-out'
          }}
        >
          <div style={{ fontWeight: 600, color: 'var(--gold-secondary)', marginBottom: '3px' }}>
            Month {hoverIndex + 1}
          </div>
          <div style={{ fontSize: '10px', color: '#ECEAE4' }}>
            corpus : <strong style={{ color: '#FFFFFF' }}>{formatCurrency(hoveredRow.closingBalance)}</strong>
          </div>
          <div style={{ fontSize: '9px', color: 'var(--gold-light)', marginTop: '2px' }}>
            {hoverIndex < accumMonths ? `Contributed: ${formatCurrency(hoveredRow.deposited)}` : hoveredRow.withdrawn ? `Income: ${formatCurrency(hoveredRow.withdrawn)}` : 'Deferring'}
          </div>
        </div>
      )}
    </div>
  );
}

function DIPCalculator() {
  const [monthlyContribution, setMonthlyContribution] = useState(25000);
  const [accumYears, setAccumYears] = useState(15);
  const [deferYears, setDeferYears] = useState(5);
  const [payoutYears, setPayoutYears] = useState(25);
  const [growthRate, setGrowthRate] = useState(8);
  const [payoutRate, setPayoutRate] = useState(7);
  const [returnOfPremium, setReturnOfPremium] = useState(true);
  const [showSchedule, setShowSchedule] = useState(false);

  // Reset showSchedule to false when parameters change
  useEffect(() => {
    setShowSchedule(false);
  }, [monthlyContribution, accumYears, deferYears, payoutYears, growthRate, payoutRate, returnOfPremium]);

  const M_accum = accumYears * 12;
  const M_defer = deferYears * 12;
  const M_payout = payoutYears * 12;
  const M_total = M_accum + M_defer + M_payout;
  const P_total = monthlyContribution * 12 * accumYears;
  const FV = returnOfPremium ? P_total : 0;

  const { monthlyList, yearlyList: _yearlyList, corpusAtStartPayout, monthlyPayout, totalPayoutReceived, netWealthGain, dipSchedule } = (() => {
    const tempMonthlyList: ScheduleRow[] = [];
    const tempYearlyList: ScheduleRow[] = [];
    
    let currentBalance = 0;
    const rAccum = growthRate / 12 / 100;
    const rPayout = payoutRate / 12 / 100;
    
    // 1. Accumulation Phase
    for (let m = 1; m <= M_accum; m++) {
      const opening = currentBalance;
      const deposit = monthlyContribution;
      const interest = (opening + deposit) * rAccum;
      currentBalance = opening + deposit + interest;
      tempMonthlyList.push({
        label: `Month ${m}`,
        openingBalance: opening,
        deposited: deposit,
        withdrawn: 0,
        interest: interest,
        closingBalance: currentBalance
      });
    }
    
    // 2. Deferral Phase
    for (let m = M_accum + 1; m <= M_accum + M_defer; m++) {
      const opening = currentBalance;
      const interest = opening * rAccum;
      currentBalance = opening + interest;
      tempMonthlyList.push({
        label: `Month ${m}`,
        openingBalance: opening,
        deposited: 0,
        withdrawn: 0,
        interest: interest,
        closingBalance: currentBalance
      });
    }
    
    const corpusAtPayout = currentBalance;
    
    // Calculate payout amount
    let payout = 0;
    if (M_payout > 0) {
      if (rPayout > 0) {
        const factor = Math.pow(1 + rPayout, M_payout);
        payout = (corpusAtPayout * factor - FV) * rPayout / (factor - 1);
      } else {
        payout = (corpusAtPayout - FV) / M_payout;
      }
    }
    
    // 3. Payout Phase
    let totalWithdrawn = 0;
    for (let m = M_accum + M_defer + 1; m <= M_total; m++) {
      const opening = currentBalance;
      const interest = opening * rPayout;
      let withdrawn = payout;
      
      if (opening + interest < withdrawn) {
        withdrawn = opening + interest;
        currentBalance = 0;
      } else {
        currentBalance = opening + interest - withdrawn;
      }
      
      totalWithdrawn += withdrawn;
      tempMonthlyList.push({
        label: `Month ${m}`,
        openingBalance: opening,
        deposited: 0,
        withdrawn: withdrawn,
        interest: interest,
        closingBalance: currentBalance
      });
    }
    
    // Yearly aggregates
    for (let y = 1; y <= Math.ceil(M_total / 12); y++) {
      const startMonth = (y - 1) * 12 + 1;
      const endMonth = Math.min(y * 12, M_total);
      const yearOpening = tempMonthlyList[startMonth - 1]?.openingBalance || 0;
      const yearClosing = tempMonthlyList[endMonth - 1]?.closingBalance || 0;
      
      let yearDeposited = 0;
      let yearWithdrawn = 0;
      let yearInterest = 0;
      for (let j = startMonth; j <= endMonth; j++) {
        yearDeposited += tempMonthlyList[j - 1]?.deposited || 0;
        yearWithdrawn += tempMonthlyList[j - 1]?.withdrawn || 0;
        yearInterest += tempMonthlyList[j - 1]?.interest || 0;
      }
      
      tempYearlyList.push({
        label: `Year ${y}`,
        openingBalance: yearOpening,
        deposited: yearDeposited,
        withdrawn: yearWithdrawn,
        interest: yearInterest,
        closingBalance: yearClosing
      });
    }
    
    const finalLumpSum = returnOfPremium ? P_total : 0;
    const totalBenefit = totalWithdrawn + finalLumpSum;
    const netGain = totalBenefit - P_total;
    
    return {
      monthlyList: tempMonthlyList,
      yearlyList: tempYearlyList,
      corpusAtStartPayout: corpusAtPayout,
      monthlyPayout: payout,
      totalPayoutReceived: totalWithdrawn,
      netWealthGain: netGain,
      dipSchedule: { monthly: tempMonthlyList, yearly: tempYearlyList }
    };
  })();

  const totalPremium = P_total;

  return (
    <div>
      <div className="calculator-header">
        <h3 className="royal-title">Deferred Income Plan (DIP)</h3>
        <p>Model structured retirement or annuity income plans. Fund the plan over time, defer withdrawals, and generate a steady stream of income (with optional Return of Premium benefit).</p>
      </div>

      <div className="calculator-grid">
        {/* Left Inputs */}
        <div className="inputs-column" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '20px' }}>
          <StepperInput 
            label="Monthly Contribution"
            value={monthlyContribution}
            onChange={setMonthlyContribution}
            min={1000}
            max={1000000}
            step={500}
          />
          <StepperInput 
            label="Accumulation Phase"
            value={accumYears}
            onChange={setAccumYears}
            min={1}
            max={30}
            step={1}
            suffix="Years"
          />
          <StepperInput 
            label="Deferral Phase"
            value={deferYears}
            onChange={setDeferYears}
            min={0}
            max={20}
            step={1}
            suffix="Years"
          />
          <StepperInput 
            label="Payout Phase"
            value={payoutYears}
            onChange={setPayoutYears}
            min={1}
            max={40}
            step={1}
            suffix="Years"
          />
          <StepperInput 
            label="Expected Growth Rate (p.a.)"
            value={growthRate}
            onChange={setGrowthRate}
            min={1}
            max={20}
            step={0.5}
            suffix="%"
          />
          <StepperInput 
            label="Annuity Payout Rate (p.a.)"
            value={payoutRate}
            onChange={setPayoutRate}
            min={1}
            max={15}
            step={0.5}
            suffix="%"
          />

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label">Return of Premium (ROP) Benefit</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
              <button 
                type="button"
                onClick={() => setReturnOfPremium(true)}
                className={`option-btn ${returnOfPremium ? 'selected' : ''}`}
                style={{ padding: '10px' }}
              >
                🛡️ Yes (Return Premiums at End)
              </button>
              <button 
                type="button"
                onClick={() => setReturnOfPremium(false)}
                className={`option-btn ${!returnOfPremium ? 'selected' : ''}`}
                style={{ padding: '10px' }}
              >
                💸 No (Maximize Monthly Income)
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 'auto', paddingTop: '20px' }}>
            <button 
              type="button" 
              onClick={() => setShowSchedule(true)}
              className="calculate-btn"
            >
              Calculate
            </button>
          </div>
        </div>

        {/* Right Output details */}
        <div className="outputs-column">
          <div className="results-display-card">
            <h4 className="brand-font">Deferred Income Summary</h4>

            <div style={{
              background: 'rgba(188, 163, 116, 0.08)',
              border: '1px solid var(--gold-primary)',
              padding: '16px',
              borderRadius: '4px',
              marginBottom: '20px',
              fontSize: '12px',
              color: 'var(--text-secondary)'
            }}>
              💡 <strong>DIP Strategy:</strong> You invest for {accumYears} years. The corpus compounds during accumulation and deferral. Then, it pays a monthly stream of income for {payoutYears} years. {returnOfPremium ? "At maturity, your total premium is returned." : "No premium is returned, allowing for higher payouts."}
            </div>

            <div className="result-row">
              <span className="result-label">Total Premium Invested</span>
              <span className="result-value">{formatCurrency(totalPremium)}</span>
            </div>
            <div className="result-row">
              <span className="result-label">Accumulated Corpus (at Payout)</span>
              <span className="result-value">{formatCurrency(corpusAtStartPayout)}</span>
            </div>
            <div className="result-row">
              <span className="result-label">Monthly Deferred Income</span>
              <span className="result-value-highlight">{formatCurrency(monthlyPayout)}</span>
            </div>
            <div className="result-row">
              <span className="result-label">Total Payout Received</span>
              <span className="result-value">{formatCurrency(totalPayoutReceived)}</span>
            </div>
            <div className="result-row">
              <span className="result-label">Maturity Return (ROP)</span>
              <span className="result-value">{formatCurrency(returnOfPremium ? totalPremium : 0)}</span>
            </div>
            <div className="result-row">
              <span className="result-label">Net Wealth Gained</span>
              <span className="result-value" style={{ color: 'var(--success)', fontWeight: 700 }}>
                {formatCurrency(netWealthGain)}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {showSchedule && (
        <div style={{ marginTop: '40px' }}>
          <DIPCorpusChart 
            monthlyList={monthlyList} 
            totalPremium={totalPremium} 
            accumMonths={M_accum} 
            deferMonths={M_defer} 
          />
          <div style={{ marginTop: '40px' }}>
            <AmortizationSchedule data={dipSchedule} isDipPlan={true} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   4. Inflation Calculator Component
   ============================================================================ */
interface InflationBarChartProps {
  baseAmount: number;
  rate: number;
  duration: number;
}

function InflationBarChart({ baseAmount, rate, duration }: InflationBarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const width = 800;
  const height = 300;
  const paddingLeft = 70;
  const paddingRight = 30;
  const paddingTop = 40;
  const paddingBottom = 50;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Generate 5 evenly spaced milestone years
  const milestoneYears: number[] = [];
  if (duration <= 4) {
    for (let y = 0; y <= duration; y++) {
      milestoneYears.push(y);
    }
  } else {
    milestoneYears.push(0);
    milestoneYears.push(Math.round(duration * 0.25));
    milestoneYears.push(Math.round(duration * 0.50));
    milestoneYears.push(Math.round(duration * 0.75));
    milestoneYears.push(duration);
  }

  const uniqueYears = Array.from(new Set(milestoneYears)).sort((a, b) => a - b);

  const data = uniqueYears.map(year => {
    const decay = baseAmount / Math.pow(1 + rate / 100, year);
    const growth = baseAmount * Math.pow(1 + rate / 100, year);
    return { year, decay, growth };
  });

  const yMax = data[data.length - 1].growth;

  const getX = (idx: number) => paddingLeft + (idx / (data.length - 1 || 1)) * chartWidth;
  const getY = (val: number) => height - paddingBottom - (val / yMax) * chartHeight;

  const barWidth = 24;
  const barSpacing = 4;

  const formatCompact = (val: number) => {
    if (val >= 10000000) return `${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toFixed(0);
  };

  const yTicks = [0, 0.25, 0.5, 0.75, 1.0].map(p => yMax * p);

  return (
    <div className="chart-container-root" style={{ position: 'relative', marginTop: '30px', padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h4 className="brand-font" style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          📊 Purchasing Power Decay vs Future Cost Escalation
        </h4>
        <div style={{ display: 'flex', gap: '20px', fontSize: '11px', fontWeight: 600 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'var(--warning)', borderRadius: '2px' }}></span>
            <span style={{ color: 'var(--text-secondary)' }}>Today's Money Worth (Decayed Value)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'var(--gold-dark)', borderRadius: '2px' }}></span>
            <span style={{ color: 'var(--text-secondary)' }}>Future Cost Required</span>
          </div>
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <svg 
          width="100%" 
          height={height} 
          viewBox={`0 0 ${width} ${height}`}
          style={{ display: 'block', overflow: 'visible' }}
        >
          {/* Horizontal Grid lines */}
          {yTicks.map((tick, i) => (
            <line key={i} x1={paddingLeft} y1={getY(tick)} x2={width - paddingRight} y2={getY(tick)} stroke="#ECEAE4" strokeDasharray="4 4" strokeWidth={1} />
          ))}

          {/* Y-axis Labels */}
          {yTicks.map((tick, i) => (
            <text key={i} x={paddingLeft - 10} y={getY(tick) + 4} textAnchor="end" fontSize="10px" fill="var(--text-secondary)" fontFamily="Montserrat, sans-serif">{formatCompact(tick)}</text>
          ))}

          {/* Render Bars and interactive hitboxes for each milestone */}
          {data.map((item, idx) => {
            const cX = getX(idx);
            
            // Coordinates for Decay Bar
            const dHeight = (item.decay / yMax) * chartHeight;
            const dY = height - paddingBottom - dHeight;
            const dX = cX - barWidth - barSpacing;

            // Coordinates for Growth Bar
            const gHeight = (item.growth / yMax) * chartHeight;
            const gY = height - paddingBottom - gHeight;
            const gX = cX + barSpacing;

            const isHovered = hoveredIdx === idx;

            return (
              <g key={idx}>
                {/* Milestone year label */}
                <text x={cX} y={height - paddingBottom + 20} textAnchor="middle" fontSize="10px" fontWeight={600} fill="var(--text-primary)" fontFamily="Montserrat, sans-serif">
                  {item.year === 0 ? 'Today (Yr 0)' : `Year ${item.year}`}
                </text>

                {/* Decay Bar */}
                <rect 
                  x={dX} 
                  y={dY} 
                  width={barWidth} 
                  height={dHeight} 
                  fill={isHovered ? 'var(--warning-hover, #D97706)' : 'var(--warning)'} 
                  rx={2}
                  style={{ transition: 'all 0.2s ease', opacity: hoveredIdx === null || isHovered ? 1 : 0.6 }}
                />

                {/* Growth Bar */}
                <rect 
                  x={gX} 
                  y={gY} 
                  width={barWidth} 
                  height={gHeight} 
                  fill={isHovered ? 'var(--gold-secondary, #C5A880)' : 'var(--gold-dark)'} 
                  rx={2}
                  style={{ transition: 'all 0.2s ease', opacity: hoveredIdx === null || isHovered ? 1 : 0.6 }}
                />

                {/* Vertical dash lines to highlight hover */}
                {isHovered && (
                  <line 
                    x1={cX} 
                    y1={paddingTop - 10} 
                    x2={cX} 
                    y2={height - paddingBottom + 5} 
                    stroke="var(--border-gold)" 
                    strokeWidth={1} 
                    strokeDasharray="3 3"
                    pointerEvents="none"
                  />
                )}

                {/* Transparent Interactive Hitbox Zone for hover */}
                <rect
                  x={cX - (chartWidth / (data.length - 1 || 1)) / 2}
                  y={paddingTop - 10}
                  width={chartWidth / (data.length - 1 || 1)}
                  height={chartHeight + 20}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{ cursor: 'pointer' }}
                />
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredIdx !== null && data[hoveredIdx] && (
          <div
            style={{
              position: 'absolute',
              left: `${Math.min(70, Math.max(10, (getX(hoveredIdx) - 110) * 100 / width))}%`,
              top: '0px',
              background: 'var(--text-primary)',
              color: '#FFFFFF',
              padding: '12px 16px',
              borderRadius: '6px',
              fontSize: '11px',
              boxShadow: 'var(--shadow-hover)',
              border: '1px solid var(--border-gold)',
              pointerEvents: 'none',
              zIndex: 100,
              fontFamily: 'Montserrat, sans-serif',
              minWidth: '220px',
              lineHeight: '1.6'
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--gold-secondary)', fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', marginBottom: '8px' }}>
              Milestone: {data[hoveredIdx].year === 0 ? 'Today (Year 0)' : `Year ${data[hoveredIdx].year}`}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
              <span>Today's Worth:</span>
              <span style={{ fontWeight: 700, color: 'var(--warning)' }}>{formatCurrency(data[hoveredIdx].decay)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', marginTop: '4px' }}>
              <span>Future Cost Required:</span>
              <span style={{ fontWeight: 700, color: 'var(--gold-secondary)' }}>{formatCurrency(data[hoveredIdx].growth)}</span>
            </div>
            <div style={{ borderTop: '1px dashed rgba(255,255,255,0.15)', marginTop: '8px', paddingTop: '6px', fontSize: '9.5px', color: 'var(--text-muted)' }}>
              Value lost: {((1 - data[hoveredIdx].decay / baseAmount) * 100).toFixed(0)}% purchasing power
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InflationCalculator() {
  const [expenses, setExpenses] = useState(75000);
  const [rate, setRate] = useState(6);
  const [years, setYears] = useState(20);

  return (
    <div>
      <div className="calculator-header">
        <h3 className="royal-title">Inflation Calculator</h3>
        <p>Understand the silent wealth killer. Calculate how much your cost of living will grow, and how paper cash loses its value.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '30px' }}>
        <StepperInput 
          label="Current Monthly Expense"
          value={expenses}
          onChange={setExpenses}
          min={1000}
          max={1000000}
          step={100}
        />
        <StepperInput 
          label="Expected Annual Inflation Rate"
          value={rate}
          onChange={setRate}
          min={1}
          max={20}
          step={0.5}
          suffix="%"
        />
        <StepperInput 
          label="Years into the Future"
          value={years}
          onChange={setYears}
          min={1}
          max={40}
          step={1}
          suffix="Years"
        />
      </div>

      <InflationBarChart baseAmount={expenses} rate={rate} duration={years} />
    </div>
  );
}

/* ============================================================================
   5. DIP vs DIY Mutual Fund Comparison Calculator Component
   ============================================================================ */
interface DIPvsSIPComparisonChartProps {
  dipSchedule: number[];
  diySchedule: number[];
  accumMonths: number;
  deferMonths: number;
}

function DIPvsSIPComparisonChart({ dipSchedule, diySchedule, accumMonths, deferMonths }: DIPvsSIPComparisonChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const totalMonths = dipSchedule.length;
  if (totalMonths === 0) return null;

  const width = 1200;
  const height = 280;
  const paddingLeft = 75;
  const paddingRight = 25;
  const paddingTop = 35;
  const paddingBottom = 45;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(
    Math.max(...dipSchedule),
    Math.max(...diySchedule)
  );
  const yMax = maxVal > 0 ? maxVal * 1.15 : 10000;

  const getX = (mIndex: number) => paddingLeft + (mIndex / (totalMonths - 1 || 1)) * chartWidth;
  const getY = (val: number) => height - paddingBottom - (val / yMax) * chartHeight;

  let dipPathD = `M ${getX(0)} ${getY(0)}`;
  dipSchedule.forEach((val, idx) => {
    dipPathD += ` L ${getX(idx)} ${getY(val)}`;
  });

  let diyPathD = `M ${getX(0)} ${getY(0)}`;
  diySchedule.forEach((val, idx) => {
    diyPathD += ` L ${getX(idx)} ${getY(val)}`;
  });

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const relativeX = x - paddingLeft;
    const pct = Math.max(0, Math.min(1, relativeX / chartWidth));
    const index = Math.round(pct * (totalMonths - 1));
    setHoverIndex(index);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const hoverX = hoverIndex !== null ? getX(hoverIndex) : 0;
  const dipHoverY = hoverIndex !== null ? getY(dipSchedule[hoverIndex]) : 0;
  const diyHoverY = hoverIndex !== null ? getY(diySchedule[hoverIndex]) : 0;

  const formatCompact = (val: number) => {
    if (val >= 10000000) return `${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toFixed(0);
  };

  const yTicks = [0, 0.25, 0.5, 0.75, 1.0].map(p => yMax * p);

  const xTickIndices: number[] = [];
  const tickStep = Math.max(1, Math.floor(totalMonths / 6));
  for (let i = 0; i < totalMonths; i += tickStep) {
    xTickIndices.push(i);
  }
  if (!xTickIndices.includes(totalMonths - 1)) {
    xTickIndices.push(totalMonths - 1);
  }

  const getPhaseName = (m: number) => {
    if (m <= accumMonths) return "Accumulation Phase";
    if (m <= accumMonths + deferMonths) return "Deferral Phase";
    return "Payout Phase";
  };

  return (
    <div className="chart-container-root" style={{ position: 'relative', marginTop: '25px', marginBottom: '25px', padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h5 className="brand-font" style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Deferred Income Plan vs DIY Mutual Fund Corpus Compare
          </h5>
          <div style={{ display: 'flex', gap: '15px', marginTop: '8px', fontSize: '11px', fontWeight: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', width: '10px', height: '10px', background: 'var(--warning)', borderRadius: '50%' }}></span>
              <span style={{ color: 'var(--text-secondary)' }}>Guaranteed DIP</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', width: '10px', height: '10px', background: 'var(--gold-dark)', borderRadius: '50%' }}></span>
              <span style={{ color: 'var(--text-secondary)' }}>DIY Mutual Fund (SIP+SWP)</span>
            </div>
          </div>
        </div>
        {hoverIndex !== null && (
          <span 
            style={{ 
              fontSize: '11px', 
              fontWeight: 600, 
              padding: '3px 8px', 
              borderRadius: '12px',
              background: 'rgba(188, 163, 116, 0.15)',
              color: 'var(--gold-dark)',
              border: '1px solid var(--border-gold)'
            }}
          >
            {getPhaseName(hoverIndex + 1)}
          </span>
        )}
      </div>

      <svg 
        width="100%" 
        height={height} 
        viewBox={`0 0 ${width} ${height}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: 'crosshair', display: 'block', overflow: 'visible' }}
      >
        {/* Background Grid Lines */}
        {yTicks.map((tick, i) => (
          <line
            key={i}
            x1={paddingLeft}
            y1={getY(tick)}
            x2={width - paddingRight}
            y2={getY(tick)}
            stroke="#ECEAE4"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
        ))}

        {/* Y-Axis Ticks */}
        {yTicks.map((tick, i) => (
          <text
            key={i}
            x={paddingLeft - 10}
            y={getY(tick) + 4}
            textAnchor="end"
            fontSize="10px"
            fill="var(--text-secondary)"
            fontFamily="Montserrat, sans-serif"
          >
            {formatCompact(tick)}
          </text>
        ))}

        {/* X-Axis Ticks */}
        {xTickIndices.map((idx, i) => (
          <text
            key={i}
            x={getX(idx)}
            y={height - paddingBottom + 16}
            textAnchor="middle"
            fontSize="10px"
            fill="var(--text-secondary)"
            fontFamily="Montserrat, sans-serif"
          >
            {idx + 1}
          </text>
        ))}

        {/* X-Axis bottom label */}
        <text 
          x={paddingLeft + chartWidth / 2} 
          y={height - 4} 
          textAnchor="middle" 
          fontSize="9px" 
          fill="var(--text-muted)" 
          fontFamily="Montserrat, sans-serif"
          letterSpacing="0.05em"
        >
          MONTH NUMBER
        </text>

        {/* Phase dividing vertical dotted lines */}
        {accumMonths > 0 && accumMonths < totalMonths && (
          <g>
            <line
              x1={getX(accumMonths - 1)}
              y1={paddingTop}
              x2={getX(accumMonths - 1)}
              y2={height - paddingBottom}
              stroke="var(--border-gold)"
              strokeDasharray="3 3"
              strokeWidth={1.5}
            />
            <text
              x={getX(accumMonths - 1) - 6}
              y={paddingTop + 15}
              textAnchor="end"
              fontSize="9px"
              fill="var(--text-muted)"
              fontWeight={600}
            >
              STOP PREMIUMS
            </text>
          </g>
        )}

        {accumMonths + deferMonths > accumMonths && accumMonths + deferMonths < totalMonths && (
          <g>
            <line
              x1={getX(accumMonths + deferMonths - 1)}
              y1={paddingTop}
              x2={getX(accumMonths + deferMonths - 1)}
              y2={height - paddingBottom}
              stroke="var(--border-gold)"
              strokeDasharray="3 3"
              strokeWidth={1.5}
            />
            <text
              x={getX(accumMonths + deferMonths - 1) + 6}
              y={paddingTop + 15}
              textAnchor="start"
              fontSize="9px"
              fill="var(--text-muted)"
              fontWeight={600}
            >
              START PAYOUTS
            </text>
          </g>
        )}

        {/* DIP curve path */}
        <path
          d={dipPathD}
          fill="none"
          stroke="var(--warning)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={hoverIndex === null ? 1 : 0.6}
          style={{ transition: 'opacity 0.2s' }}
        />

        {/* DIY curve path */}
        <path
          d={diyPathD}
          fill="none"
          stroke="var(--gold-dark)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={hoverIndex === null ? 1 : 0.6}
          style={{ transition: 'opacity 0.2s' }}
        />

        {/* Hover elements */}
        {hoverIndex !== null && (
          <>
            <line
              x1={hoverX}
              y1={paddingTop}
              x2={hoverX}
              y2={height - paddingBottom}
              stroke="var(--border-gold)"
              strokeWidth={1}
              strokeDasharray="2 2"
            />
            <circle
              cx={hoverX}
              cy={dipHoverY}
              r={5}
              fill="#FFFFFF"
              stroke="var(--warning)"
              strokeWidth={2.5}
            />
            <circle
              cx={hoverX}
              cy={diyHoverY}
              r={5}
              fill="#FFFFFF"
              stroke="var(--gold-dark)"
              strokeWidth={2.5}
            />
          </>
        )}
      </svg>

      {/* HTML Hover Tooltip */}
      {hoverIndex !== null && (
        <div
          style={{
            position: 'absolute',
            left: `${Math.min(width - 240, Math.max(paddingLeft, hoverX - 100)) * 100 / width}%`,
            top: `${Math.max(10, Math.min(dipHoverY, diyHoverY) - 85)}px`,
            background: 'var(--text-primary)',
            color: '#FFFFFF',
            padding: '10px 14px',
            borderRadius: '4px',
            fontSize: '11px',
            boxShadow: 'var(--shadow-hover)',
            border: '1px solid var(--gold-primary)',
            pointerEvents: 'none',
            zIndex: 100,
            fontFamily: 'Montserrat, sans-serif',
            minWidth: '220px',
            lineHeight: '1.5'
          }}
        >
          <div style={{ fontWeight: 600, color: 'var(--gold-secondary)', marginBottom: '5px' }}>
            Month {hoverIndex + 1} ({getPhaseName(hoverIndex + 1)})
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
            <span style={{ color: '#ECEAE4' }}>DIP Corpus:</span>
            <span style={{ fontWeight: 700, color: 'var(--warning)' }}>{formatCurrency(dipSchedule[hoverIndex])}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', marginTop: '2px' }}>
            <span style={{ color: '#ECEAE4' }}>DIY SIP Corpus:</span>
            <span style={{ fontWeight: 700, color: 'var(--gold-secondary)' }}>{formatCurrency(diySchedule[hoverIndex])}</span>
          </div>
          <div style={{ borderTop: '1px dashed rgba(255,255,255,0.15)', marginTop: '6px', paddingTop: '4px', display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
            <span style={{ color: 'var(--text-muted)' }}>DIY Edge:</span>
            <span style={{ fontWeight: 700, color: 'var(--success)' }}>
              +{formatCurrency(Math.max(0, diySchedule[hoverIndex] - dipSchedule[hoverIndex]))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function DIPvsSIPCalculator() {
  const [monthlyAmt, setMonthlyAmt] = useState(25000);
  const [accumYears, setAccumYears] = useState(15);
  const [deferYears, setDeferYears] = useState(5);
  const [payoutYears, setPayoutYears] = useState(25);
  const [returnOfPremium, setReturnOfPremium] = useState(true);

  // Growth rates
  const [growthRate, setGrowthRate] = useState(8.0); // DIP growth (accumulation & deferral)
  const [payoutRate, setPayoutRate] = useState(7.0); // DIP annuity rate
  const [sipRate, setSipRate] = useState(12.0);      // DIY SIP accumulation rate
  const [swpRate, setSwpRate] = useState(8.0);        // DIY SWP payout return rate

  const [calcParams, setCalcParams] = useState({
    monthlyAmt: 25000,
    accumYears: 15,
    deferYears: 5,
    payoutYears: 25,
    returnOfPremium: true,
    growthRate: 8.0,
    payoutRate: 7.0,
    sipRate: 12.0,
    swpRate: 8.0
  });

  const [page, setPage] = useState(1);
  const [showResults, setShowResults] = useState(false);

  // Reset page when parameters change
  useEffect(() => {
    setPage(1);
    setShowResults(false);
  }, [monthlyAmt, accumYears, deferYears, payoutYears, returnOfPremium, growthRate, payoutRate, sipRate, swpRate]);

  const M_accum = calcParams.accumYears * 12;
  const M_defer = calcParams.deferYears * 12;
  const M_payout = calcParams.payoutYears * 12;
  const M_total = M_accum + M_defer + M_payout;
  const P_total = calcParams.monthlyAmt * 12 * calcParams.accumYears;
  const FV = calcParams.returnOfPremium ? P_total : 0;

  // 1. Calculate DIP details
  const { dipFinalVal: _dipFinalVal, dipMonthlyPayout, dipTotalPayout, dipNetGain, dipSchedule } = (() => {
    let currentBalance = 0;
    const rAccum = calcParams.growthRate / 12 / 100;
    const rPayout = calcParams.payoutRate / 12 / 100;
    const monthlyList: number[] = [];

    // Accumulation
    for (let m = 1; m <= M_accum; m++) {
      currentBalance = (currentBalance + calcParams.monthlyAmt) * (1 + rAccum);
      monthlyList.push(currentBalance);
    }
    // Deferral
    for (let m = M_accum + 1; m <= M_accum + M_defer; m++) {
      currentBalance = currentBalance * (1 + rAccum);
      monthlyList.push(currentBalance);
    }
    const corpusAtPayout = currentBalance;
    // Monthly payout
    let payout = 0;
    if (M_payout > 0) {
      if (rPayout > 0) {
        const factor = Math.pow(1 + rPayout, M_payout);
        payout = (corpusAtPayout * factor - FV) * rPayout / (factor - 1);
      } else {
        payout = (corpusAtPayout - FV) / M_payout;
      }
    }
    // Payout
    let totalPayout = 0;
    for (let m = M_accum + M_defer + 1; m <= M_total; m++) {
      const opening = currentBalance;
      const interest = opening * rPayout;
      let withdrawn = payout;
      if (opening + interest < withdrawn) {
        withdrawn = opening + interest;
        currentBalance = 0;
      } else {
        currentBalance = opening + interest - withdrawn;
      }
      totalPayout += withdrawn;
      monthlyList.push(currentBalance);
    }
    return {
      dipFinalVal: returnOfPremium ? P_total : 0,
      dipMonthlyPayout: payout,
      dipTotalPayout: totalPayout,
      dipNetGain: totalPayout + (returnOfPremium ? P_total : 0) - P_total,
      dipSchedule: monthlyList
    };
  })();

  // 2. Calculate DIY Mutual Fund (SIP + SWP) details
  const { diyFinalVal, diyTotalPayout, diyNetGain: _diyNetGain, diySchedule, diyAppreciation } = (() => {
    let currentBalance = 0;
    const rSip = calcParams.sipRate / 12 / 100;
    const rSwp = calcParams.swpRate / 12 / 100;
    const monthlyList: number[] = [];

    // Accumulation
    for (let m = 1; m <= M_accum; m++) {
      currentBalance = (currentBalance + calcParams.monthlyAmt) * (1 + rSip);
      monthlyList.push(currentBalance);
    }
    // Deferral
    for (let m = M_accum + 1; m <= M_accum + M_defer; m++) {
      currentBalance = currentBalance * (1 + rSip);
      monthlyList.push(currentBalance);
    }
    // Payout
    let totalPayout = 0;
    for (let m = M_accum + M_defer + 1; m <= M_total; m++) {
      const opening = currentBalance;
      const interest = opening * rSwp;
      let withdrawn = dipMonthlyPayout;
      if (opening + interest < withdrawn) {
        withdrawn = opening + interest;
        currentBalance = 0;
      } else {
        currentBalance = opening + interest - withdrawn;
      }
      totalPayout += withdrawn;
      monthlyList.push(currentBalance);
    }

    const finalVal = currentBalance;
    const returnVal = finalVal + totalPayout - P_total;
    return {
      diyFinalVal: finalVal,
      diyTotalPayout: totalPayout,
      diyNetGain: returnVal,
      diySchedule: monthlyList,
      diyAppreciation: finalVal - (returnOfPremium ? P_total : 0)
    };
  })();

  // Generate Year-by-Year comparisons
  const yearlyComparison: Array<{
    year: number;
    dipVal: number;
    diyVal: number;
    invested: number;
  }> = [];

  for (let y = 1; y <= Math.ceil(M_total / 12); y++) {
    const endMonth = Math.min(y * 12, M_total);
    const investedSoFar = calcParams.monthlyAmt * 12 * Math.min(y, calcParams.accumYears);
    yearlyComparison.push({
      year: y,
      dipVal: dipSchedule[endMonth - 1] || 0,
      diyVal: diySchedule[endMonth - 1] || 0,
      invested: investedSoFar
    });
  }

  const diyEdge = diyFinalVal - (calcParams.returnOfPremium ? P_total : 0);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(yearlyComparison.length / itemsPerPage);
  const visibleComparison = yearlyComparison.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div>
      <div className="calculator-header">
        <h3 className="royal-title">DIP vs DIY Mutual Fund Battleground</h3>
        <p>Compare a low-risk structured Deferred Income Plan (DIP) with a DIY approach using Mutual Fund SIP + SWP. See the price of choosing guarantees over market participation.</p>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px 30px', marginBottom: '20px' }}>
          <StepperInput 
            label="Monthly Contribution"
            value={monthlyAmt}
            onChange={setMonthlyAmt}
            min={1000}
            max={1000000}
            step={500}
          />
          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label">Return of Premium (ROP) Benefit</label>
            <select 
              value={returnOfPremium ? 'yes' : 'no'}
              onChange={(e) => setReturnOfPremium(e.target.value === 'yes')}
              className="form-input-text"
              style={{ marginTop: '8px', height: '42px', padding: '0 12px' }}
            >
              <option value="yes">Yes (Return Premiums at End)</option>
              <option value="no">No (No Premium Return)</option>
            </select>
          </div>

          <StepperInput 
            label="Accumulation Phase"
            value={accumYears}
            onChange={setAccumYears}
            min={1}
            max={30}
            step={1}
            suffix="Years"
          />
          <StepperInput 
            label="Deferral Phase"
            value={deferYears}
            onChange={setDeferYears}
            min={0}
            max={20}
            step={1}
            suffix="Years"
          />
          <StepperInput 
            label="Payout Phase"
            value={payoutYears}
            onChange={setPayoutYears}
            min={1}
            max={45}
            step={1}
            suffix="Years"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginTop: '30px' }}>
          <PolishedNumberInput 
            label="DIP Growth Rate (p.a.)"
            value={growthRate}
            onChange={setGrowthRate}
            min={1}
            max={20}
            step={0.1}
          />
          <PolishedNumberInput 
            label="DIP Payout Rate (p.a.)"
            value={payoutRate}
            onChange={setPayoutRate}
            min={1}
            max={15}
            step={0.1}
          />
          <PolishedNumberInput 
            label="DIY SIP Rate (p.a.)"
            value={sipRate}
            onChange={setSipRate}
            min={1}
            max={25}
            step={0.1}
          />
          <PolishedNumberInput 
            label="DIY SWP Return (p.a.)"
            value={swpRate}
            onChange={setSwpRate}
            min={1}
            max={20}
            step={0.1}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '20px' }}>
            <button
              type="button"
              onClick={() => {
                setCalcParams({
                  monthlyAmt,
                  accumYears,
                  deferYears,
                  payoutYears,
                  returnOfPremium,
                  growthRate,
                  payoutRate,
                  sipRate,
                  swpRate
                });
                setShowResults(true);
              }}
              className="calculate-btn"
            >
              Calculate
            </button>
          </div>
        </div>
      </div>

      {!showResults ? (
        <div className="results-display-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px 20px', border: '1px dashed var(--border-gold)', background: 'var(--bg-card)', borderRadius: '8px', marginTop: '20px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', margin: 0 }}>
            Adjust strategy options and rates, then click <strong>Calculate</strong> to generate the dual-line battleground comparison report.
          </p>
        </div>
      ) : (
        <>
          {/* Side by side stats card */}
          <div className="strategy-compare-grid" style={{ marginBottom: '30px' }}>
        <div className="strategy-column">
          <h4 style={{ fontSize: '16px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Deferred Income Plan</h4>
          <div style={{ fontSize: '28px', fontWeight: 700, margin: '12px 0', color: 'var(--text-primary)' }}>
            {formatCurrency(dipMonthlyPayout)} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>/ month</span>
          </div>
          <div className="result-row">
            <span className="result-label">Total Premium Invested</span>
            <span className="result-value">{formatCurrency(P_total)}</span>
          </div>
          <div className="result-row">
            <span className="result-label">Total Payouts Received</span>
            <span className="result-value">{formatCurrency(dipTotalPayout)}</span>
          </div>
          <div className="result-row">
            <span className="result-label">End Maturity (ROP)</span>
            <span className="result-value">{formatCurrency(returnOfPremium ? P_total : 0)}</span>
          </div>
          <div className="result-row">
            <span className="result-label">Net Profit</span>
            <span className="result-value" style={{ fontWeight: 600 }}>{formatCurrency(dipNetGain)}</span>
          </div>
        </div>

        <div className="strategy-column active-best">
          <div className="best-badge">DIY Wealth Creator</div>
          <h4 style={{ fontSize: '16px', textTransform: 'uppercase', color: 'var(--gold-dark)' }}>DIY Mutual Fund SIP + SWP</h4>
          <div style={{ fontSize: '28px', fontWeight: 700, margin: '12px 0', color: 'var(--gold-dark)' }}>
            {formatCurrency(dipMonthlyPayout)} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gold-dark)' }}>/ month</span>
          </div>
          <div className="result-row">
            <span className="result-label">Total Premium Invested</span>
            <span className="result-value">{formatCurrency(P_total)}</span>
          </div>
          <div className="result-row">
            <span className="result-label">Total Payouts Extracted</span>
            <span className="result-value">{formatCurrency(diyTotalPayout)}</span>
          </div>
          <div className="result-row">
            <span className="result-label">End Maturity (Returned)</span>
            <span className="result-value">{formatCurrency(returnOfPremium ? P_total : 0)}</span>
          </div>
          <div className="result-row">
            <span className="result-label">Extra Leftover Surplus</span>
            <span className="result-value" style={{ color: 'var(--success)', fontWeight: 700 }}>
              {formatCurrency(diyAppreciation)}
            </span>
          </div>
        </div>
      </div>

      <div style={{
        background: 'var(--gold-light)',
        border: '1px solid var(--border-gold)',
        padding: '16px',
        borderRadius: '6px',
        fontSize: '13px',
        textAlign: 'center',
        color: 'var(--gold-dark)',
        fontWeight: 500
      }}>
        📈 By using DIY Mutual Funds and extracting the exact same income, you secure an extra leftover surplus corpus of <strong>{formatCurrency(diyEdge)}</strong> at the end of {payoutYears} years!
      </div>

      <DIPvsSIPComparisonChart 
        dipSchedule={dipSchedule} 
        diySchedule={diySchedule} 
        accumMonths={M_accum} 
        deferMonths={M_defer} 
      />

      {/* Comparison table */}
      <div className="comparison-table-wrapper">
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Year</th>
              <th>Invested Capital</th>
              <th>DIP Corpus Value</th>
              <th>DIY Mutual Fund Value</th>
              <th>DIY Edge</th>
            </tr>
          </thead>
          <tbody>
            {visibleComparison.map((item) => {
              const diffVal = item.diyVal - item.dipVal;
              return (
                <tr key={item.year}>
                  <td style={{ fontWeight: 600 }}>Year {item.year}</td>
                  <td>{formatCurrency(item.invested)}</td>
                  <td>{formatCurrency(item.dipVal)}</td>
                  <td style={{ color: 'var(--gold-dark)', fontWeight: 600 }}>{formatCurrency(item.diyVal)}</td>
                  <td style={{ color: diffVal >= 0 ? 'var(--success)' : 'var(--warning)', fontWeight: 700 }}>
                    {diffVal >= 0 ? '+' : ''}{formatCurrency(diffVal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination-controls" style={{ marginTop: '20px' }}>
          <button 
            type="button"
            className="pagination-btn"
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {page} of {totalPages} (Years { (page - 1) * itemsPerPage + 1 } - { Math.min(page * itemsPerPage, yearlyComparison.length) } of { yearlyComparison.length })
          </span>
          <button 
            type="button"
            className="pagination-btn"
            disabled={page === totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}
      </>
      )}
    </div>
  );
}

/* ============================================================================
   6. FD vs RD Calculator Component
   ============================================================================ */
interface FDvsRDComparisonChartProps {
  fdList: number[];
  rdList: number[];
  monthlyAmt: number;
  totalPrincipal: number;
}

function FDvsRDComparisonChart({ fdList, rdList, monthlyAmt, totalPrincipal }: FDvsRDComparisonChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const totalMonths = fdList.length - 1;
  if (totalMonths <= 0) return null;

  const width = 1200;
  const height = 280;
  const paddingLeft = 75;
  const paddingRight = 25;
  const paddingTop = 35;
  const paddingBottom = 45;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(fdList[fdList.length - 1], rdList[rdList.length - 1]);
  const yMax = maxVal > 0 ? maxVal * 1.15 : 10000;

  const getX = (mIndex: number) => paddingLeft + (mIndex / totalMonths) * chartWidth;
  const getY = (val: number) => height - paddingBottom - (val / yMax) * chartHeight;

  let fdPathD = `M ${getX(0)} ${getY(fdList[0])}`;
  fdList.forEach((val, idx) => {
    if (idx > 0) fdPathD += ` L ${getX(idx)} ${getY(val)}`;
  });

  let rdPathD = `M ${getX(0)} ${getY(rdList[0])}`;
  rdList.forEach((val, idx) => {
    if (idx > 0) rdPathD += ` L ${getX(idx)} ${getY(val)}`;
  });

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const relativeX = x - paddingLeft;
    const pct = Math.max(0, Math.min(1, relativeX / chartWidth));
    const index = Math.round(pct * totalMonths);
    setHoverIndex(index);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const hoverX = hoverIndex !== null ? getX(hoverIndex) : 0;
  const fdHoverY = hoverIndex !== null ? getY(fdList[hoverIndex]) : 0;
  const rdHoverY = hoverIndex !== null ? getY(rdList[hoverIndex]) : 0;

  const formatCompact = (val: number) => {
    if (val >= 10000000) return `${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toFixed(0);
  };

  const yTicks = [0, 0.25, 0.5, 0.75, 1.0].map(p => yMax * p);

  const xTickIndices: number[] = [];
  const tickStep = Math.max(1, Math.floor(totalMonths / 6));
  for (let i = 0; i <= totalMonths; i += tickStep) {
    xTickIndices.push(i);
  }
  if (!xTickIndices.includes(totalMonths)) {
    xTickIndices.push(totalMonths);
  }

  return (
    <div className="chart-container-root" style={{ position: 'relative', marginTop: '30px', padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h5 className="brand-font" style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            FD vs RD Balance Growth Comparison over Time
          </h5>
          <div style={{ display: 'flex', gap: '15px', marginTop: '8px', fontSize: '11px', fontWeight: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', width: '10px', height: '10px', background: 'var(--gold-dark)', borderRadius: '50%' }}></span>
              <span style={{ color: 'var(--text-secondary)' }}>Fixed Deposit (Lump Sum FD)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', width: '10px', height: '10px', background: 'var(--warning)', borderRadius: '50%' }}></span>
              <span style={{ color: 'var(--text-secondary)' }}>Recurring Deposit (Monthly RD)</span>
            </div>
          </div>
        </div>
      </div>

      <svg 
        width="100%" 
        height={height} 
        viewBox={`0 0 ${width} ${height}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: 'crosshair', display: 'block', overflow: 'visible' }}
      >
        {/* Background Grid Lines */}
        {yTicks.map((tick, i) => (
          <line
            key={i}
            x1={paddingLeft}
            y1={getY(tick)}
            x2={width - paddingRight}
            y2={getY(tick)}
            stroke="#ECEAE4"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
        ))}

        {/* Y-Axis Ticks */}
        {yTicks.map((tick, i) => (
          <text
            key={i}
            x={paddingLeft - 10}
            y={getY(tick) + 4}
            textAnchor="end"
            fontSize="10px"
            fill="var(--text-secondary)"
            fontFamily="Montserrat, sans-serif"
          >
            {formatCompact(tick)}
          </text>
        ))}

        {/* X-Axis Ticks */}
        {xTickIndices.map((idx, i) => (
          <text
            key={i}
            x={getX(idx)}
            y={height - paddingBottom + 16}
            textAnchor="middle"
            fontSize="10px"
            fill="var(--text-secondary)"
            fontFamily="Montserrat, sans-serif"
          >
            Month {idx}
          </text>
        ))}

        {/* FD curve path */}
        <path
          d={fdPathD}
          fill="none"
          stroke="var(--gold-dark)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={hoverIndex === null ? 1 : 0.6}
          style={{ transition: 'opacity 0.2s' }}
        />

        {/* RD curve path */}
        <path
          d={rdPathD}
          fill="none"
          stroke="var(--warning)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={hoverIndex === null ? 1 : 0.6}
          style={{ transition: 'opacity 0.2s' }}
        />

        {/* Hover elements */}
        {hoverIndex !== null && (
          <>
            <line
              x1={hoverX}
              y1={paddingTop}
              x2={hoverX}
              y2={height - paddingBottom}
              stroke="var(--border-gold)"
              strokeWidth={1}
              strokeDasharray="2 2"
            />
            <circle
              cx={hoverX}
              cy={fdHoverY}
              r={5}
              fill="#FFFFFF"
              stroke="var(--gold-dark)"
              strokeWidth={2.5}
            />
            <circle
              cx={hoverX}
              cy={rdHoverY}
              r={5}
              fill="#FFFFFF"
              stroke="var(--warning)"
              strokeWidth={2.5}
            />
          </>
        )}
      </svg>

      {/* HTML Hover Tooltip */}
      {hoverIndex !== null && (
        <div
          style={{
            position: 'absolute',
            left: `${Math.min(width - 240, Math.max(paddingLeft, hoverX - 100)) * 100 / width}%`,
            top: `${Math.max(10, Math.min(fdHoverY, rdHoverY) - 85)}px`,
            background: 'var(--text-primary)',
            color: '#FFFFFF',
            padding: '10px 14px',
            borderRadius: '4px',
            fontSize: '11px',
            boxShadow: 'var(--shadow-hover)',
            border: '1px solid var(--gold-primary)',
            pointerEvents: 'none',
            zIndex: 100,
            fontFamily: 'Montserrat, sans-serif',
            minWidth: '220px',
            lineHeight: '1.5'
          }}
        >
          <div style={{ fontWeight: 600, color: 'var(--gold-secondary)', marginBottom: '5px' }}>
            Month {hoverIndex} (Year {(hoverIndex / 12).toFixed(1)})
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
            <span style={{ color: '#ECEAE4' }}>FD Balance:</span>
            <span style={{ fontWeight: 700, color: 'var(--gold-secondary)' }}>{formatCurrency(fdList[hoverIndex])}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', marginTop: '2px' }}>
            <span style={{ color: '#ECEAE4' }}>RD Balance:</span>
            <span style={{ fontWeight: 700, color: 'var(--warning)' }}>{formatCurrency(rdList[hoverIndex])}</span>
          </div>
          <div style={{ borderTop: '1px dashed rgba(255,255,255,0.15)', marginTop: '6px', paddingTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', fontSize: '9.5px', color: 'var(--text-muted)' }}>
              <span>FD Invested:</span>
              <span>{formatCurrency(totalPrincipal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              <span>RD Invested:</span>
              <span>{formatCurrency(monthlyAmt * hoverIndex)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FDvsRDCalculator() {
  const [monthlyAmt, setMonthlyAmt] = useState(15000);
  const [rate, setRate] = useState(7.0);
  const [years, setYears] = useState(5);

  const [calcParams, setCalcParams] = useState({
    monthlyAmt: 15000,
    rate: 7.0,
    years: 5
  });

  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    setShowResults(false);
  }, [monthlyAmt, rate, years]);

  const totalPrincipal = calcParams.monthlyAmt * 12 * calcParams.years;

  const fdRate = calcParams.rate / 100;
  const fdMaturity = totalPrincipal * Math.pow(1 + fdRate / 4, 4 * calcParams.years);
  const fdInterest = fdMaturity - totalPrincipal;

  const quarterlyInterestRate = fdRate / 4;

  const { fdList, rdList } = (() => {
    const fds: number[] = [totalPrincipal];
    const rds: number[] = [0];

    let currentFD = totalPrincipal;
    let currentRD = 0;

    for (let m = 1; m <= calcParams.years * 12; m++) {
      currentRD += calcParams.monthlyAmt;
      if (m % 3 === 0) {
        const interestForQuarterRD = currentRD * quarterlyInterestRate;
        currentRD += interestForQuarterRD;

        const interestForQuarterFD = currentFD * quarterlyInterestRate;
        currentFD += interestForQuarterFD;
      }
      fds.push(currentFD);
      rds.push(currentRD);
    }
    return { fdList: fds, rdList: rds };
  })();

  const rdMaturity = rdList[rdList.length - 1];
  const rdInterest = rdMaturity - totalPrincipal;

  const fdVsRdDiff = fdMaturity - rdMaturity;

  return (
    <div>
      <div className="calculator-header">
        <h3 className="royal-title">Fixed Deposit (FD) vs Recurring Deposit (RD)</h3>
        <p>Compare lump sum Fixed Deposits against monthly Recurring Deposits for matching investment totals compounded quarterly.</p>
      </div>

      <div className="calculator-grid">
        {/* Left Inputs */}
        <div className="inputs-column">
          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label">Monthly RD Installment</label>
              <span className="form-value-badge">{formatCurrency(monthlyAmt)}</span>
            </div>
            <input 
              type="range" 
              min="1000" 
              max="100000" 
              step="1000"
              value={monthlyAmt}
              onChange={(e) => setMonthlyAmt(Number(e.target.value))}
              className="form-range-input"
            />
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
              *Matches with an FD of lump-sum: <strong>{formatCurrency(totalPrincipal)}</strong>
            </div>
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label">Interest Rate (% p.a.)</label>
              <span className="form-value-badge">{rate}%</span>
            </div>
            <input 
              type="range" 
              min="2" 
              max="12" 
              step="0.1"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="form-range-input"
            />
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label">Duration</label>
              <span className="form-value-badge">{years} Years</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="15" 
              step="1"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="form-range-input"
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '20px' }}>
            <button
              type="button"
              onClick={() => {
                setCalcParams({ monthlyAmt, rate, years });
                setShowResults(true);
              }}
              className="calculate-btn"
            >
              Calculate
            </button>
          </div>
        </div>

        {/* Right Outputs */}
        <div className="outputs-column">
          {!showResults ? (
          <div className="results-display-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '300px', border: '1px dashed var(--border-gold)', background: 'transparent' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', margin: 0 }}>
              Adjust inputs and click <strong>Calculate</strong> to compare FD and RD maturity benefits.
            </p>
          </div>
        ) : (
          <div className="results-display-card">
            <h4 className="brand-font">Maturity Comparison</h4>

            <div style={{
              background: 'rgba(188, 163, 116, 0.08)',
              border: '1px solid var(--gold-primary)',
              padding: '16px',
              borderRadius: '4px',
              marginBottom: '20px',
              fontSize: '12px',
              color: 'var(--text-secondary)'
            }}>
              ⚖️ <strong>Core Difference:</strong> FD earns interest on the entire <strong>{formatCurrency(totalPrincipal)}</strong> from Day 1, while RD principal is accumulated gradually over time.
            </div>

            <div className="result-row">
              <span className="result-label">Total Principal Invested</span>
              <span className="result-value">{formatCurrency(totalPrincipal)}</span>
            </div>

            <div className="result-row" style={{ paddingTop: '14px' }}>
              <span className="result-label" style={{ fontWeight: 600 }}>Lump Sum FD Maturity</span>
              <span className="result-value" style={{ color: 'var(--gold-dark)', fontWeight: 700 }}>{formatCurrency(fdMaturity)}</span>
            </div>
            <div className="result-row">
              <span className="result-label">FD Interest Earned</span>
              <span className="result-value">{formatCurrency(fdInterest)}</span>
            </div>

            <div className="result-row" style={{ paddingTop: '14px' }}>
              <span className="result-label" style={{ fontWeight: 600 }}>Monthly RD Maturity</span>
              <span className="result-value" style={{ fontWeight: 700 }}>{formatCurrency(rdMaturity)}</span>
            </div>
            <div className="result-row">
              <span className="result-label">RD Interest Earned</span>
              <span className="result-value">{formatCurrency(rdInterest)}</span>
            </div>

            <div className="result-row" style={{ borderTop: '1px dashed var(--border-gold)', marginTop: '16px', paddingTop: '12px' }}>
              <span className="result-label" style={{ fontWeight: 600 }}>FD Surplus Gain</span>
              <span className="result-value" style={{ color: 'var(--success)', fontWeight: 700 }}>+{formatCurrency(fdVsRdDiff)}</span>
            </div>
          </div>
        )}
      </div>
    </div>

      {showResults && (
        <FDvsRDComparisonChart 
          fdList={fdList} 
          rdList={rdList} 
          monthlyAmt={monthlyAmt} 
          totalPrincipal={totalPrincipal} 
        />
      )}
    </div>
  );
}
