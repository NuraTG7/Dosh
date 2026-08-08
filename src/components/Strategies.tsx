import { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  Trash2, 
  Plus, 
  Flame,
  PieChart,
  Hourglass,
  Coins
} from 'lucide-react';
import FinancialFitness from './FinancialFitness';

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
};

interface StepperInputProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  vertical?: boolean;
}

function StepperInput({ label, value, onChange, min, max, step, suffix = '', vertical = false }: StepperInputProps) {
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
    let clamped = Math.max(min, Math.min(max, num));
    
    // Snap to nearest multiple of step respecting min bounds
    const stepsCount = Math.round((clamped - min) / step);
    clamped = min + stepsCount * step;
    clamped = Math.max(min, Math.min(max, clamped));
    clamped = Number(clamped.toFixed(2));

    onChange(clamped);
    setLocalVal(clamped.toString());
  };

  return (
    <div className="form-group" style={{ marginBottom: '28px' }}>
      <div 
        className="stepper-header-row" 
        style={vertical ? { flexDirection: 'column', alignItems: 'flex-start', gap: '6px' } : {}}
      >
        <label className="form-label" style={{ margin: 0, fontSize: '11px', letterSpacing: '0.05em', color: 'var(--text-primary)', fontWeight: 600 }}>
          {label}
        </label>
        <div 
          className="stepper-input-wrapper" 
          style={vertical ? { width: '100%', minWidth: '0' } : {}}
        >
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
                onChange(val);
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

interface StrategiesProps {
  initialStrategy?: 'debt' | 'fire' | 'wellness';
  hideSidebar?: boolean;
}

export default function Strategies({ initialStrategy = 'debt', hideSidebar = false }: StrategiesProps) {
  const [activeStrategy, setActiveStrategy] = useState<'debt' | 'fire' | 'wellness'>(initialStrategy);

  const tabs = [
    { id: 'debt', label: 'Debt Repayment', desc: 'Snowball vs Avalanche', icon: ShieldAlert },
    { id: 'fire', label: 'FIRE Projections', desc: 'Retire Early Planning', icon: Flame },
    { id: 'wellness', label: 'Financial Fitness', desc: 'Complete Health Check', icon: PieChart },
  ] as const;

  return (
    <div className="subpage-layout" style={hideSidebar ? { gridTemplateColumns: '1fr' } : {}}>
      {/* Side Tabs */}
      {!hideSidebar && (
        <aside className="side-tabs-panel">
          <h3 className="side-tabs-title brand-font">Strategies</h3>
          <ul className="side-tab-list">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <li key={tab.id} className="side-tab-item">
                  <button
                    onClick={() => setActiveStrategy(tab.id)}
                    className={`side-tab-btn ${activeStrategy === tab.id ? 'active' : ''}`}
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

      {/* Main active strategy screen */}
      <main className="tab-content-panel">
        {activeStrategy === 'debt' && <DebtRepaymentStrategy />}
        {activeStrategy === 'fire' && <FIREStrategy />}
        {activeStrategy === 'wellness' && <FinancialFitness />}
      </main>
    </div>
  );
}

/* ============================================================================
   1. Debt Repayment Strategy (Snowball vs Avalanche)
   ============================================================================ */
interface Debt {
  id: string;
  name: string;
  balance: number;
  rate: number;
  tenureYears: number;
  minPayment: number; // EMI calculated from tenure
}

interface LoanBalanceChartProps {
  origList: any[];
  accList: any[];
  loanAmount: number;
  tenureYears: number;
}

function LoanBalanceChart({ origList, accList, loanAmount, tenureYears }: LoanBalanceChartProps) {
  const [hoverMonth, setHoverMonth] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const width = 1000;
  const height = 300;
  const paddingLeft = 60;
  const paddingRight = 30;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const totalMonths = tenureYears * 12;

  const getX = (m: number) => paddingLeft + ((m - 1) / (totalMonths - 1)) * chartWidth;
  const getY = (bal: number) => paddingTop + chartHeight - (bal / loanAmount) * chartHeight;

  // Path for Original (Baseline)
  let origD = "";
  let origAreaD = "";
  if (origList.length > 0) {
    origD = `M ${getX(1)} ${getY(origList[0].opening)}`;
    origList.forEach((row) => {
      origD += ` L ${getX(row.month)} ${getY(row.closing)}`;
    });
    origAreaD = `M ${getX(1)} ${getY(0)} L ${getX(1)} ${getY(origList[0].opening)} ` + 
      origList.map(row => `L ${getX(row.month)} ${getY(row.closing)}`).join(' ') + 
      ` L ${getX(origList[origList.length - 1].month)} ${getY(0)} Z`;
  }

  // Path for Accelerated (Revised Plan)
  let accD = "";
  let accAreaD = "";
  if (accList.length > 0) {
    accD = `M ${getX(1)} ${getY(accList[0].opening)}`;
    accList.forEach((row) => {
      accD += ` L ${getX(row.month)} ${getY(row.closing)}`;
    });
    accAreaD = `M ${getX(1)} ${getY(0)} L ${getX(1)} ${getY(accList[0].opening)} ` + 
      accList.map(row => `L ${getX(row.month)} ${getY(row.closing)}`).join(' ') + 
      ` L ${getX(accList[accList.length - 1].month)} ${getY(0)} Z`;
  }

  const formatCompact = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
    return `₹${val.toFixed(0)}`;
  };

  const yTicks = [0, 0.2, 0.4, 0.6, 0.8, 1.0].map(p => loanAmount * p);

  const xTicks: number[] = [];
  const stepYears = tenureYears <= 10 ? 2 : tenureYears <= 20 ? 5 : 10;
  for (let y = 0; y <= tenureYears; y += stepYears) {
    xTicks.push(y);
  }
  if (xTicks[xTicks.length - 1] !== tenureYears) {
    xTicks.push(tenureYears);
  }

  // Mouse interaction
  const handleMouseMove = (e: React.MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * width;
    const relX = svgX - paddingLeft;
    if (relX < 0 || relX > chartWidth) {
      setHoverMonth(null);
      return;
    }
    const month = Math.round(1 + (relX / chartWidth) * (totalMonths - 1));
    setHoverMonth(Math.max(1, Math.min(totalMonths, month)));
  };

  const handleMouseLeave = () => setHoverMonth(null);

  // Get closing balance at a given month
  const getBalAtMonth = (list: any[], m: number): number | null => {
    if (list.length === 0) return null;
    const exact = list.find((r: any) => r.month === m);
    if (exact) return exact.closing;
    // Beyond last month = 0
    if (m > list[list.length - 1].month) return 0;
    if (m < list[0].month) return list[0].opening;
    // Interpolate
    let before = list[0];
    let after = list[list.length - 1];
    for (let i = 0; i < list.length - 1; i++) {
      if (list[i].month <= m && list[i + 1].month >= m) {
        before = list[i];
        after = list[i + 1];
        break;
      }
    }
    const ratio = after.month === before.month ? 0 : (m - before.month) / (after.month - before.month);
    return before.closing + ratio * (after.closing - before.closing);
  };

  const origHoverBal = hoverMonth !== null ? getBalAtMonth(origList, hoverMonth) : null;
  const accHoverBal = hoverMonth !== null ? getBalAtMonth(accList, hoverMonth) : null;

  return (
    <div style={{ marginTop: '30px', background: '#FFFFFF', padding: '24px', border: '1px solid var(--border-light)', borderRadius: '12px', boxShadow: 'var(--shadow-subtle)', position: 'relative' }}>
      <h4 className="brand-font" style={{ fontSize: '13px', color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: '20px', letterSpacing: '0.08em' }}>
        LOAN OUTSTANDING BALANCE DURATION CHART
      </h4>
      
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ overflow: 'visible', cursor: 'crosshair' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <linearGradient id="origGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C62828" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#C62828" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2E7D32" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#2E7D32" stopOpacity="0.0" />
          </linearGradient>
          <filter id="singleDotGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Y-axis grid + labels */}
        {yTicks.map((val, idx) => {
          const y = getY(val);
          return (
            <g key={idx}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="var(--border-light)" strokeDasharray="3 3" />
              <text x={paddingLeft - 10} y={y + 4} textAnchor="end" style={{ fontSize: '10px', fill: 'var(--text-secondary)', fontWeight: 500 }}>
                {formatCompact(val)}
              </text>
            </g>
          );
        })}

        {/* X-axis grid + labels */}
        {xTicks.map((yr, idx) => {
          const m = yr * 12 === 0 ? 1 : yr * 12;
          const x = getX(m);
          return (
            <g key={idx}>
              <line x1={x} y1={paddingTop} x2={x} y2={height - paddingBottom} stroke="var(--border-light)" strokeDasharray="3 3" />
              <text x={x} y={height - paddingBottom + 20} textAnchor="middle" style={{ fontSize: '10px', fill: 'var(--text-secondary)', fontWeight: 500 }}>
                {yr}y
              </text>
            </g>
          );
        })}

        {/* Gradient Areas */}
        {origAreaD && <path d={origAreaD} fill="url(#origGrad)" />}
        {accAreaD && <path d={accAreaD} fill="url(#accGrad)" />}

        {/* Lines */}
        {origD && <path d={origD} fill="none" stroke="#C62828" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
        {accD && <path d={accD} fill="none" stroke="#2E7D32" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}

        {/* Axes */}
        <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={height - paddingBottom} stroke="var(--text-muted)" strokeWidth="1" />
        <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} stroke="var(--text-muted)" strokeWidth="1" />

        {/* Interactive hover elements */}
        {hoverMonth !== null && (
          <>
            {/* Vertical crosshair */}
            <line
              x1={getX(hoverMonth)}
              y1={paddingTop}
              x2={getX(hoverMonth)}
              y2={height - paddingBottom}
              stroke="var(--gold-primary)"
              strokeWidth="1"
              strokeDasharray="4 3"
              opacity="0.7"
            />

            {/* Baseline dot */}
            {origHoverBal !== null && origHoverBal > 0 && (
              <circle
                cx={getX(hoverMonth)}
                cy={getY(origHoverBal)}
                r="5"
                fill="#C62828"
                stroke="#FFFFFF"
                strokeWidth="2"
                filter="url(#singleDotGlow)"
              />
            )}

            {/* Revised dot */}
            {accHoverBal !== null && accHoverBal > 0 && (
              <circle
                cx={getX(hoverMonth)}
                cy={getY(accHoverBal)}
                r="5"
                fill="#2E7D32"
                stroke="#FFFFFF"
                strokeWidth="2"
                filter="url(#singleDotGlow)"
              />
            )}
          </>
        )}

        {/* Invisible overlay for mouse capture */}
        <rect
          x={paddingLeft}
          y={paddingTop}
          width={chartWidth}
          height={chartHeight}
          fill="transparent"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
      </svg>

      {/* Floating tooltip */}
      {hoverMonth !== null && (origHoverBal !== null || accHoverBal !== null) && (
        <div style={{
          position: 'absolute',
          left: `${((getX(hoverMonth) / width) * 100)}%`,
          top: '16px',
          transform: hoverMonth > totalMonths * 0.7 ? 'translateX(-110%)' : 'translateX(10px)',
          background: 'rgba(30, 30, 30, 0.95)',
          color: '#FFFFFF',
          padding: '14px 18px',
          borderRadius: '10px',
          fontSize: '12px',
          lineHeight: '1.7',
          pointerEvents: 'none' as const,
          zIndex: 20,
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          minWidth: '180px',
        }}>
          <div style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--gold-primary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Month {hoverMonth} <span style={{ fontWeight: 400, opacity: 0.7 }}>({(hoverMonth / 12).toFixed(1)} yrs)</span>
          </div>
          {origHoverBal !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C62828', display: 'inline-block', flexShrink: 0 }} />
              <span style={{ opacity: 0.7 }}>Baseline:</span>
              <strong>{formatCompact(origHoverBal)}</strong>
            </div>
          )}
          {accHoverBal !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2E7D32', display: 'inline-block', flexShrink: 0 }} />
              <span style={{ opacity: 0.7 }}>Revised:</span>
              <strong>{formatCompact(accHoverBal)}</strong>
            </div>
          )}
          {origHoverBal !== null && accHoverBal !== null && Math.abs(origHoverBal - accHoverBal) > 1 && (
            <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.15)', fontSize: '11px', opacity: 0.8 }}>
              Saved: {formatCompact(Math.abs(origHoverBal - accHoverBal))}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '25px', fontSize: '11px', fontWeight: 600, marginTop: '20px', color: 'var(--text-secondary)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '3px', background: '#C62828', display: 'inline-block' }}></span>
          Baseline
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '3px', background: '#2E7D32', display: 'inline-block' }}></span>
          Revised Plan
        </span>
      </div>
    </div>
  );
}

const formatTenureText = (totalMonths: number) => {
  const yrs = Math.floor(totalMonths / 12);
  const mos = totalMonths % 12;
  if (yrs > 0 && mos > 0) {
    return `${yrs} Years & ${mos} Months`;
  } else if (yrs > 0) {
    return `${yrs} Year${yrs > 1 ? 's' : ''}`;
  } else {
    return `${mos} Month${mos > 1 ? 's' : ''}`;
  }
};

interface PortfolioPaymentOrderProps {
  snowballOrder: Debt[];
  avalancheOrder: Debt[];
}

function PortfolioPaymentOrder({ snowballOrder, avalancheOrder }: PortfolioPaymentOrderProps) {
  return (
    <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      <div style={{ background: '#FFFFFF', padding: '24px', border: '1px solid var(--border-light)', borderRadius: '12px', boxShadow: 'var(--shadow-subtle)' }}>
        <h4 className="brand-font" style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.05em' }}>
          Snowball Payoff Sequence
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {snowballOrder.map((debt, idx) => (
            <div key={debt.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#C62828', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                {idx + 1}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>{debt.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Balance: <strong>{formatCurrency(debt.balance)}</strong> | Rate: <strong style={{ color: '#C62828' }}>{debt.rate}%</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: '#FFFFFF', padding: '24px', border: '1px solid var(--border-light)', borderRadius: '12px', boxShadow: 'var(--shadow-subtle)' }}>
        <h4 className="brand-font" style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.05em' }}>
          Avalanche Payoff Sequence
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {avalancheOrder.map((debt, idx) => (
            <div key={debt.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#2E7D32', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                {idx + 1}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>{debt.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Rate: <strong style={{ color: '#2E7D32' }}>{debt.rate}%</strong> | Balance: <strong>{formatCurrency(debt.balance)}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface PortfolioBalanceChartProps {
  regularList: { month: number; balance: number }[];
  snowballList: { month: number; balance: number }[];
  avalancheList: { month: number; balance: number }[];
  totalDebtAmount: number;
  maxMonths: number;
}

function PortfolioBalanceChart({ regularList, snowballList, avalancheList, totalDebtAmount, maxMonths }: PortfolioBalanceChartProps) {
  const [hoverMonth, setHoverMonth] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const width = 1000;
  const height = 300;
  const paddingLeft = 70;
  const paddingRight = 30;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const getX = (m: number) => paddingLeft + (maxMonths > 0 ? (m / maxMonths) * chartWidth : 0);
  const getY = (bal: number) => paddingTop + chartHeight - (totalDebtAmount > 0 ? (bal / totalDebtAmount) * chartHeight : 0);

  // Build path strings
  let snowballD = "";
  let snowballAreaD = "";
  if (snowballList.length > 0) {
    snowballD = `M ${getX(0)} ${getY(snowballList[0].balance)}`;
    snowballList.forEach((row) => {
      snowballD += ` L ${getX(row.month)} ${getY(row.balance)}`;
    });
    snowballAreaD = `M ${getX(0)} ${getY(0)} L ${getX(0)} ${getY(snowballList[0].balance)} ` + 
      snowballList.map(row => `L ${getX(row.month)} ${getY(row.balance)}`).join(' ') + 
      ` L ${getX(snowballList[snowballList.length - 1].month)} ${getY(0)} Z`;
  }

  // Path for Regular
  let regularD = "";
  let regularAreaD = "";
  if (regularList.length > 0) {
    regularD = `M ${getX(0)} ${getY(regularList[0].balance)}`;
    regularList.forEach((row) => {
      regularD += ` L ${getX(row.month)} ${getY(row.balance)}`;
    });
    regularAreaD = `M ${getX(0)} ${getY(0)} L ${getX(0)} ${getY(regularList[0].balance)} ` + 
      regularList.map(row => `L ${getX(row.month)} ${getY(row.balance)}`).join(' ') + 
      ` L ${getX(regularList[regularList.length - 1].month)} ${getY(0)} Z`;
  }

  let avalancheD = "";
  let avalancheAreaD = "";
  if (avalancheList.length > 0) {
    avalancheD = `M ${getX(0)} ${getY(avalancheList[0].balance)}`;
    avalancheList.forEach((row) => {
      avalancheD += ` L ${getX(row.month)} ${getY(row.balance)}`;
    });
    avalancheAreaD = `M ${getX(0)} ${getY(0)} L ${getX(0)} ${getY(avalancheList[0].balance)} ` + 
      avalancheList.map(row => `L ${getX(row.month)} ${getY(row.balance)}`).join(' ') + 
      ` L ${getX(avalancheList[avalancheList.length - 1].month)} ${getY(0)} Z`;
  }

  const formatCompact = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
    return `₹${val.toFixed(0)}`;
  };

  const yTicks = [0, 0.2, 0.4, 0.6, 0.8, 1.0].map(p => totalDebtAmount * p);

  const maxYears = Math.ceil(maxMonths / 12);
  const stepYears = maxYears <= 5 ? 1 : maxYears <= 15 ? 2 : 5;
  const xTicks: number[] = [];
  for (let y = 0; y <= maxYears; y += stepYears) {
    if (y * 12 <= maxMonths) xTicks.push(y * 12);
  }
  if (xTicks[xTicks.length - 1] < maxMonths) {
    xTicks.push(maxMonths);
  }

  // Mouse interaction handlers
  const handleMouseMove = (e: React.MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * width;
    const relX = svgX - paddingLeft;
    if (relX < 0 || relX > chartWidth) {
      setHoverMonth(null);
      return;
    }
    const month = Math.round((relX / chartWidth) * maxMonths);
    setHoverMonth(Math.max(0, Math.min(maxMonths, month)));
  };

  const handleMouseLeave = () => setHoverMonth(null);

  // Get balance at a given month from a list
  const getBalanceAtMonth = (list: { month: number; balance: number }[], m: number): number | null => {
    if (list.length === 0) return null;
    // Find exact or nearest entry
    const exact = list.find(r => r.month === m);
    if (exact) return exact.balance;
    // Interpolate between nearest points
    let before = list[0];
    let after = list[list.length - 1];
    for (let i = 0; i < list.length - 1; i++) {
      if (list[i].month <= m && list[i + 1].month >= m) {
        before = list[i];
        after = list[i + 1];
        break;
      }
    }
    if (m > list[list.length - 1].month) return 0;
    if (m < list[0].month) return list[0].balance;
    const ratio = after.month === before.month ? 0 : (m - before.month) / (after.month - before.month);
    return before.balance + ratio * (after.balance - before.balance);
  };

  const regularHoverBal = hoverMonth !== null ? getBalanceAtMonth(regularList, hoverMonth) : null;
  const snowballHoverBal = hoverMonth !== null ? getBalanceAtMonth(snowballList, hoverMonth) : null;
  const avalancheHoverBal = hoverMonth !== null ? getBalanceAtMonth(avalancheList, hoverMonth) : null;

  return (
    <div style={{ marginTop: '30px', background: '#FFFFFF', padding: '24px', border: '1px solid var(--border-light)', borderRadius: '12px', boxShadow: 'var(--shadow-subtle)', position: 'relative' }}>
      <h4 className="brand-font" style={{ fontSize: '13px', color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: '20px', letterSpacing: '0.08em' }}>
        Snowball vs Avalanche Repayment Timeline
      </h4>
      
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ overflow: 'visible', cursor: 'crosshair' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <linearGradient id="snowballGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C62828" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#C62828" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="regularGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B8860B" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#B8860B" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="avalancheGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2E7D32" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#2E7D32" stopOpacity="0.0" />
          </linearGradient>
          <filter id="dotGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Y-axis grid + labels */}
        {yTicks.map((val, idx) => {
          const y = getY(val);
          return (
            <g key={idx}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="var(--border-light)" strokeDasharray="3 3" />
              <text x={paddingLeft - 10} y={y + 4} textAnchor="end" style={{ fontSize: '10px', fill: 'var(--text-secondary)', fontWeight: 500 }}>
                {formatCompact(val)}
              </text>
            </g>
          );
        })}

        {/* X-axis grid + labels */}
        {xTicks.map((m, idx) => {
          const x = getX(m);
          const years = (m / 12).toFixed(m % 12 === 0 ? 0 : 1);
          return (
            <g key={idx}>
              <line x1={x} y1={paddingTop} x2={x} y2={height - paddingBottom} stroke="var(--border-light)" strokeDasharray="3 3" />
              <text x={x} y={height - paddingBottom + 20} textAnchor="middle" style={{ fontSize: '10px', fill: 'var(--text-secondary)', fontWeight: 500 }}>
                {m === 0 ? 'Start' : `${years}y`}
              </text>
            </g>
          );
        })}

        {/* Areas */}
        {regularAreaD && <path d={regularAreaD} fill="url(#regularGrad)" />}
        {snowballAreaD && <path d={snowballAreaD} fill="url(#snowballGrad)" />}
        {avalancheAreaD && <path d={avalancheAreaD} fill="url(#avalancheGrad)" />}

        {/* Lines */}
        {regularD && <path d={regularD} fill="none" stroke="#B8860B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 3" />}
        {snowballD && <path d={snowballD} fill="none" stroke="#C62828" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
        {avalancheD && <path d={avalancheD} fill="none" stroke="#2E7D32" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}

        {/* Axes */}
        <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={height - paddingBottom} stroke="var(--text-muted)" strokeWidth="1" />
        <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} stroke="var(--text-muted)" strokeWidth="1" />

        {/* Interactive hover elements */}
        {hoverMonth !== null && (
          <>
            {/* Vertical crosshair line */}
            <line
              x1={getX(hoverMonth)}
              y1={paddingTop}
              x2={getX(hoverMonth)}
              y2={height - paddingBottom}
              stroke="var(--gold-primary)"
              strokeWidth="1"
              strokeDasharray="4 3"
              opacity="0.7"
            />

            {/* Regular dot */}
            {regularHoverBal !== null && regularHoverBal > 0 && (
              <circle
                cx={getX(hoverMonth)}
                cy={getY(regularHoverBal)}
                r="5"
                fill="#B8860B"
                stroke="#FFFFFF"
                strokeWidth="2"
                filter="url(#dotGlow)"
              />
            )}

            {/* Snowball dot */}
            {snowballHoverBal !== null && snowballHoverBal > 0 && (
              <circle
                cx={getX(hoverMonth)}
                cy={getY(snowballHoverBal)}
                r="5"
                fill="#C62828"
                stroke="#FFFFFF"
                strokeWidth="2"
                filter="url(#dotGlow)"
              />
            )}

            {/* Avalanche dot */}
            {avalancheHoverBal !== null && avalancheHoverBal > 0 && (
              <circle
                cx={getX(hoverMonth)}
                cy={getY(avalancheHoverBal)}
                r="5"
                fill="#2E7D32"
                stroke="#FFFFFF"
                strokeWidth="2"
                filter="url(#dotGlow)"
              />
            )}
          </>
        )}

        {/* Invisible overlay to capture mouse events across the entire chart area */}
        <rect
          x={paddingLeft}
          y={paddingTop}
          width={chartWidth}
          height={chartHeight}
          fill="transparent"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
      </svg>

      {/* Floating tooltip */}
      {hoverMonth !== null && (regularHoverBal !== null || snowballHoverBal !== null || avalancheHoverBal !== null) && (
        <div style={{
          position: 'absolute',
          left: `${((getX(hoverMonth) / width) * 100)}%`,
          top: '16px',
          transform: hoverMonth > maxMonths * 0.7 ? 'translateX(-110%)' : 'translateX(10px)',
          background: 'rgba(30, 30, 30, 0.95)',
          color: '#FFFFFF',
          padding: '14px 18px',
          borderRadius: '10px',
          fontSize: '12px',
          lineHeight: '1.7',
          pointerEvents: 'none' as const,
          zIndex: 20,
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          minWidth: '180px',
        }}>
          <div style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--gold-primary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Month {hoverMonth} <span style={{ fontWeight: 400, opacity: 0.7 }}>({(hoverMonth / 12).toFixed(1)} yrs)</span>
          </div>
          {regularHoverBal !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#B8860B', display: 'inline-block', flexShrink: 0 }} />
              <span style={{ opacity: 0.7 }}>Regular:</span>
              <strong>{formatCompact(regularHoverBal)}</strong>
            </div>
          )}
          {snowballHoverBal !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C62828', display: 'inline-block', flexShrink: 0 }} />
              <span style={{ opacity: 0.7 }}>Snowball:</span>
              <strong>{formatCompact(snowballHoverBal)}</strong>
            </div>
          )}
          {avalancheHoverBal !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2E7D32', display: 'inline-block', flexShrink: 0 }} />
              <span style={{ opacity: 0.7 }}>Avalanche:</span>
              <strong>{formatCompact(avalancheHoverBal)}</strong>
            </div>
          )}
          {regularHoverBal !== null && avalancheHoverBal !== null && Math.abs(regularHoverBal - avalancheHoverBal) > 0 && (
            <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.15)', fontSize: '11px', opacity: 0.8 }}>
              Saved: {formatCompact(Math.abs(regularHoverBal - avalancheHoverBal))}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '25px', fontSize: '11px', fontWeight: 600, marginTop: '20px', color: 'var(--text-secondary)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '3px', background: '#B8860B', display: 'inline-block', borderTop: '1px dashed #B8860B' }}></span>
          Regular (Min. Only)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '3px', background: '#C62828', display: 'inline-block' }}></span>
          Debt Snowball
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '3px', background: '#2E7D32', display: 'inline-block' }}></span>
          Debt Avalanche
        </span>
      </div>
    </div>
  );
}

interface PortfolioComparisonTableProps {
  snowballMonths: number;
  snowballInterest: number;
  avalancheMonths: number;
  avalancheInterest: number;
}

function PortfolioComparisonTable({ snowballMonths, snowballInterest, avalancheMonths, avalancheInterest }: PortfolioComparisonTableProps) {
  const interestDiff = Math.abs(snowballInterest - avalancheInterest);
  const monthsDiff = Math.abs(snowballMonths - avalancheMonths);
  
  const metrics = [
    {
      metric: 'Payoff Duration',
      snowball: `${snowballMonths} Months (${(snowballMonths / 12).toFixed(1)} Years)`,
      avalanche: `${avalancheMonths} Months (${(avalancheMonths / 12).toFixed(1)} Years)`,
      diff: monthsDiff === 0 ? 'Identical' : `${monthsDiff} Month${monthsDiff > 1 ? 's' : ''} faster for ${avalancheMonths < snowballMonths ? 'Avalanche' : 'Snowball'}`,
      highlight: monthsDiff > 0 && (avalancheMonths < snowballMonths)
    },
    {
      metric: 'Total Interest Accrued',
      snowball: formatCurrency(snowballInterest),
      avalanche: formatCurrency(avalancheInterest),
      diff: interestDiff === 0 ? 'Identical' : `${formatCurrency(interestDiff)} saved for ${avalancheInterest < snowballInterest ? 'Avalanche' : 'Snowball'}`,
      highlight: interestDiff > 0 && (avalancheInterest < snowballInterest)
    },
    {
      metric: 'Average Cost of Debt (APY)',
      snowball: 'Calculated dynamically',
      avalanche: 'Optimized via high-interest payoff',
      diff: 'Avalanche targets high rates first to reduce average cost',
      highlight: false
    }
  ];

  return (
    <div style={{ marginTop: '30px', background: '#FFFFFF', padding: '24px', border: '1px solid var(--border-light)', borderRadius: '12px', boxShadow: 'var(--shadow-subtle)' }}>
      <h4 className="brand-font" style={{ fontSize: '13px', color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: '20px', letterSpacing: '0.08em' }}>
        Strategies Comparison Analysis
      </h4>
      <div className="comparison-table-wrapper" style={{ marginTop: 0 }}>
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Metric / Attribute</th>
              <th>Debt Snowball</th>
              <th>Debt Avalanche</th>
              <th>Net Advantage</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((row, idx) => (
              <tr key={idx} style={row.highlight ? { backgroundColor: 'rgba(46, 125, 50, 0.03)' } : {}}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.metric}</td>
                <td>{row.snowball}</td>
                <td>{row.avalanche}</td>
                <td style={row.highlight ? { color: '#2E7D32', fontWeight: 600 } : { color: 'var(--text-secondary)' }}>
                  {row.diff}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DebtRepaymentStrategy() {
  const [debtMode, setDebtMode] = useState<'single' | 'portfolio'>('single');

  // ==========================================
  // Single Loan Mode State
  // ==========================================
  const [loanAmount, setLoanAmount] = useState(1500000);
  const [interestRate, setInterestRate] = useState(9.0);
  const [tenureYears, setTenureYears] = useState(15);
  
  // Cheat Codes
  const [extraEmisPerYear, setExtraEmisPerYear] = useState(0);
  const [annualStepUp, setAnnualStepUp] = useState(0);
  const [lumpsumAmount, setLumpsumAmount] = useState(0);
  const [lumpsumPaidInMonth, setLumpsumPaidInMonth] = useState(12);
  const [prepaymentMode, setPrepaymentMode] = useState<'tenure' | 'emi'>('tenure');

  // Table options
  const [showScheduleTable, setShowScheduleTable] = useState(false);
  const [scheduleType, setScheduleType] = useState<'yearly' | 'monthly'>('yearly');
  const [scheduleScope, setScheduleScope] = useState<'original' | 'accelerated'>('original');
  const [showSingleResults, setShowSingleResults] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setShowSingleResults(false);
    setCurrentPage(1);
  }, [loanAmount, interestRate, tenureYears, extraEmisPerYear, annualStepUp, lumpsumAmount, lumpsumPaidInMonth, prepaymentMode]);

  useEffect(() => {
    setCurrentPage(1);
  }, [scheduleType, scheduleScope]);

  // ==========================================
  // Portfolio Mode State
  // ==========================================
  const calcEmi = (principal: number, annualRate: number, years: number): number => {
    const r = annualRate / 100 / 12;
    const n = years * 12;
    if (r === 0) return principal / n;
    const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return emi;
  };

  const [debts, setDebts] = useState<Debt[]>([
    { id: '1', name: 'Personal Loan (Remove if not needed)', balance: 200000, rate: 12, tenureYears: 5, minPayment: calcEmi(200000, 12, 5) },
  ]);

  const [newName, setNewName] = useState('');
  const [newBalance, setNewBalance] = useState('');
  const [newRate, setNewRate] = useState('');
  const [newTenure, setNewTenure] = useState(0);
  const [extraBudget, setExtraBudget] = useState(15000);

  const addDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newBalance || !newRate || !newTenure) return;
    const tenure = newTenure;
    const emi = calcEmi(parseFloat(newBalance), parseFloat(newRate), tenure);
    const debt: Debt = {
      id: Date.now().toString(),
      name: newName,
      balance: parseFloat(newBalance),
      rate: parseFloat(newRate),
      tenureYears: tenure,
      minPayment: emi
    };
    setDebts([...debts, debt]);
    setNewName('');
    setNewBalance('');
    setNewRate('');
    setNewTenure(0);
  };

  const removeDebt = (id: string) => {
    setDebts(debts.filter(d => d.id !== id));
  };

  // ==========================================
  // Single Loan Math Calculations
  // ==========================================
  const getSingleLoanData = () => {
    const r = interestRate / 100 / 12;
    const totalMonths = tenureYears * 12;
    
    let emi = 0;
    if (r > 0) {
      emi = (loanAmount * r * Math.pow(1 + r, totalMonths)) / (Math.pow(1 + r, totalMonths) - 1);
    } else {
      emi = loanAmount / totalMonths;
    }
    
    // 1. Original Schedule
    let origList: any[] = [];
    let bOrig = loanAmount;
    let totalIntOrig = 0;
    
    for (let m = 1; m <= totalMonths; m++) {
      if (bOrig <= 0) break;
      const interest = bOrig * r;
      const principal = Math.max(0, Math.min(emi - interest, bOrig));
      const extra = 0;
      const closing = Math.max(0, bOrig - principal);
      
      origList.push({
        month: m,
        year: Math.floor((m - 1) / 12) + 1,
        opening: bOrig,
        payment: principal + interest,
        interest,
        principal,
        extra,
        closing
      });
      totalIntOrig += interest;
      bOrig = closing;
    }
    
    // 2. Accelerated Schedule
    let accList: any[] = [];
    let bAcc = loanAmount;
    let totalIntAcc = 0;
    let currentEmi = emi;
    
    for (let m = 1; m <= totalMonths; m++) {
      if (bAcc <= 0) break;
      
      const year = Math.floor((m - 1) / 12) + 1;
      let activeEmi = currentEmi;
      if (prepaymentMode === 'tenure') {
        activeEmi = emi * Math.pow(1 + annualStepUp / 100, year - 1);
      }
      
      const interest = bAcc * r;
      
      let extra = 0;
      if (m % 12 === 0 && extraEmisPerYear > 0) {
        extra += extraEmisPerYear * emi;
      }
      if (m === lumpsumPaidInMonth && lumpsumAmount > 0) {
        extra += lumpsumAmount;
      }
      
      const standardPrincipal = Math.max(0, Math.min(activeEmi - interest, bAcc));
      const totalPrincipal = Math.max(0, Math.min(standardPrincipal + extra, bAcc));
      const actualPayment = totalPrincipal + interest;
      const closing = Math.max(0, bAcc - totalPrincipal);
      
      accList.push({
        month: m,
        year,
        opening: bAcc,
        payment: actualPayment,
        interest,
        principal: totalPrincipal - extra,
        extra,
        closing
      });
      totalIntAcc += interest;
      bAcc = closing;

      if (prepaymentMode === 'emi' && extra > 0 && bAcc > 0) {
        const remainingMonths = totalMonths - m;
        if (remainingMonths > 0) {
          if (r > 0) {
            currentEmi = (bAcc * r * Math.pow(1 + r, remainingMonths)) / (Math.pow(1 + r, remainingMonths) - 1);
          } else {
            currentEmi = bAcc / remainingMonths;
          }
        }
      }
    }
    
    const origMonths = origList.length;
    const accMonths = accList.length;
    const yearsSaved = Math.max(0, (origMonths - accMonths) / 12);
    const interestSaved = Math.max(0, totalIntOrig - totalIntAcc);
    
    return {
      emi,
      origMonths,
      accMonths,
      totalIntOrig,
      totalIntAcc,
      yearsSaved,
      interestSaved,
      origList,
      accList
    };
  };

  const singleLoan = getSingleLoanData();

  // Pie chart calculation based on scheduleScope
  const activeInterest = scheduleScope === 'original' ? singleLoan.totalIntOrig : singleLoan.totalIntAcc;
  const totalPaid = loanAmount + activeInterest;
  const principalPct = totalPaid > 0 ? (loanAmount / totalPaid) * 100 : 50;
  const interestPct = totalPaid > 0 ? (activeInterest / totalPaid) * 100 : 50;

  // Donut SVG arc calculations
  const circ = 2 * Math.PI * 40;
  const principalDash = (principalPct / 100) * circ;
  const interestDash = (interestPct / 100) * circ;

  // ==========================================
  // Portfolio mode Math Calculations
  // ==========================================
  const totalMinPayments = debts.reduce((sum, d) => sum + d.minPayment, 0);

  const simulateRepayment = (method: 'snowball' | 'avalanche') => {
    if (debts.length === 0) return { months: 0, totalInterest: 0, history: [] };
    
    let currentDebts = debts.map(d => ({ ...d, currentBalance: d.balance }));
    let months = 0;
    let totalInterest = 0;
    let maxSimulationMonths = 360;
    let history: { month: number; balance: number }[] = [];

    // Add initial month 0 balance
    const initialBalance = debts.reduce((sum, d) => sum + d.balance, 0);
    history.push({ month: 0, balance: initialBalance });

    while (currentDebts.some(d => d.currentBalance > 0) && months < maxSimulationMonths) {
      months++;
      let monthlyAvailable = totalMinPayments + extraBudget;
      
      currentDebts = currentDebts.map(d => {
        if (d.currentBalance <= 0) return d;
        const interestAccrued = d.currentBalance * (d.rate / 100 / 12);
        totalInterest += interestAccrued;
        
        let payment = Math.min(d.minPayment, d.currentBalance + interestAccrued);
        let nextBalance = d.currentBalance + interestAccrued - payment;
        monthlyAvailable -= payment;
        return { ...d, currentBalance: nextBalance };
      });

      const activeDebts = currentDebts.filter(d => d.currentBalance > 0);
      if (activeDebts.length > 0) {
        if (method === 'snowball') {
          activeDebts.sort((a, b) => a.currentBalance - b.currentBalance);
        } else {
          activeDebts.sort((a, b) => b.rate - a.rate);
        }

        let targetDebt = activeDebts[0];
        const matchIdx = currentDebts.findIndex(d => d.id === targetDebt.id);
        if (matchIdx !== -1 && monthlyAvailable > 0) {
          const extraPay = Math.min(monthlyAvailable, currentDebts[matchIdx].currentBalance);
          currentDebts[matchIdx].currentBalance -= extraPay;
        }
      }

      const totalRemaining = currentDebts.reduce((sum, d) => sum + Math.max(0, d.currentBalance), 0);
      history.push({ month: months, balance: totalRemaining });
    }

    return { months, totalInterest, history };
  };

  const snowballResult = simulateRepayment('snowball');
  const avalancheResult = simulateRepayment('avalanche');

  // Regular repayment: just minimum payments, no extra budget, no strategy
  const simulateRegular = () => {
    if (debts.length === 0) return { months: 0, totalInterest: 0, history: [] as { month: number; balance: number }[] };
    let currentDebts = debts.map(d => ({ ...d, currentBalance: d.balance }));
    let months = 0;
    let totalInterest = 0;
    const maxSimulationMonths = 360;
    const history: { month: number; balance: number }[] = [];
    const initialBalance = debts.reduce((sum, d) => sum + d.balance, 0);
    history.push({ month: 0, balance: initialBalance });

    while (currentDebts.some(d => d.currentBalance > 0) && months < maxSimulationMonths) {
      months++;
      currentDebts = currentDebts.map(d => {
        if (d.currentBalance <= 0) return d;
        const interestAccrued = d.currentBalance * (d.rate / 100 / 12);
        totalInterest += interestAccrued;
        const payment = Math.min(d.minPayment, d.currentBalance + interestAccrued);
        return { ...d, currentBalance: d.currentBalance + interestAccrued - payment };
      });
      const totalRemaining = currentDebts.reduce((sum, d) => sum + Math.max(0, d.currentBalance), 0);
      history.push({ month: months, balance: totalRemaining });
    }
    return { months, totalInterest, history };
  };
  const regularResult = simulateRegular();

  const portfolioInterestSaved = Math.max(0, regularResult.totalInterest - avalancheResult.totalInterest);
  const portfolioTimeSaved = Math.max(0, regularResult.months - avalancheResult.months);

  // Amortization table renderer helper
  const getTableRows = () => {
    const rawList = scheduleScope === 'original' ? singleLoan.origList : singleLoan.accList;
    if (scheduleType === 'monthly') {
      return rawList.map((row: any) => ({
        period: `Month ${row.month}`,
        opening: row.opening,
        payment: row.payment,
        interest: row.interest,
        principal: row.principal,
        extra: row.extra,
        closing: row.closing
      }));
    } else {
      const yearlyMap: { [key: number]: any } = {};
      rawList.forEach((row: any) => {
        const y = row.year;
        if (!yearlyMap[y]) {
          yearlyMap[y] = {
            period: `Year ${y}`,
            opening: row.opening,
            payment: 0,
            interest: 0,
            principal: 0,
            extra: 0,
            closing: row.closing
          };
        }
        yearlyMap[y].payment += row.payment;
        yearlyMap[y].interest += row.interest;
        yearlyMap[y].principal += row.principal;
        yearlyMap[y].extra += row.extra;
        yearlyMap[y].closing = row.closing;
      });
      return Object.values(yearlyMap);
    }
  };

  const activeTableRows = getTableRows() || [];
  const rowsPerPage = 12;
  const totalPages = scheduleType === 'monthly' ? Math.ceil(activeTableRows.length / rowsPerPage) : 1;
  const paginatedTableRows = scheduleType === 'monthly' ? activeTableRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage) : activeTableRows;

  return (
    <div>
      <div className="calculator-header">
        <h3 className="royal-title">Dosh Sovereign Debt Planner</h3>
        <p>Calculate your true interest cost and build your strategic debt payoff escape plan.</p>
      </div>

      {/* Mode segmented control */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '35px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0',
          background: '#F8F6F1',
          padding: '5px',
          borderRadius: '14px',
          border: '1px solid var(--border-gold)',
          width: '100%',
          maxWidth: '460px',
          position: 'relative' as const,
        }}>
          <button
            type="button"
            onClick={() => setDebtMode('single')}
            style={{
              padding: '14px 20px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '12px',
              fontWeight: debtMode === 'single' ? 700 : 500,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.06em',
              margin: 0,
              cursor: 'pointer',
              background: debtMode === 'single' ? '#FFFFFF' : 'transparent',
              color: debtMode === 'single' ? 'var(--gold-dark)' : 'var(--text-muted)',
              boxShadow: debtMode === 'single' ? '0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px var(--border-gold)' : 'none',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              fontFamily: "'Montserrat', sans-serif",
              display: 'flex',
              flexDirection: 'column' as const,
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>Individual Liability</span>
            <span style={{ fontSize: '10px', fontWeight: 400, letterSpacing: '0.02em', opacity: 0.7, textTransform: 'none' as const }}>
              Single loan analysis
            </span>
          </button>
          <button
            type="button"
            onClick={() => setDebtMode('portfolio')}
            style={{
              padding: '14px 20px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '12px',
              fontWeight: debtMode === 'portfolio' ? 700 : 500,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.06em',
              margin: 0,
              cursor: 'pointer',
              background: debtMode === 'portfolio' ? '#FFFFFF' : 'transparent',
              color: debtMode === 'portfolio' ? 'var(--gold-dark)' : 'var(--text-muted)',
              boxShadow: debtMode === 'portfolio' ? '0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px var(--border-gold)' : 'none',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              fontFamily: "'Montserrat', sans-serif",
              display: 'flex',
              flexDirection: 'column' as const,
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>Multiple Loans</span>
            <span style={{ fontSize: '10px', fontWeight: 400, letterSpacing: '0.02em', opacity: 0.7, textTransform: 'none' as const }}>
              Portfolio strategy
            </span>
          </button>
        </div>
      </div>

      {debtMode === 'single' ? (
        // =========================================================
        // SINGLE LOAN WRAPPER
        // =========================================================
        <div style={{ maxWidth: '1060px', margin: '0 auto' }}>
          
          {/* Main Grid: Inputs on left, outputs on right */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px', marginBottom: '35px' }}>
            
            {/* Left Inputs column */}
            <div style={{ background: '#FFFFFF', padding: '30px', border: '1px solid var(--border-light)', borderRadius: '12px', boxShadow: 'var(--shadow-subtle)' }}>
              <h4 className="brand-font" style={{ fontSize: '13px', color: 'var(--gold-dark)', textTransform: 'uppercase', marginBottom: '25px', letterSpacing: '0.08em', borderBottom: '1px solid var(--border-gold)', paddingBottom: '8px' }}>
                Liability Parameters
              </h4>
              
              <StepperInput 
                label="LOAN AMOUNT"
                value={loanAmount}
                onChange={setLoanAmount}
                min={10000}
                max={100000000}
                step={500}
                suffix="₹"
              />
              
              <StepperInput 
                label="INTEREST RATE"
                value={interestRate}
                onChange={setInterestRate}
                min={1}
                max={30}
                step={0.1}
                suffix="%"
              />
              
              <StepperInput 
                label="TENURE"
                value={tenureYears}
                onChange={setTenureYears}
                min={1}
                max={40}
                step={1}
                suffix="Years"
              />
            </div>
            
            {/* Right Outputs column */}
            <div className="outputs-column" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="results-display-card" style={{ background: '#FFFFFF', border: '1.5px solid var(--border-gold-strong)', borderRadius: '12px', padding: '30px', boxShadow: 'var(--shadow-medium)', height: '100%' }}>
                <h4 className="brand-font" style={{ fontSize: '13px', color: 'var(--gold-dark)', textTransform: 'uppercase', marginBottom: '15px', borderBottom: '1px solid var(--border-gold)', paddingBottom: '10px' }}>
                  Projected Debt Burden
                </h4>
                
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em', fontWeight: 600 }}>Standard Monthly EMI</span>
                  <div style={{ fontSize: '38px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Montserrat, sans-serif', marginTop: '4px' }}>
                    {formatCurrency(singleLoan.emi)}
                  </div>
                </div>
                
                {/* 3 cards grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '25px' }}>
                  <div style={{ background: 'var(--gold-light)', border: '1px solid var(--border-gold)', borderLeft: '4px solid var(--gold-primary)', padding: '12px 6px', borderRadius: '8px', textAlign: 'center' }}>
                    <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Outstanding Principal</span>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>{formatCurrency(loanAmount)}</div>
                  </div>
                  <div style={{ background: 'var(--gold-light)', border: '1px solid var(--border-gold)', borderLeft: '4px solid #C62828', padding: '12px 6px', borderRadius: '8px', textAlign: 'center' }}>
                    <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#C62828', fontWeight: 600 }}>Interest Payable</span>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#C62828', marginTop: '4px' }}>{formatCurrency(activeInterest)}</div>
                  </div>
                  <div style={{ background: 'var(--gold-light)', border: '1px solid var(--border-gold)', borderLeft: '4px solid var(--gold-dark)', padding: '12px 6px', borderRadius: '8px', textAlign: 'center' }}>
                    <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--gold-dark)', fontWeight: 600 }}>Cumulative Repayment</span>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gold-dark)', marginTop: '4px' }}>{formatCurrency(totalPaid)}</div>
                  </div>
                </div>
                
                {/* SVG Donut with inner Dial text */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: 'auto 0' }}>
                  <svg width="150" height="150" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--border-light)" strokeWidth="10" />
                    
                    {/* Principal circle */}
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--gold-primary)" strokeWidth="10"
                      strokeDasharray={`${principalDash} ${circ - principalDash}`}
                      strokeDashoffset="0"
                      strokeLinecap="round"
                    />
                    
                    {/* Interest circle */}
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#C62828" strokeWidth="10"
                      strokeDasharray={`${interestDash} ${circ - interestDash}`}
                      strokeDashoffset={-principalDash}
                      strokeLinecap="round"
                    />

                    {/* Upright Text overlay inside the SVG dial */}
                    <g style={{ transform: 'rotate(90deg)', transformOrigin: '50px 50px' }}>
                      <text x="50" y="47" textAnchor="middle" style={{ fontSize: '10px', fontWeight: 800, fill: 'var(--text-primary)', fontFamily: 'Montserrat, sans-serif' }}>
                        {interestPct.toFixed(0)}%
                      </text>
                      <text x="50" y="58" textAnchor="middle" style={{ fontSize: '6px', fontWeight: 600, fill: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Interest Cost
                      </text>
                    </g>
                  </svg>
                  
                  {/* Legend */}
                  <div style={{ display: 'flex', gap: '20px', fontSize: '11px', fontWeight: 600, marginTop: '20px', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', background: 'var(--gold-primary)', borderRadius: '50%' }}></span>
                      Principal ({principalPct.toFixed(0)}%)
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', background: '#C62828', borderRadius: '50%' }}></span>
                      Interest ({interestPct.toFixed(0)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Accelerator Panel: Cheat codes */}
          <div style={{ background: '#FFFFFF', padding: '30px', border: '1px solid var(--border-light)', borderRadius: '12px', boxShadow: 'var(--shadow-subtle)', marginBottom: '35px' }}>
            <h4 className="brand-font" style={{ fontSize: '13px', color: 'var(--gold-dark)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.08em' }}>
              Repayment Accelerators
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '25px' }}>Inject additional cash flows to reduce your interest liability and compress tenure.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '25px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
              <StepperInput 
                label="EXTRA YEARLY EMIS"
                value={extraEmisPerYear}
                onChange={setExtraEmisPerYear}
                min={0}
                max={12}
                step={1}
                suffix="EMIs"
              />
              
              <StepperInput 
                label="ANNUAL EMI STEP-UP"
                value={annualStepUp}
                onChange={setAnnualStepUp}
                min={0}
                max={50}
                step={1}
                suffix="%"
              />
            </div>
            
            <h5 className="brand-font" style={{ fontSize: '11px', color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.08em' }}>
              Windfall Prepayments
            </h5>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>Got a bonus or surplus cash? Inject a one-time prepay to collapse your balance.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '25px' }}>
              <StepperInput 
                label="LUMPSUM AMOUNT"
                value={lumpsumAmount}
                onChange={setLumpsumAmount}
                min={0}
                max={10000000}
                step={500}
                suffix="₹"
              />
              
              <StepperInput 
                label="PAID IN MONTH"
                value={lumpsumPaidInMonth}
                onChange={setLumpsumPaidInMonth}
                min={1}
                max={tenureYears * 12}
                step={1}
                suffix="Month"
              />
            </div>
            
            {/* Choose Prepayment Optimization Pathway (Tenure vs EMI reducing visual cards) */}
            <div style={{ marginTop: '25px', borderTop: '1px solid var(--border-light)', paddingTop: '25px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '15px' }}>
                Choose Prepayment Optimization Pathway
              </span>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                {/* Tenure Reducing Card (Left) */}
                <div 
                  onClick={() => setPrepaymentMode('tenure')}
                  style={{
                    background: prepaymentMode === 'tenure' ? 'var(--gold-light)' : '#FFFFFF',
                    border: prepaymentMode === 'tenure' ? '2px solid var(--gold-primary)' : '1.5px solid var(--border-light)',
                    borderRadius: '12px',
                    padding: '24px',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    boxShadow: prepaymentMode === 'tenure' ? 'var(--shadow-medium)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    position: 'relative'
                  }}
                >
                  {prepaymentMode === 'tenure' && (
                    <span style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--gold-primary)', color: '#FFFFFF', fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Selected
                    </span>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      background: prepaymentMode === 'tenure' ? 'var(--gold-primary)' : 'var(--bg-tertiary)', 
                      color: prepaymentMode === 'tenure' ? '#FFFFFF' : 'var(--gold-dark)',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}>
                      <Hourglass size={18} />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 750, color: prepaymentMode === 'tenure' ? 'var(--gold-dark)' : 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      Tenure Reducing
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                    Extra payments directly reduce the principal balance. The monthly installment remains standard, forcing the payoff timeline to collapse.
                  </p>
                  <div style={{ fontSize: '11px', color: prepaymentMode === 'tenure' ? '#2E7D32' : 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: 'auto' }}>
                    ðŸŽ¯ Ideal for maximum interest savings
                  </div>
                </div>

                {/* EMI Reducing Card (Right) */}
                <div 
                  onClick={() => setPrepaymentMode('emi')}
                  style={{
                    background: prepaymentMode === 'emi' ? 'var(--gold-light)' : '#FFFFFF',
                    border: prepaymentMode === 'emi' ? '2px solid var(--gold-primary)' : '1.5px solid var(--border-light)',
                    borderRadius: '12px',
                    padding: '24px',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    boxShadow: prepaymentMode === 'emi' ? 'var(--shadow-medium)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    position: 'relative'
                  }}
                >
                  {prepaymentMode === 'emi' && (
                    <span style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--gold-primary)', color: '#FFFFFF', fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Selected
                    </span>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      background: prepaymentMode === 'emi' ? 'var(--gold-primary)' : 'var(--bg-tertiary)', 
                      color: prepaymentMode === 'emi' ? '#FFFFFF' : 'var(--gold-dark)',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}>
                      <Coins size={18} />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 750, color: prepaymentMode === 'emi' ? 'var(--gold-dark)' : 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      EMI Reducing
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                    Extra payments reduce principal balance, triggering the bank to recalculate a smaller monthly standard EMI. Payoff timeline remains constant.
                  </p>
                  <div style={{ fontSize: '11px', color: prepaymentMode === 'emi' ? '#2E7D32' : 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: 'auto' }}>
                    ðŸŽ¯ Ideal for releasing monthly liquidity
                  </div>
                </div>
              </div>

              {/* Action Button: Calculate & Compare Escape Plan */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowSingleResults(true);
                    setTimeout(() => {
                      const compEl = document.getElementById('sovereign-comparison-dashboard');
                      if (compEl) {
                        compEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }, 100);
                  }}
                  className="btn-royal-gold"
                  style={{
                    padding: '16px 40px',
                    fontSize: '13px',
                    fontWeight: 750,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    borderRadius: '6px',
                    boxShadow: 'var(--shadow-medium)'
                  }}
                >
                  Calculate & Compare Escape Plan
                </button>
              </div>
            </div>
          </div>
          
          {/* Comparison summary cards and Line Chart */}
          {showSingleResults && (
            <div id="sovereign-comparison-dashboard" style={{ marginBottom: '35px' }}>
              {/* Row 1: Baseline vs Revised Plan */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                {/* Baseline Card */}
                <div style={{ background: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '24px', boxShadow: 'var(--shadow-subtle)' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>BASELINE</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '12px 0 6px 0', color: 'var(--text-primary)', fontWeight: 600, fontSize: '15px' }}>
                    ðŸ“… {formatTenureText(singleLoan.origMonths)}
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#C62828', fontFamily: 'Montserrat, sans-serif' }}>
                    {formatCurrency(singleLoan.totalIntOrig)}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Interest</span>
                </div>

                {/* Revised Plan Card */}
                <div style={{ background: 'var(--gold-light)', border: '1.5px solid var(--gold-primary)', borderRadius: '12px', padding: '24px', boxShadow: 'var(--shadow-medium)' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gold-dark)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>REVISED PLAN</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '12px 0 6px 0', color: 'var(--gold-dark)', fontWeight: 700, fontSize: '15px' }}>
                    ðŸ“… {formatTenureText(singleLoan.accMonths)}
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#2E7D32', fontFamily: 'Montserrat, sans-serif' }}>
                    {formatCurrency(singleLoan.totalIntAcc)}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Revised Total Interest</span>
                </div>
              </div>

              {/* Row 2: Early Finish vs Wealth Preserved */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                {/* Early Finish Card */}
                <div style={{ background: 'rgba(46, 125, 50, 0.04)', border: '1px solid rgba(46, 125, 50, 0.25)', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#2E7D32', textTransform: 'uppercase', letterSpacing: '0.05em' }}>EARLY FINISH</span>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#2E7D32', marginTop: '6px' }}>
                    {formatTenureText(singleLoan.origMonths - singleLoan.accMonths)} Saved!
                  </div>
                </div>

                {/* Wealth Preserved Card */}
                <div style={{ background: 'rgba(46, 125, 50, 0.04)', border: '1px solid rgba(46, 125, 50, 0.25)', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                  <span style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, color: '#2E7D32', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    WEALTH PRESERVED
                    <span title="Wealth preserved by making prepayments" style={{ cursor: 'help', border: '1px solid #2E7D32', borderRadius: '50%', width: '12px', height: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px' }}>i</span>
                  </span>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#2E7D32', marginTop: '6px' }}>
                    {formatCurrency(singleLoan.interestSaved)} Saved!
                  </div>
                </div>
              </div>

              {/* Loan Balance Line Chart */}
              <LoanBalanceChart 
                origList={singleLoan.origList}
                accList={singleLoan.accList}
                loanAmount={loanAmount}
                tenureYears={tenureYears}
              />
            </div>
          )}
          
          {/* Amortization table dropdown */}
          {showSingleResults && (
            <div style={{ background: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '24px', boxShadow: 'var(--shadow-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
              <h4 className="brand-font" style={{ fontSize: '13px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PieChart size={16} style={{ color: 'var(--gold-dark)' }} />
                Amortization Schedule
              </h4>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {/* Yearly vs Monthly pills */}
                <div style={{ display: 'inline-flex', background: 'var(--bg-tertiary)', padding: '2px', borderRadius: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setScheduleType('yearly')}
                    style={{
                      padding: '4px 12px',
                      fontSize: '10px',
                      fontWeight: 600,
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      background: scheduleType === 'yearly' ? 'var(--gold-grad-1)' : 'transparent',
                      color: scheduleType === 'yearly' ? '#FFFFFF' : 'var(--text-secondary)'
                    }}
                  >
                    Yearly
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleType('monthly')}
                    style={{
                      padding: '4px 12px',
                      fontSize: '10px',
                      fontWeight: 600,
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      background: scheduleType === 'monthly' ? 'var(--gold-grad-1)' : 'transparent',
                      color: scheduleType === 'monthly' ? '#FFFFFF' : 'var(--text-secondary)'
                    }}
                  >
                    Monthly
                  </button>
                </div>
                
                {/* Original vs Accelerated pills */}
                <div style={{ display: 'inline-flex', background: 'var(--bg-tertiary)', padding: '2px', borderRadius: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setScheduleScope('original')}
                    style={{
                      padding: '4px 12px',
                      fontSize: '10px',
                      fontWeight: 600,
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      background: scheduleScope === 'original' ? 'var(--gold-grad-1)' : 'transparent',
                      color: scheduleScope === 'original' ? '#FFFFFF' : 'var(--text-secondary)'
                    }}
                  >
                    Original
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleScope('accelerated')}
                    style={{
                      padding: '4px 12px',
                      fontSize: '10px',
                      fontWeight: 600,
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      background: scheduleScope === 'accelerated' ? 'var(--gold-grad-1)' : 'transparent',
                      color: scheduleScope === 'accelerated' ? '#FFFFFF' : 'var(--text-secondary)'
                    }}
                  >
                    Accelerated
                  </button>
                </div>
                
                <button
                  type="button"
                  onClick={() => setShowScheduleTable(!showScheduleTable)}
                  className="btn-gold-outline"
                  style={{ padding: '6px 16px', fontSize: '11px', textTransform: 'uppercase', borderRadius: '4px' }}
                >
                  {showScheduleTable ? 'Hide Table ▲' : 'Show Table ▼'}
                </button>
              </div>
            </div>
            
            {showScheduleTable && (
              <>
                <div className="comparison-table-wrapper" style={{ marginTop: '20px', maxHeight: '400px', overflowY: 'auto' }}>
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th>Opening Balance</th>
                      <th>EMI Payment</th>
                      <th>Interest Component</th>
                      <th>Principal Component</th>
                      <th>Extra Payment</th>
                      <th>Closing Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTableRows.map((row: any, idx: number) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{row.period}</td>
                        <td>{formatCurrency(row.opening)}</td>
                        <td>{formatCurrency(row.payment)}</td>
                        <td style={{ color: '#C62828' }}>{formatCurrency(row.interest)}</td>
                        <td style={{ color: 'var(--text-primary)' }}>{formatCurrency(row.principal)}</td>
                        <td style={{ color: 'var(--success)', fontWeight: row.extra > 0 ? 600 : 400 }}>{formatCurrency(row.extra)}</td>
                        <td style={{ fontWeight: 600 }}>{formatCurrency(row.closing)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              {scheduleType === 'monthly' && totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '20px',
                  padding: '12px 20px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-light)'
                }}>
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="btn-gold-outline"
                    style={{
                      padding: '8px 16px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      opacity: currentPage === 1 ? 0.4 : 1,
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    ◀ Previous Year
                  </button>
                  
                  <span style={{ fontSize: '12px', fontWeight: 650, color: 'var(--text-secondary)' }}>
                    Year {currentPage} of {totalPages} &nbsp;
                    <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({activeTableRows.length} Months Total)</span>
                  </span>
                  
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="btn-gold-outline"
                    style={{
                      padding: '8px 16px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      opacity: currentPage === totalPages ? 0.4 : 1,
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Next Year ▶
                  </button>
                </div>
              )}
            </>
          )}
          </div>
          )}
        </div>
      ) : (
        // =========================================================
        // LOAN PORTFOLIO WRAPPER
        // =========================================================
        <div style={{ maxWidth: '1060px', margin: '0 auto' }}>
          {/* Add current debts builder */}
          <div className="debt-builder-card" style={{ background: '#FFFFFF', padding: '30px', border: '1px solid var(--border-light)', borderRadius: '12px', boxShadow: 'var(--shadow-subtle)' }}>
            <h4 className="brand-font" style={{ fontSize: '13px', color: 'var(--gold-dark)', textTransform: 'uppercase', marginBottom: '20px', letterSpacing: '0.08em', borderBottom: '1px solid var(--border-gold)', paddingBottom: '8px' }}>
              Add Current Debts
            </h4>
            <form onSubmit={addDebt} className="debt-input-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1.2fr auto', gap: '15px', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Home Loan" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                  className="form-input-text" 
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Balance (₹)</label>
                <input 
                  type="number" 
                  placeholder="Balance" 
                  value={newBalance} 
                  onChange={e => setNewBalance(e.target.value)} 
                  className="form-input-text" 
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Interest (%)</label>
                <input 
                  type="number" 
                  placeholder="Interest" 
                  value={newRate} 
                  onChange={e => setNewRate(e.target.value)} 
                  className="form-input-text" 
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Tenure (Yrs)</label>
                <input 
                  type="number" 
                  placeholder="Years" 
                  value={newTenure || ''} 
                  onChange={e => setNewTenure(Number(e.target.value))} 
                  className="form-input-text" 
                  min={1}
                  max={40}
                />
              </div>
              <button type="submit" className="btn-royal-gold" style={{ padding: '14px 20px', borderRadius: '4px', textTransform: 'none' }}>
                <Plus size={16} />
              </button>
            </form>
          </div>

          {/* List of debts */}
          <div className="debt-list" style={{ marginTop: '30px' }}>
            <h4 className="brand-font" style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.05em' }}>
              Your Portfolio of Debts
            </h4>
            {debts.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontStyle: 'italic' }}>No active debts added. Add debts above to calculate repayment plans.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {debts.map(debt => (
                  <div key={debt.id} className="debt-item-badge" style={{ background: '#FFFFFF', border: '1px solid var(--border-light)', padding: '16px 20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{debt.name}</span>
                    <div className="debt-item-details" style={{ display: 'flex', gap: '30px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <span>Balance: <strong>{formatCurrency(debt.balance)}</strong></span>
                      <span>Interest: <strong style={{ color: '#C62828' }}>{debt.rate}%</strong></span>
                      <span>EMI: <strong>{formatCurrency(debt.minPayment)}</strong></span>
                    </div>
                    <button onClick={() => removeDebt(debt.id)} className="debt-remove-btn" style={{ padding: '8px', color: '#C62828', background: 'none', border: 'none', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payoff budget slider */}
          <div style={{ padding: '24px', border: '1.5px solid var(--border-gold-strong)', borderRadius: '12px', background: 'var(--gold-light)', marginTop: '35px', marginBottom: '35px' }}>
            <StepperInput 
              label="ADDITIONAL MONTHLY DEBT PAYOFF BUDGET"
              value={extraBudget}
              onChange={setExtraBudget}
              min={0}
              max={100000}
              step={500}
              suffix="₹"
            />
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              *Total monthly payment allocation: <strong>{formatCurrency(totalMinPayments + extraBudget)}</strong> (Minimums: {formatCurrency(totalMinPayments)} + Extra: {formatCurrency(extraBudget)})
            </div>
          </div>

          {/* Results comparisons */}
          <div className="strategy-compare-grid" style={{ marginTop: '30px' }}>
            <div className="strategy-column" style={{ background: '#FFFFFF', padding: '24px', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>Debt Snowball</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>Paying smallest balance first builds immediate psychological momentum.</p>
              
              <div className="result-row">
                <span className="result-label">Time to Debt-Free</span>
                <span className="result-value" style={{ fontWeight: 600 }}>{snowballResult.months} Months</span>
              </div>
              <div className="result-row">
                <span className="result-label">Total Interest Paid</span>
                <span className="result-value">{formatCurrency(snowballResult.totalInterest)}</span>
              </div>
            </div>

            <div className="strategy-column active-best" style={{ background: 'var(--gold-light)', padding: '24px', border: '1.5px solid var(--gold-primary)', borderRadius: '8px', position: 'relative' }}>
              <div className="best-badge" style={{ background: 'var(--gold-grad-1)', color: '#FFFFFF', padding: '4px 10px', fontSize: '9px', fontWeight: 700, borderRadius: '12px', position: 'absolute', top: '-10px', right: '20px' }}>
                Math Champion
              </div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gold-dark)', marginBottom: '8px' }}>Debt Avalanche</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Targeting highest interest rate first saves the maximum money.</p>
              
              <div className="result-row">
                <span className="result-label">Time to Debt-Free</span>
                <span className="result-value-highlight" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--gold-dark)' }}>{avalancheResult.months} Months</span>
              </div>
              <div className="result-row">
                <span className="result-label">Total Interest Paid</span>
                <span className="result-value-highlight" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--gold-dark)' }}>{formatCurrency(avalancheResult.totalInterest)}</span>
              </div>
            </div>
          </div>

          {debts.length > 0 && portfolioInterestSaved > 0 && (
            <div style={{
              background: 'rgba(46, 125, 50, 0.08)',
              border: '1.5px solid var(--success)',
              padding: '18px',
              borderRadius: '8px',
              marginTop: '30px',
              fontSize: '13px',
              textAlign: 'center',
              color: 'var(--success)',
              fontWeight: 500
            }}>
              ðŸŽ¯ <strong>Avalanche Edge:</strong> By selecting the Avalanche method, you will save <strong>{formatCurrency(portfolioInterestSaved)}</strong> in interest fees and finish paying off debt <strong>{portfolioTimeSaved} months</strong> earlier!
            </div>
          )}

          {debts.length > 0 && (
            <>
              {/* Order to Pay sequence */}
              <PortfolioPaymentOrder 
                snowballOrder={[...debts].sort((a, b) => a.balance - b.balance)} 
                avalancheOrder={[...debts].sort((a, b) => b.rate - a.rate)} 
              />

              {/* VS Graph */}
              <PortfolioBalanceChart 
                regularList={regularResult.history}
                snowballList={snowballResult.history}
                avalancheList={avalancheResult.history}
                totalDebtAmount={debts.reduce((sum, d) => sum + d.balance, 0)}
                maxMonths={Math.max(regularResult.months, snowballResult.months, avalancheResult.months)}
              />

              {/* Comparison Table */}
              <PortfolioComparisonTable 
                snowballMonths={snowballResult.months}
                snowballInterest={snowballResult.totalInterest}
                avalancheMonths={avalancheResult.months}
                avalancheInterest={avalancheResult.totalInterest}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   2. FIRE (Financial Independence, Retire Early) Projections
   ============================================================================ */
function FIREStrategy() {
  const [fireType, setFireType] = useState<'lean' | 'normal' | 'fat'>('lean');
  const [showBlueprint, setShowBlueprint] = useState(false);
  
  // Input parameters
  const [currentAge, setCurrentAge] = useState(30);
  const [targetAge, setTargetAge] = useState(50);
  
  // Contributions (Left Column)
  const [basicSalary, setBasicSalary] = useState(100000); // 12% is EPF
  const [contribNps, setContribNps] = useState(5000);
  const [contribSip, setContribSip] = useState(40000);

  // Yields (Right Column)
  const [yieldEpf, setYieldEpf] = useState(8.5);
  const [yieldNps, setYieldNps] = useState(10);
  const [yieldSip, setYieldSip] = useState(12);

  // Current existing savings
  const [savingsEpf, setSavingsEpf] = useState(250000);
  const [savingsNps, setSavingsNps] = useState(50000);
  const [savingsSip, setSavingsSip] = useState(1500000);

  // Macro Parameters
  const [monthlyExpense, setMonthlyExpense] = useState(80000);
  const [inflation, setInflation] = useState(6);
  const [lifeExp, setLifeExp] = useState(85);

  const yearsToRetire = Math.max(0, targetAge - currentAge);

  // Reset showBlueprint when inputs or fireType change
  useEffect(() => {
    setShowBlueprint(false);
  }, [
    currentAge, targetAge, monthlyExpense, inflation, lifeExp, fireType,
    basicSalary, contribNps, contribSip, yieldEpf, yieldNps, yieldSip,
    savingsEpf, savingsNps, savingsSip
  ]);

  // Year-by-year math simulation
  const getSimulatedData = () => {
    const list: Array<{
      age: number;
      epf: number;
      nps: number;
      sip: number;
      total: number;
      epfInvested: number;
      npsInvested: number;
      sipInvested: number;
    }> = [];

    let epfBal = savingsEpf;
    let npsBal = savingsNps;
    let sipBal = savingsSip;

    const rEpf = yieldEpf / 12 / 100;
    const rNps = yieldNps / 12 / 100;
    const rSip = yieldSip / 12 / 100;

    const epfMonthly = basicSalary * 0.12;

    list.push({
      age: currentAge,
      epf: Math.round(epfBal),
      nps: Math.round(npsBal),
      sip: Math.round(sipBal),
      total: Math.round(epfBal + npsBal + sipBal),
      epfInvested: 0,
      npsInvested: 0,
      sipInvested: 0
    });

    for (let y = 1; y <= yearsToRetire; y++) {
      for (let m = 1; m <= 12; m++) {
        epfBal = (epfBal + epfMonthly) * (1 + rEpf);
        npsBal = (npsBal + contribNps) * (1 + rNps);
        sipBal = (sipBal + contribSip) * (1 + rSip);
      }
      
      list.push({
        age: currentAge + y,
        epf: Math.round(epfBal),
        nps: Math.round(npsBal),
        sip: Math.round(sipBal),
        total: Math.round(epfBal + npsBal + sipBal),
        epfInvested: Math.round(epfMonthly * 12 * y),
        npsInvested: Math.round(contribNps * 12 * y),
        sipInvested: Math.round(contribSip * 12 * y)
      });
    }

    return list;
  };

  const simulatedData = getSimulatedData();
  const finalYearData = simulatedData[simulatedData.length - 1] || {
    epf: savingsEpf,
    nps: savingsNps,
    sip: savingsSip,
    total: savingsEpf + savingsNps + savingsSip,
    epfInvested: 0,
    npsInvested: 0,
    sipInvested: 0
  };

  const totalProjectedSavings = finalYearData.total;

  const getFireDetails = (multiplier: number) => {
    const futureMonthlyExpense = monthlyExpense * Math.pow(1 + inflation / 100, yearsToRetire);
    const annualRetirementExpense = futureMonthlyExpense * 12;
    
    // Target corpus is direct multiplier of annual retirement expenses
    const fireNumber = annualRetirementExpense * multiplier;

    const fireGap = Math.max(0, fireNumber - totalProjectedSavings);

    // bridging monthly savings uses yieldSip as interest rate
    let requiredMonthlySavings = 0;
    if (fireGap > 0 && yearsToRetire > 0) {
      const monthlyPreRate = yieldSip / 12 / 100;
      const months = yearsToRetire * 12;
      requiredMonthlySavings = fireGap / (((Math.pow(1 + monthlyPreRate, months) - 1) / monthlyPreRate) * (1 + monthlyPreRate));
    }

    return {
      futureMonthlyExpense,
      fireNumber,
      projectedSavings: totalProjectedSavings,
      fireGap,
      requiredMonthlySavings,
      isFireAchieved: totalProjectedSavings >= fireNumber
    };
  };

  const leanDetails = getFireDetails(20);
  const normalDetails = getFireDetails(25);
  const fatDetails = getFireDetails(30);

  const activeDetails = fireType === 'lean' ? leanDetails : fireType === 'normal' ? normalDetails : fatDetails;

  return (
    <div>
      <div className="calculator-header">
        <h3 className="royal-title">Financial Independence Retire Early (FIRE) Builder</h3>
        <p>Find your magic index. Project how much capital you need to secure early retirement and live off investment dividends.</p>
      </div>

      <div className="fire-form-container" style={{ maxWidth: '1060px', margin: '0 auto', background: '#FFFFFF', padding: '30px', border: '1px solid var(--border-light)', borderRadius: '8px', boxShadow: 'var(--shadow-subtle)' }}>
        {/* 1. Classifications */}
        <label className="form-label" style={{ marginBottom: '12px', display: 'block', fontSize: '13px' }}>Select FIRE Classification</label>
        <div className="fire-classification-selector" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '30px' }}>
          <button
            type="button"
            onClick={() => setFireType('lean')}
            className={`option-btn ${fireType === 'lean' ? 'selected' : ''}`}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '16px 10px', height: '100%' }}
          >
            <span style={{ fontWeight: 800, fontSize: '18px', color: 'var(--gold-dark)', display: 'block', marginBottom: '4px' }}>Lean FIRE</span>
            <span style={{ fontSize: '10px', opacity: 0.8, color: 'var(--text-secondary)' }}>20x of Annual Expense</span>
            <span style={{ fontSize: '13px', fontWeight: 600, marginTop: '8px', color: 'var(--text-primary)' }}>
              {formatCurrency(monthlyExpense * 12 * 20)}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFireType('normal')}
            className={`option-btn ${fireType === 'normal' ? 'selected' : ''}`}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '16px 10px', height: '100%' }}
          >
            <span style={{ fontWeight: 800, fontSize: '18px', color: 'var(--gold-dark)', display: 'block', marginBottom: '4px' }}>Normal FIRE</span>
            <span style={{ fontSize: '10px', opacity: 0.8, color: 'var(--text-secondary)' }}>25x of Annual Expense</span>
            <span style={{ fontSize: '13px', fontWeight: 600, marginTop: '8px', color: 'var(--text-primary)' }}>
              {formatCurrency(monthlyExpense * 12 * 25)}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFireType('fat')}
            className={`option-btn ${fireType === 'fat' ? 'selected' : ''}`}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '16px 10px', height: '100%' }}
          >
            <span style={{ fontWeight: 800, fontSize: '18px', color: 'var(--gold-dark)', display: 'block', marginBottom: '4px' }}>Fat FIRE</span>
            <span style={{ fontSize: '10px', opacity: 0.8, color: 'var(--text-secondary)' }}>30x of Annual Expense</span>
            <span style={{ fontSize: '13px', fontWeight: 600, marginTop: '8px', color: 'var(--text-primary)' }}>
              {formatCurrency(monthlyExpense * 12 * 30)}
            </span>
          </button>
        </div>

        {/* 2. Age Parameters */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <StepperInput 
            label="CURRENT AGE"
            value={currentAge}
            onChange={setCurrentAge}
            min={1}
            max={100}
            step={1}
            suffix="yrs"
          />
          <StepperInput 
            label="RETIREMENT AGE TARGET"
            value={targetAge}
            onChange={(val) => setTargetAge(Math.max(currentAge, val))}
            min={currentAge}
            max={100}
            step={1}
            suffix="yrs"
          />
        </div>

        {/* 3. Contributions and Yields Sub-sections */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '20px' }}>
          {/* Left Column: Contributions */}
          <div style={{ borderRight: '1px solid var(--border-light)', paddingRight: '20px' }}>
            <h4 className="brand-font" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gold-dark)', textTransform: 'uppercase', marginBottom: '20px', letterSpacing: '0.08em' }}>
              CONTRIBUTIONS (MONTHLY)
            </h4>
            
            <StepperInput 
              label="BASIC SALARY (EPF: 12%)"
              value={basicSalary}
              onChange={setBasicSalary}
              min={10000}
              max={500000}
              step={500}
              suffix="₹"
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '-20px', marginBottom: '20px', display: 'block' }}>
              EPF monthly contribution: <strong>{formatCurrency(basicSalary * 0.12)}</strong>
            </span>

            <StepperInput 
              label="NPS MONTHLY CONTRIBUTION"
              value={contribNps}
              onChange={setContribNps}
              min={0}
              max={100000}
              step={500}
              suffix="₹"
            />

            <StepperInput 
              label="SIP MONTHLY CONTRIBUTION"
              value={contribSip}
              onChange={setContribSip}
              min={0}
              max={500000}
              step={500}
              suffix="₹"
            />
          </div>

          {/* Right Column: Expected Yields */}
          <div>
            <h4 className="brand-font" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gold-dark)', textTransform: 'uppercase', marginBottom: '20px', letterSpacing: '0.08em' }}>
              RETURNS EXPECTED (P.A.)
            </h4>

            <StepperInput 
              label="EPF YIELD %"
              value={yieldEpf}
              onChange={setYieldEpf}
              min={1}
              max={25}
              step={0.1}
              suffix="%"
            />

            <StepperInput 
              label="NPS YIELD %"
              value={yieldNps}
              onChange={setYieldNps}
              min={1}
              max={25}
              step={0.1}
              suffix="%"
            />

            <StepperInput 
              label="SIP YIELD %"
              value={yieldSip}
              onChange={setYieldSip}
              min={1}
              max={25}
              step={0.1}
              suffix="%"
            />
          </div>
        </div>

        {/* 4. Current Existing Savings */}
        <h4 className="brand-font" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gold-dark)', textTransform: 'uppercase', marginTop: '30px', marginBottom: '20px', letterSpacing: '0.08em' }}>
          CURRENT EXISTING SAVINGS
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          <StepperInput 
            label="EPF BALANCE"
            value={savingsEpf}
            onChange={setSavingsEpf}
            min={0}
            max={50000000}
            step={500}
            suffix="₹"
            vertical={true}
          />
          <StepperInput 
            label="NPS BALANCE"
            value={savingsNps}
            onChange={setSavingsNps}
            min={0}
            max={50000000}
            step={500}
            suffix="₹"
            vertical={true}
          />
          <StepperInput 
            label="SIP BALANCE"
            value={savingsSip}
            onChange={setSavingsSip}
            min={0}
            max={50000000}
            step={500}
            suffix="₹"
            vertical={true}
          />
        </div>

        {/* Expenses parameter */}
        <div style={{ marginTop: '20px' }}>
          <StepperInput 
            label="CURRENT MONTHLY EXPENSES"
            value={monthlyExpense}
            onChange={setMonthlyExpense}
            min={5000}
            max={500000}
            step={500}
            suffix="₹"
          />
        </div>

        {/* 5. Macro Parameters */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
          <StepperInput 
            label="INFLATION %"
            value={inflation}
            onChange={setInflation}
            min={0}
            max={15}
            step={0.5}
            suffix="%"
          />
          <StepperInput 
            label="LIFE EXPECTANCY"
            value={lifeExp}
            onChange={(val) => setLifeExp(Math.max(targetAge + 1, val))}
            min={targetAge + 1}
            max={110}
            step={1}
            suffix="yrs"
          />
        </div>

        {/* Calculate button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
          <button
            type="button"
            onClick={() => setShowBlueprint(true)}
            className="calculate-btn"
            style={{ width: '100%', maxWidth: '300px', padding: '14px 28px', fontSize: '14px' }}
          >
            Calculate FIRE Blueprint
          </button>
        </div>
      </div>

      {showBlueprint && (
        <div className="fire-results-container" style={{ maxWidth: '1060px', margin: '40px auto 0 auto' }}>
          {/* Asset Projected Cards Grid (exactly like image) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '35px' }}>
            {/* EPF Card */}
            <div style={{ background: '#111111', border: '1px solid #333333', padding: '24px', borderRadius: '12px', position: 'relative', color: '#FFFFFF' }}>
              <span style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '10px', background: 'rgba(255,255,255,0.08)', padding: '4px 8px', borderRadius: '4px', opacity: 0.8 }}>
                {yieldEpf}%
              </span>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 600 }}>EPF</span>
              <div style={{ fontSize: '26px', fontWeight: 800, margin: '12px 0 16px 0', color: '#FFFFFF', fontFamily: 'Montserrat, sans-serif' }}>
                {formatCurrency(finalYearData.epf)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                <div>Monthly: <strong>{formatCurrency(basicSalary * 0.12)}</strong></div>
                <div>Invested: <strong>{formatCurrency(finalYearData.epfInvested)}</strong></div>
                <div>Today's value: <strong>{formatCurrency(savingsEpf)}</strong></div>
              </div>
            </div>

            {/* NPS Card */}
            <div style={{ background: '#111111', border: '1px solid #333333', padding: '24px', borderRadius: '12px', position: 'relative', color: '#FFFFFF' }}>
              <span style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '10px', background: 'rgba(255,255,255,0.08)', padding: '4px 8px', borderRadius: '4px', opacity: 0.8 }}>
                {yieldNps}%
              </span>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 600 }}>NPS</span>
              <div style={{ fontSize: '26px', fontWeight: 800, margin: '12px 0 16px 0', color: '#FFFFFF', fontFamily: 'Montserrat, sans-serif' }}>
                {formatCurrency(finalYearData.nps)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                <div>Monthly: <strong>{formatCurrency(contribNps)}</strong></div>
                <div>Invested: <strong>{formatCurrency(finalYearData.npsInvested)}</strong></div>
                <div>Today's value: <strong>{formatCurrency(savingsNps)}</strong></div>
              </div>
            </div>

            {/* SIP Card */}
            <div style={{ background: '#111111', border: '1.5px solid #10B981', padding: '24px', borderRadius: '12px', position: 'relative', color: '#FFFFFF' }}>
              <span style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '10px', background: 'rgba(16,185,129,0.15)', color: '#10B981', padding: '4px 8px', borderRadius: '4px', fontWeight: 600 }}>
                {yieldSip}%
              </span>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 600 }}>SIP</span>
              <div style={{ fontSize: '26px', fontWeight: 800, margin: '12px 0 16px 0', color: '#10B981', fontFamily: 'Montserrat, sans-serif' }}>
                {formatCurrency(finalYearData.sip)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                <div>Monthly: <strong>{formatCurrency(contribSip)}</strong></div>
                <div>Invested: <strong>{formatCurrency(finalYearData.sipInvested)}</strong></div>
                <div>Today's value: <strong>{formatCurrency(savingsSip)}</strong></div>
              </div>
            </div>
          </div>

          <div className="results-display-card" style={{ background: 'var(--gold-light)', border: '1px solid var(--border-gold)', padding: '35px', borderRadius: '8px' }}>
            <h4 className="brand-font" style={{ textAlign: 'center', fontSize: '20px', marginBottom: '24px' }}>Your FIRE Blueprint</h4>

            {/* Classification side-by-side targets */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '30px' }}>
              <div style={{ padding: '15px', background: fireType === 'lean' ? 'rgba(188, 163, 116, 0.15)' : 'rgba(255, 255, 255, 0.5)', borderRadius: '6px', textAlign: 'center', border: fireType === 'lean' ? '1.5px solid var(--gold-primary)' : '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Lean FIRE (20x)</span>
                <div style={{ fontSize: '16px', fontWeight: 700, margin: '6px 0', color: 'var(--gold-dark)' }}>{formatCurrency(leanDetails.fireNumber)}</div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {leanDetails.isFireAchieved ? '✓ Achieved' : `Gap: ${formatCurrency(leanDetails.fireGap)}`}
                </span>
              </div>
              <div style={{ padding: '15px', background: fireType === 'normal' ? 'rgba(188, 163, 116, 0.15)' : 'rgba(255, 255, 255, 0.5)', borderRadius: '6px', textAlign: 'center', border: fireType === 'normal' ? '1.5px solid var(--gold-primary)' : '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Normal FIRE (25x)</span>
                <div style={{ fontSize: '16px', fontWeight: 700, margin: '6px 0', color: 'var(--gold-dark)' }}>{formatCurrency(normalDetails.fireNumber)}</div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {normalDetails.isFireAchieved ? '✓ Achieved' : `Gap: ${formatCurrency(normalDetails.fireGap)}`}
                </span>
              </div>
              <div style={{ padding: '15px', background: fireType === 'fat' ? 'rgba(188, 163, 116, 0.15)' : 'rgba(255, 255, 255, 0.5)', borderRadius: '6px', textAlign: 'center', border: fireType === 'fat' ? '1.5px solid var(--gold-primary)' : '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Fat FIRE (30x)</span>
                <div style={{ fontSize: '16px', fontWeight: 700, margin: '6px 0', color: 'var(--gold-dark)' }}>{formatCurrency(fatDetails.fireNumber)}</div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {fatDetails.isFireAchieved ? '✓ Achieved' : `Gap: ${formatCurrency(fatDetails.fireGap)}`}
                </span>
              </div>
            </div>

            <div className="result-row">
              <span className="result-label">Retirement Target Timeline</span>
              <span className="result-value">In {yearsToRetire} Years (Age {targetAge})</span>
            </div>
            <div className="result-row">
              <span className="result-label">Inflation-Adjusted Monthly Cost</span>
              <span className="result-value">{formatCurrency(activeDetails.futureMonthlyExpense)}</span>
            </div>
            <div className="result-row">
              <span className="result-label">Target {fireType.toUpperCase()} FIRE Corpus</span>
              <span className="result-value-highlight">{formatCurrency(activeDetails.fireNumber)}</span>
            </div>
            <div className="result-row">
              <span className="result-label">Projected Base Corpus</span>
              <span className="result-value">{formatCurrency(activeDetails.projectedSavings)}</span>
            </div>

            {activeDetails.isFireAchieved ? (
              <div style={{
                background: 'rgba(46, 125, 50, 0.08)',
                border: '1px solid var(--success)',
                padding: '16px',
                borderRadius: '4px',
                marginTop: '20px',
                color: 'var(--success)',
                fontSize: '13px',
                fontWeight: 600,
                textAlign: 'center'
              }}>
                🎉 Congratulations! Your projected investments will satisfy your {fireType.toUpperCase()} FIRE number. You are set for financial freedom!
              </div>
            ) : (
              <div style={{
                background: 'rgba(142, 112, 63, 0.05)',
                border: '1px solid var(--gold-primary)',
                padding: '16px',
                borderRadius: '4px',
                marginTop: '20px',
                fontSize: '13px',
                color: 'var(--text-primary)'
              }}>
                💡 To close your corpus deficit of <strong>{formatCurrency(activeDetails.fireGap)}</strong>, you must invest an additional <strong>{formatCurrency(activeDetails.requiredMonthlySavings)}</strong> monthly until you reach {targetAge}.
              </div>
            )}
          </div>

          {/* Graph visual */}
          <StackedWealthChart data={simulatedData} />
        </div>
      )}
    </div>
  );
}

// Add the helper function formatCompactRupee and StackedWealthChart component below/outside FIREStrategy:

const formatCompactRupee = (val: number) => {
  if (val === 0) return '₹0';
  if (val >= 10000000) {
    return `₹${(val / 10000000).toFixed(1)}Cr`;
  }
  if (val >= 100000) {
    return `₹${(val / 100000).toFixed(1)}L`;
  }
  if (val >= 1000) {
    return `₹${(val / 1000).toFixed(0)}K`;
  }
  return `₹${val}`;
};

interface StackedWealthChartProps {
  data: Array<{
    age: number;
    epf: number;
    nps: number;
    sip: number;
    total: number;
    epfInvested: number;
    npsInvested: number;
    sipInvested: number;
  }>;
}

function StackedWealthChart({ data }: StackedWealthChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const width = 1000;
  const height = 400;
  const paddingLeft = 80;
  const paddingRight = 30;
  const paddingTop = 40;
  const paddingBottom = 60;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...data.map(d => d.total));
  const yMax = maxVal > 0 ? maxVal * 1.15 : 1000000;

  const colWidth = chartWidth / data.length;
  const barWidth = Math.max(4, colWidth * 0.45);

  const yTicks = [0, 0.25, 0.5, 0.75, 1.0].map(p => yMax * p);

  const xTickIndices: number[] = [];
  const tickStep = Math.max(1, Math.floor(data.length / 8));
  for (let i = 0; i < data.length; i += tickStep) {
    xTickIndices.push(i);
  }
  if (!xTickIndices.includes(data.length - 1)) {
    xTickIndices.push(data.length - 1);
  }

  return (
    <div className="chart-container-root" style={{ background: '#111111', border: '1px solid #333333', padding: '24px', borderRadius: '12px', marginTop: '30px', position: 'relative' }}>
      <h5 className="brand-font" style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Wealth Gap Over Time
      </h5>

      <svg 
        width="100%" 
        height={height} 
        viewBox={`0 0 ${width} ${height}`}
        style={{ overflow: 'visible', display: 'block' }}
      >
        {/* Y grid lines */}
        {yTicks.map((tick, i) => (
          <line
            key={i}
            x1={paddingLeft}
            y1={height - paddingBottom - (tick / yMax) * chartHeight}
            x2={width - paddingRight}
            y2={height - paddingBottom - (tick / yMax) * chartHeight}
            stroke="rgba(255,255,255,0.08)"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
        ))}

        {/* Y ticks labels */}
        {yTicks.map((tick, i) => (
          <text
            key={i}
            x={paddingLeft - 12}
            y={height - paddingBottom - (tick / yMax) * chartHeight + 4}
            textAnchor="end"
            fontSize="10px"
            fill="rgba(255,255,255,0.5)"
            fontFamily="Montserrat, sans-serif"
          >
            {formatCompactRupee(tick)}
          </text>
        ))}

        {/* X labels */}
        {data.map((d, i) => {
          if (!xTickIndices.includes(i)) return null;
          const x = paddingLeft + i * colWidth + colWidth / 2;
          return (
            <text
              key={`x-label-${i}`}
              x={x}
              y={height - paddingBottom + 20}
              textAnchor="middle"
              fontSize="10px"
              fill="rgba(255,255,255,0.5)"
              fontFamily="Montserrat, sans-serif"
            >
              {d.age}
            </text>
          );
        })}
        {/* X axis center title */}
        <text 
          x={paddingLeft + chartWidth / 2} 
          y={height - 10} 
          textAnchor="middle" 
          fontSize="9px" 
          fill="rgba(255,255,255,0.3)" 
          fontFamily="Montserrat, sans-serif"
          letterSpacing="0.05em"
        >
          Age
        </text>

        {/* Stacked Bars */}
        {data.map((d, i) => {
          const x = paddingLeft + i * colWidth + (colWidth - barWidth) / 2;
          
          const hEpf = (d.epf / yMax) * chartHeight;
          const hNps = (d.nps / yMax) * chartHeight;
          const hSip = (d.sip / yMax) * chartHeight;

          return (
            <g key={`stacked-bar-${i}`}>
              {/* EPF bar (Blue) */}
              {hEpf > 0 && (
                <rect
                  x={x}
                  y={height - paddingBottom - hEpf}
                  width={barWidth}
                  height={hEpf}
                  fill="#2196F3"
                  rx={1}
                />
              )}
              {/* NPS bar (Purple) */}
              {hNps > 0 && (
                <rect
                  x={x}
                  y={height - paddingBottom - hEpf - hNps}
                  width={barWidth}
                  height={hNps}
                  fill="#9C27B0"
                  rx={1}
                />
              )}
              {/* SIP bar (Green) */}
              {hSip > 0 && (
                <rect
                  x={x}
                  y={height - paddingBottom - hEpf - hNps - hSip}
                  width={barWidth}
                  height={hSip}
                  fill="#10B981"
                  rx={1}
                />
              )}
            </g>
          );
        })}

        {/* Invisible columns for hover handling */}
        {data.map((_, i) => {
          const x = paddingLeft + i * colWidth;
          return (
            <rect
              key={`hover-col-${i}`}
              x={x}
              y={paddingTop}
              width={colWidth}
              height={chartHeight}
              fill="transparent"
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              style={{ cursor: 'pointer' }}
            />
          );
        })}
      </svg>

      {/* Legend below the graph */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '16px', fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', background: '#2196F3', borderRadius: '2px' }}></span>
          <span>EPF</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', background: '#9C27B0', borderRadius: '2px' }}></span>
          <span>NPS</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', background: '#10B981', borderRadius: '2px' }}></span>
          <span>SIP</span>
        </div>
      </div>

      {/* HTML Hover Tooltip */}
      {hoverIdx !== null && (
        <div
          style={{
            position: 'absolute',
            left: `${Math.min(90, Math.max(10, (paddingLeft + hoverIdx * colWidth + colWidth / 2) * 100 / width))}%`,
            top: `${Math.max(10, height - paddingBottom - (data[hoverIdx].total / yMax) * chartHeight - 110)}px`,
            transform: 'translateX(-50%)',
            background: 'rgba(20, 20, 20, 0.95)',
            color: '#FFFFFF',
            padding: '12px 16px',
            borderRadius: '6px',
            border: '1.5px solid var(--gold-primary)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
            zIndex: 100,
            fontSize: '11px',
            minWidth: '180px',
            fontFamily: 'Montserrat, sans-serif'
          }}
        >
          <div style={{ fontWeight: 700, color: 'var(--gold-secondary)', marginBottom: '6px', textAlign: 'center', fontSize: '12px' }}>
            Age {data[hoverIdx].age}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>EPF:</span>
            <strong>{formatCompactRupee(data[hoverIdx].epf)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>NPS:</span>
            <strong>{formatCompactRupee(data[hoverIdx].nps)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>SIP:</span>
            <strong>{formatCompactRupee(data[hoverIdx].sip)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '4px', fontWeight: 700 }}>
            <span>Total Value:</span>
            <span style={{ color: '#10B981' }}>{formatCompactRupee(data[hoverIdx].total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

