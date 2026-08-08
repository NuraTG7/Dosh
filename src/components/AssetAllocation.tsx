import { useState, useEffect } from 'react';
import {
  PieChart,
  TrendingUp,
  ShieldAlert,
  Target,
  BarChart3,
  Layers,
  CheckCircle,
  AlertCircle,
  Briefcase
} from 'lucide-react';
import { analyzeAssetAllocation } from '../utils/allocationUtils';
import type { AllocationInputs, AllocationOutput } from '../utils/allocationUtils';

/* ============================================================================
   HELPERS
   ============================================================================ */
const formatCurrency = (val: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

const formatPct = (val: number): string => `${val > 0 ? '+' : ''}${val.toFixed(1)}%`;

/* ============================================================================
   REUSABLE INPUT COMPONENT
   ============================================================================ */
interface CurrencyInputProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  step?: number;
  suffix?: string;
  placeholder?: string;
}

function CurrencyInput({ label, value, onChange, min = 0, step = 1000, suffix, placeholder }: CurrencyInputProps) {
  const [localVal, setLocalVal] = useState<string>(value === 0 ? '' : value.toString());

  useEffect(() => {
    setLocalVal(value === 0 && !localVal ? '' : value.toString());
  }, [value]);

  const handleBlur = () => {
    if (localVal === '') {
      onChange(0);
      return;
    }
    let num = Number(localVal);
    if (isNaN(num)) num = min;
    const clamped = Math.max(min, num);
    onChange(clamped);
    setLocalVal(clamped.toString());
  };

  return (
    <div className="form-group" style={{ marginBottom: '16px' }}>
      <label className="form-label" style={{ fontSize: '13px', marginBottom: '8px', color: 'var(--text-secondary)', display: 'block' }}>
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '0 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        {!suffix && <span style={{ color: 'var(--text-muted)', fontSize: '15px', marginRight: '6px' }}>₹</span>}
        <input
          type="number"
          value={localVal}
          onChange={(e) => setLocalVal(e.target.value)}
          onBlur={handleBlur}
          step={step}
          placeholder={placeholder || '0'}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            padding: '12px 0',
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            outline: 'none',
            width: '100%'
          }}
        />
        {suffix && <span style={{ color: 'var(--text-muted)', fontSize: '14px', marginLeft: '8px', fontWeight: 600 }}>{suffix}</span>}
      </div>
    </div>
  );
}

/* ============================================================================
   CHARTS
   ============================================================================ */
function DonutChart({ data, title }: { data: { label: string; value: number; color: string }[]; title: string }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '240px', width: '240px', opacity: 0.5, border: '1px dashed var(--border-light)', borderRadius: '50%' }}>
        <PieChart size={32} style={{ marginBottom: '8px' }} />
        <span style={{ fontSize: '14px', fontWeight: 600 }}>No Data</span>
      </div>
    );
  }

  let cumulativePercent = 0;
  const slices = data.map((d, idx) => {
    if (d.value === 0) return { idx, pathData: '', item: d, pct: 0 };
    const slicePercent = d.value / total;
    const startPercent = cumulativePercent;
    cumulativePercent += slicePercent;
    const endPercent = cumulativePercent;

    const startX = Math.cos(2 * Math.PI * startPercent - Math.PI / 2);
    const startY = Math.sin(2 * Math.PI * startPercent - Math.PI / 2);
    const endX = Math.cos(2 * Math.PI * endPercent - Math.PI / 2);
    const endY = Math.sin(2 * Math.PI * endPercent - Math.PI / 2);

    const largeArcFlag = slicePercent > 0.5 ? 1 : 0;
    const radius = 100;
    const cx = 120;
    const cy = 120;

    const pathData = slicePercent >= 0.999 
      ? `M ${cx - radius} ${cy} A ${radius} ${radius} 0 1 0 ${cx + radius} ${cy} A ${radius} ${radius} 0 1 0 ${cx - radius} ${cy}`
      : [
          `M ${cx} ${cy}`,
          `L ${cx + radius * startX} ${cy + radius * startY}`,
          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${cx + radius * endX} ${cy + radius * endY}`,
          `Z`,
        ].join(' ');

    return { idx, pathData, item: d, pct: Math.round(slicePercent * 100) };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px' }}>{title}</h4>
      <div style={{ position: 'relative', width: '240px', height: '240px' }}>
        <svg width="240" height="240" viewBox="0 0 240 240">
          {slices.map((slice) => {
            if (!slice.pathData) return null;
            const isHovered = hoveredIdx === slice.idx;
            return (
              <path
                key={slice.idx}
                d={slice.pathData}
                fill={slice.item.color}
                stroke="#FFFFFF"
                strokeWidth="2.5"
                onMouseEnter={() => setHoveredIdx(slice.idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{
                  cursor: 'pointer',
                  opacity: hoveredIdx === null || isHovered ? 1 : 0.45,
                  transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                  transformOrigin: '120px 120px',
                  transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
              />
            );
          })}
          <circle cx="120" cy="120" r="60" fill="#FFFFFF" />
        </svg>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          {hoveredIdx !== null ? (
            <>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>{slices[hoveredIdx].item.label}</span>
              <span style={{ fontSize: '24px', color: slices[hoveredIdx].item.color, fontWeight: 700, marginTop: '2px' }}>{slices[hoveredIdx].pct}%</span>
            </>
          ) : (
            <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'center', padding: '0 10px' }}>Hover to view</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   MAIN COMPONENT
   ============================================================================ */
export default function AssetAllocation() {
  const [inputs, setInputs] = useState<AllocationInputs>({
    age: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    debtEMI: 0,
    emergencyFund: 0,
    equity: 0,
    debt: 0,
    gold: 0,
    realEstate: 0,
    cash: 0,
    others: 0,
    goalAmount: 0,
    goalHorizonYears: 0,
    monthlySIP: 0,
    riskTolerance: 'medium'
  });

  const [output, setOutput] = useState<AllocationOutput | null>(null);

  const updateInput = (key: keyof AllocationInputs, val: any) => {
    setInputs(prev => ({ ...prev, [key]: val }));
    // Clear output when inputs change to encourage recalculation
    if (output) setOutput(null);
  };

  const handleCalculate = () => {
    const res = analyzeAssetAllocation(inputs);
    setOutput(res);
    setTimeout(() => {
      document.getElementById('allocation-results-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', overflow: 'hidden', maxWidth: '1200px', margin: '0 auto', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', padding: '40px 60px', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'var(--gold-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PieChart size={30} color="var(--gold-dark)" />
          </div>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Asset Allocation Analyzer</h1>
            <p style={{ margin: '8px 0 0 0', color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '800px', lineHeight: 1.5 }}>
              Analyze how your money is distributed across asset classes. We evaluate your goals, risk capacity, and liquidity to recommend the optimal portfolio balance for your financial journey.
            </p>
          </div>
        </div>
      </div>

      {/* INPUTS PANE (Full Width, Stacked Rows) */}
      <div style={{ padding: '40px 60px', background: '#FAFAFA' }}>
        
        {/* Section 1: Profile & Safety Net */}
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '2px solid var(--border-light)', paddingBottom: '12px' }}>
            <Briefcase size={20} color="var(--gold-dark)" /> 1. Profile & Safety Net
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <CurrencyInput label="Age" value={inputs.age} onChange={(v) => updateInput('age', v)} suffix="Yrs" step={1} placeholder="e.g. 30" />
            <CurrencyInput label="Monthly Income" value={inputs.monthlyIncome} onChange={(v) => updateInput('monthlyIncome', v)} placeholder="e.g. 100000" />
            <CurrencyInput label="Monthly Expenses" value={inputs.monthlyExpenses} onChange={(v) => updateInput('monthlyExpenses', v)} placeholder="e.g. 40000" />
            <CurrencyInput label="Monthly Debt EMI" value={inputs.debtEMI} onChange={(v) => updateInput('debtEMI', v)} placeholder="e.g. 15000" />
            <CurrencyInput label="Emergency Fund Balance" value={inputs.emergencyFund} onChange={(v) => updateInput('emergencyFund', v)} placeholder="e.g. 200000" />
          </div>
        </div>

        {/* Section 2: Goals & Risk Profile */}
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '2px solid var(--border-light)', paddingBottom: '12px' }}>
            <Target size={20} color="var(--gold-dark)" /> 2. Financial Goals
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <CurrencyInput label="Primary Target Goal Amount" value={inputs.goalAmount} onChange={(v) => updateInput('goalAmount', v)} step={100000} placeholder="e.g. 10000000" />
            <CurrencyInput label="Goal Horizon (Time to Goal)" value={inputs.goalHorizonYears} onChange={(v) => updateInput('goalHorizonYears', v)} suffix="Yrs" step={1} placeholder="e.g. 10" />
            
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ fontSize: '13px', marginBottom: '8px', color: 'var(--text-secondary)', display: 'block' }}>Subjective Risk Tolerance</label>
              <div style={{ display: 'flex', gap: '12px', height: '48px' }}>
                {(['low', 'medium', 'high'] as const).map(level => (
                  <button
                    key={level}
                    onClick={() => updateInput('riskTolerance', level)}
                    style={{
                      flex: 1,
                      background: inputs.riskTolerance === level ? 'var(--gold-dark)' : '#FFFFFF',
                      color: inputs.riskTolerance === level ? '#FFFFFF' : 'var(--text-secondary)',
                      border: `1px solid ${inputs.riskTolerance === level ? 'var(--gold-dark)' : 'var(--border-light)'}`,
                      borderRadius: '8px',
                      fontSize: '15px',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Current Portfolio */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '2px solid var(--border-light)', paddingBottom: '12px' }}>
            <Layers size={20} color="var(--gold-dark)" /> 3. Current Portfolio Assets (Total Values)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <CurrencyInput label="Equity (Stocks, Mutual Funds)" value={inputs.equity} onChange={(v) => updateInput('equity', v)} placeholder="0" />
            <CurrencyInput label="Debt (FD, PPF, Bonds)" value={inputs.debt} onChange={(v) => updateInput('debt', v)} placeholder="0" />
            <CurrencyInput label="Gold (Physical, SGB, ETF)" value={inputs.gold} onChange={(v) => updateInput('gold', v)} placeholder="0" />
            <CurrencyInput label="Cash (Savings A/C, Liquid)" value={inputs.cash} onChange={(v) => updateInput('cash', v)} placeholder="0" />
            <CurrencyInput label="Real Estate (Investment Property)" value={inputs.realEstate} onChange={(v) => updateInput('realEstate', v)} placeholder="0" />
            <CurrencyInput label="Others (Crypto, Alternate)" value={inputs.others} onChange={(v) => updateInput('others', v)} placeholder="0" />
          </div>
        </div>

      </div>

      {/* ACTION BUTTON */}
      <div style={{ padding: '0 60px 40px 60px', background: '#FAFAFA', display: 'flex', justifyContent: 'center' }}>
        <button 
          onClick={handleCalculate}
          className="btn-gold" 
          style={{ padding: '18px 60px', fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', width: '100%', maxWidth: '400px', justifyContent: 'center', boxShadow: '0 8px 24px rgba(181, 142, 79, 0.25)' }}
        >
          <PieChart size={22} />
          Analyze Portfolio
        </button>
      </div>

      {/* OUTPUT PANE (Conditionally Rendered at Bottom) */}
      {output && (
        <div id="allocation-results-section" style={{ padding: '60px', background: '#FFFFFF', borderTop: '1px solid var(--border-light)' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px 0' }}>Portfolio Analysis Results</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '600px', margin: '0 auto' }}>
              We've evaluated your assets against your financial capacity and horizon. Here is how your portfolio is structured.
            </p>
          </div>

          {/* Top Score Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '50px' }}>
            <div style={{ background: '#F8F9FA', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Allocation Score</div>
              <div style={{ fontSize: '42px', fontWeight: 800, color: output.allocationScore > 80 ? '#137A57' : output.allocationScore > 60 ? '#D4AF37' : '#B31B1B', lineHeight: 1 }}>
                {output.allocationScore.toFixed(0)}<span style={{ fontSize: '20px', color: 'var(--text-muted)' }}>/100</span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>Measures alignment with target</div>
            </div>
            
            <div style={{ background: '#F8F9FA', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Effective Risk</div>
              <div style={{ fontSize: '42px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                {output.effectiveRisk}<span style={{ fontSize: '20px', color: 'var(--text-muted)' }}>/10</span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>Your true capacity to take risk</div>
            </div>

            <div style={{ background: '#F8F9FA', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Investable Assets</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--gold-dark)', lineHeight: 1.3 }}>
                {formatCurrency(output.investableAssets)}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>Excludes Emergency Fund reserve</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '60px' }}>
            {/* Allocation Charts */}
            <div style={{ background: '#FFFFFF', padding: '30px', borderRadius: '16px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <DonutChart 
                data={[
                  { label: 'Equity', value: output.currentAllocations.equity, color: '#1E3C72' },
                  { label: 'Debt', value: output.currentAllocations.debt, color: '#137A57' },
                  { label: 'Gold', value: output.currentAllocations.gold, color: '#D4AF37' },
                  { label: 'Real Est.', value: output.currentAllocations.realEstate, color: '#8E703F' },
                  { label: 'Cash', value: output.currentAllocations.cash, color: '#666666' },
                ]} 
                title="Current Allocation" 
              />
            </div>
            <div style={{ background: '#FFFFFF', padding: '30px', borderRadius: '16px', border: '1px solid var(--border-gold-light)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <DonutChart 
                data={[
                  { label: 'Equity', value: output.targetAllocations.equity, color: '#1E3C72' },
                  { label: 'Debt', value: output.targetAllocations.debt, color: '#137A57' },
                  { label: 'Gold', value: output.targetAllocations.gold, color: '#D4AF37' },
                  { label: 'Real Est.', value: output.targetAllocations.realEstate, color: '#8E703F' },
                  { label: 'Cash', value: output.targetAllocations.cash, color: '#666666' },
                ]} 
                title="Recommended Target Allocation" 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '40px' }}>
            {/* Allocation Gaps */}
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BarChart3 size={24} color="var(--gold-dark)" /> Allocation Gap Analysis
              </h3>
              <div style={{ background: '#F8F9FA', padding: '30px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
                {Object.keys(output.allocationGapsPct).map(key => {
                  const gap = output.allocationGapsPct[key];
                  const amount = output.allocationGapsAmount[key];
                  const isOver = gap > 0;
                  const color = isOver ? '#B31B1B' : '#137A57';
                  
                  if (Math.abs(gap) < 1) return null;

                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                      <div style={{ width: '90px', fontSize: '14px', fontWeight: 600, textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{key}</div>
                      <div style={{ flex: 1, height: '10px', background: '#EAEAEA', borderRadius: '5px', position: 'relative', margin: '0 20px' }}>
                        {isOver ? (
                          <div style={{ position: 'absolute', right: '50%', width: `${Math.min(50, (gap / 50) * 50)}%`, height: '100%', background: color, borderRadius: '5px 0 0 5px' }} />
                        ) : (
                          <div style={{ position: 'absolute', left: '50%', width: `${Math.min(50, (Math.abs(gap) / 50) * 50)}%`, height: '100%', background: color, borderRadius: '0 5px 5px 0' }} />
                        )}
                        <div style={{ position: 'absolute', left: '50%', top: '-6px', bottom: '-6px', width: '2px', background: '#999', borderRadius: '1px' }} />
                      </div>
                      <div style={{ width: '150px', textAlign: 'right' }}>
                        <div style={{ fontSize: '15px', fontWeight: 700, color }}>{formatPct(gap)}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{isOver ? 'Overweight by' : 'Underweight by'} {formatCurrency(Math.abs(amount))}</div>
                      </div>
                    </div>
                  );
                })}
                {Object.keys(output.allocationGapsPct).every(k => Math.abs(output.allocationGapsPct[k]) < 1) && (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px 0' }}>
                    Your current allocation matches the target perfectly!
                  </div>
                )}
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <TrendingUp size={24} color="var(--gold-dark)" /> Recommendations
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {output.recommendations.length > 0 ? (
                  output.recommendations.map((rec, i) => (
                    <div key={i} style={{ 
                      display: 'flex', 
                      gap: '16px', 
                      padding: '20px', 
                      borderRadius: '16px', 
                      background: rec.priority === 'high' ? '#FFF5F5' : '#F8F9FA',
                      border: `1px solid ${rec.priority === 'high' ? '#FFDCDC' : 'var(--border-light)'}`
                    }}>
                      <div style={{ marginTop: '2px' }}>
                        {rec.priority === 'high' ? <ShieldAlert size={24} color="#B31B1B" /> : <AlertCircle size={24} color="#1E3C72" />}
                      </div>
                      <div>
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700, color: rec.priority === 'high' ? '#B31B1B' : 'var(--text-primary)' }}>
                          {rec.category}
                        </h4>
                        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                          {rec.advice}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px', borderRadius: '16px', background: '#F0FFF4', border: '1px solid #C6F6D5' }}>
                    <CheckCircle size={28} color="#137A57" />
                    <div>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700, color: '#137A57' }}>Portfolio Optimized</h4>
                      <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>Your current asset allocation perfectly matches your risk profile and timeline. Keep up the good work!</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
