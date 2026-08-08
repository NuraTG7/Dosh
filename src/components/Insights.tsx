import React, { useState, useRef } from 'react';
import { 
  Target, 
  Zap, 
  FileText, 
  CheckCircle2,
  Calculator,
  Clock,
  Calendar,
  TrendingUp,
  Wallet,
  Award
} from 'lucide-react';

/* ============================================================================
   TYPES & HELPERS
   ============================================================================ */

interface SimulationPoint {
  month: number;
  year: number;
  age: number;
  monthlySIP: number;
  totalInvested: number;
  portfolioValue: number;
  returnsEarned: number;
}

interface MilestoneItem {
  targetAmount: number;
  label: string;
  month: number;
  year: number;
  age: number;
  portfolioValue: number;
  totalInvested: number;
}

const formatCurrency = (val: number): string => {
  if (isNaN(val) || val === null || val === undefined) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
};

const formatCompactCurrency = (val: number): string => {
  if (isNaN(val) || val === 0) return '₹0';
  const abs = Math.abs(val);
  if (abs >= 10000000) {
    return `₹${(val / 10000000).toFixed(2)} Cr`;
  }
  if (abs >= 100000) {
    return `₹${(val / 100000).toFixed(2)} L`;
  }
  if (abs >= 1000) {
    return `₹${(val / 1000).toFixed(0)} K`;
  }
  return `₹${val.toFixed(0)}`;
};

/* ============================================================================
   CLEAN MINIMAL INPUT CONTROL
   ============================================================================ */

interface CustomInputControlProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  helpText?: string;
}

function CustomInputControl({
  label,
  value,
  onChange,
  min = 0,
  max = 100000000,
  step = 1,
  prefix,
  suffix,
  helpText
}: CustomInputControlProps) {
  const handleIncrement = () => {
    onChange(Math.min(max, value + step));
  };

  const handleDecrement = () => {
    onChange(Math.max(min, value - step));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </label>
        {helpText && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{helpText}</span>}
      </div>

      {/* Input box with inline steppers */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '6px',
        padding: '6px 10px',
        boxShadow: 'none'
      }}>
        {prefix && <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gold-dark)', marginRight: '4px' }}>{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={(e) => {
            const num = parseFloat(e.target.value);
            if (!isNaN(num)) onChange(num);
            else if (e.target.value === '') onChange(0);
          }}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            background: 'transparent',
            fontFamily: 'Inter, sans-serif'
          }}
          min={min}
          max={max}
          step={step}
        />
        {suffix && <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '4px', marginRight: '6px' }}>{suffix}</span>}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', marginLeft: 'auto' }}>
          <button
            type="button"
            onClick={handleIncrement}
            style={{
              background: '#F3F4F6',
              border: '1px solid #E5E7EB',
              borderRadius: '2px',
              cursor: 'pointer',
              fontSize: '7px',
              padding: '1px 4px',
              color: '#374151',
              lineHeight: 1
            }}
          >
            ▲
          </button>
          <button
            type="button"
            onClick={handleDecrement}
            style={{
              background: '#F3F4F6',
              border: '1px solid #E5E7EB',
              borderRadius: '2px',
              cursor: 'pointer',
              fontSize: '7px',
              padding: '1px 4px',
              color: '#374151',
              lineHeight: 1
            }}
          >
            ▼
          </button>
        </div>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          width: '100%',
          accentColor: 'var(--gold-primary)',
          cursor: 'pointer',
          height: '3px',
          margin: '1px 0'
        }}
      />
    </div>
  );
}

/* ============================================================================
   MAIN INSIGHTS COMPONENT
   ============================================================================ */

export default function Insights() {
  // Input states
  const [currentAge, setCurrentAge] = useState<number>(28);
  const [targetAmount, setTargetAmount] = useState<number>(10000000); // ₹1 Crore default
  const [currentSavings, setCurrentSavings] = useState<number>(500000);
  const [oneTimeInvestment, setOneTimeInvestment] = useState<number>(0);
  const [monthlySIP, setMonthlySIP] = useState<number>(30000);
  const [expectedReturn, setExpectedReturn] = useState<number>(12);
  const [annualStepUp, setAnnualStepUp] = useState<number>(10);

  // Calculation state flag
  const [hasCalculated, setHasCalculated] = useState<boolean>(false);

  // Pagination for Schedule Table
  const [schedulePage, setSchedulePage] = useState<number>(1);

  // Chart Hover Tracking State
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [hoverSvgX, setHoverSvgX] = useState<number | null>(null);
  const [pieHoverSegment, setPieHoverSegment] = useState<'invested' | 'returns' | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // --------------------------------------------------------------------------
  // SIMULATION ENGINE: Month-by-month Compounding Simulation
  // --------------------------------------------------------------------------
  const runSimulation = (
    sipAmount: number,
    stepUpPct: number,
    initialSavings: number,
    lumpsum: number,
    annualReturnPct: number,
    maxTarget: number
  ) => {
    const monthlyRate = Math.pow(1 + annualReturnPct / 100, 1 / 12) - 1;
    let portfolio = initialSavings + lumpsum;
    let invested = initialSavings + lumpsum;
    let currentSIPVal = sipAmount;
    
    const monthlyPoints: SimulationPoint[] = [];
    const yearlyPoints: SimulationPoint[] = [];
    
    let monthCount = 0;
    const currentDate = new Date();
    const startYear = currentDate.getFullYear();
    const startMonth = currentDate.getMonth();

    const initialPoint: SimulationPoint = {
      month: 0,
      year: startYear,
      age: currentAge,
      monthlySIP: currentSIPVal,
      totalInvested: invested,
      portfolioValue: portfolio,
      returnsEarned: 0
    };
    monthlyPoints.push(initialPoint);
    yearlyPoints.push(initialPoint);

    let targetHitMonth = -1;
    const maxMonthsLimit = 480;

    while (monthCount < maxMonthsLimit) {
      monthCount++;
      
      if (monthCount > 1 && (monthCount - 1) % 12 === 0) {
        currentSIPVal = Math.round(currentSIPVal * (1 + stepUpPct / 100));
      }

      const interestEarned = portfolio * monthlyRate;
      portfolio = portfolio + interestEarned + currentSIPVal;
      invested += currentSIPVal;

      const calcYear = startYear + Math.floor((startMonth + monthCount) / 12);
      const calcAge = currentAge + Math.floor(monthCount / 12);

      const point: SimulationPoint = {
        month: monthCount,
        year: calcYear,
        age: calcAge,
        monthlySIP: currentSIPVal,
        totalInvested: Math.round(invested),
        portfolioValue: Math.round(portfolio),
        returnsEarned: Math.round(portfolio - invested)
      };

      monthlyPoints.push(point);

      if (targetHitMonth === -1 && portfolio >= maxTarget) {
        targetHitMonth = monthCount;
      }

      // Record yearly points cleanly at 12-month intervals
      if (monthCount % 12 === 0) {
        yearlyPoints.push(point);
      }

      // Stop simulation cleanly when target is reached
      if (targetHitMonth !== -1 && monthCount >= targetHitMonth) {
        if (yearlyPoints[yearlyPoints.length - 1].month !== targetHitMonth) {
          yearlyPoints.push(point);
        }
        break;
      }
    }

    return {
      monthlyPoints,
      yearlyPoints,
      targetHitMonth: targetHitMonth === -1 ? maxMonthsLimit : targetHitMonth
    };
  };

  // Run primary simulation
  const mainSim = runSimulation(
    monthlySIP,
    annualStepUp,
    currentSavings,
    oneTimeInvestment,
    expectedReturn,
    targetAmount
  );

  // Run scenario 1: SIP + ₹2,000 boost
  const boostSim = runSimulation(
    monthlySIP + 2000,
    annualStepUp,
    currentSavings,
    oneTimeInvestment,
    expectedReturn,
    targetAmount
  );

  // Run scenario 2: Step Up + 5% increase
  const stepUpSim = runSimulation(
    monthlySIP,
    annualStepUp + 5,
    currentSavings,
    oneTimeInvestment,
    expectedReturn,
    targetAmount
  );

  // Run scenario 3: +2% Return Rate
  const yieldSim = runSimulation(
    monthlySIP,
    annualStepUp,
    currentSavings,
    oneTimeInvestment,
    expectedReturn + 2,
    targetAmount
  );

  const targetPoint = mainSim.monthlyPoints[mainSim.targetHitMonth] || mainSim.monthlyPoints[mainSim.monthlyPoints.length - 1];
  const targetYears = Math.floor(mainSim.targetHitMonth / 12);
  const targetMonthsRemainder = mainSim.targetHitMonth % 12;

  // Expected Date Calculation
  const targetDateObj = new Date();
  targetDateObj.setMonth(targetDateObj.getMonth() + mainSim.targetHitMonth);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const expectedDateString = `${monthNames[targetDateObj.getMonth()]} ${targetDateObj.getFullYear()}`;

  // Time Saved calculations
  const monthsSavedBoost = Math.max(0, mainSim.targetHitMonth - boostSim.targetHitMonth);
  const monthsSavedStepUp = Math.max(0, mainSim.targetHitMonth - stepUpSim.targetHitMonth);
  const monthsSavedYield = Math.max(0, mainSim.targetHitMonth - yieldSim.targetHitMonth);

  // Calculate 5 Crore age pace
  const sim5Cr = runSimulation(monthlySIP, annualStepUp, currentSavings, oneTimeInvestment, expectedReturn, 50000000);
  const ageAt5Cr = currentAge + Math.floor(sim5Cr.targetHitMonth / 12);

  // Milestones Timeline (₹25L, ₹50L, ₹75L, ₹1Cr)
  const milestoneAmounts = [2500000, 5000000, 7500000, targetAmount];
  const milestoneList: MilestoneItem[] = milestoneAmounts.map(amt => {
    let hitM = mainSim.monthlyPoints.findIndex(p => p.portfolioValue >= amt);
    if (hitM === -1) hitM = mainSim.monthlyPoints.length - 1;
    const pt = mainSim.monthlyPoints[hitM] || mainSim.monthlyPoints[0];
    return {
      targetAmount: amt,
      label: formatCompactCurrency(amt),
      month: pt.month,
      year: pt.year,
      age: pt.age,
      portfolioValue: pt.portfolioValue,
      totalInvested: pt.totalInvested
    };
  });

  // Table rows pagination
  const totalPages = Math.ceil(mainSim.yearlyPoints.length / 10);
  const paginatedTableRows = mainSim.yearlyPoints.slice((schedulePage - 1) * 10, schedulePage * 10);

  // Donut chart calculations
  const investedRatio = targetPoint.portfolioValue > 0 ? (targetPoint.totalInvested / targetPoint.portfolioValue) : 0.5;
  const gainsRatio = 1 - investedRatio;
  const circ = 2 * Math.PI * 50;
  const investedDash = circ * investedRatio;
  const gainsDash = circ * gainsRatio;

  // Line chart SVG path calculations
  const maxSimVal = Math.max(...mainSim.yearlyPoints.map(p => p.portfolioValue), targetAmount * 1.1);
  const pointsCount = mainSim.yearlyPoints.length;
  
  const chartWidth = 960;
  const chartHeight = 300;
  const paddingLeft = 60;
  const paddingRight = 25;
  const paddingTop = 20;
  const paddingBottom = 35;

  const drawableWidth = chartWidth - paddingLeft - paddingRight;
  const drawableHeight = chartHeight - paddingTop - paddingBottom;

  const maxMonth = mainSim.yearlyPoints[mainSim.yearlyPoints.length - 1]?.month || 1;
  const getX = (idx: number) => {
    const pt = mainSim.yearlyPoints[idx];
    if (!pt) return paddingLeft;
    return paddingLeft + (pt.month / maxMonth) * drawableWidth;
  };
  const getY = (val: number) => (chartHeight - paddingBottom) - (val / maxSimVal) * drawableHeight;

  const linePortfolioPath = mainSim.yearlyPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(p.portfolioValue)}`).join(' ');
  const lineInvestedPath = mainSim.yearlyPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(p.totalInvested)}`).join(' ');
  const areaPath = `${linePortfolioPath} L ${getX(pointsCount - 1)} ${chartHeight - paddingBottom} L ${paddingLeft} ${chartHeight - paddingBottom} Z`;

  // Hover Handler for SVG Line Chart with Pixel-Perfect Alignment
  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const scaleX = chartWidth / rect.width;
    const rawSvgX = mouseX * scaleX;

    const clampedX = Math.max(paddingLeft, Math.min(chartWidth - paddingRight, rawSvgX));
    setHoverSvgX(clampedX);

    const ratio = (clampedX - paddingLeft) / drawableWidth;
    const nearestIdx = Math.round(ratio * (pointsCount - 1));
    setHoverIdx(Math.max(0, Math.min(pointsCount - 1, nearestIdx)));
  };

  const activeHoverPoint = hoverIdx !== null ? mainSim.yearlyPoints[hoverIdx] : null;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '20px 15px', fontFamily: 'Inter, sans-serif' }}>
      
      {/* ── Page Header ── */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h2 className="royal-title" style={{ fontSize: '32px', color: 'var(--text-primary)', marginBottom: '6px', fontWeight: 800, letterSpacing: '-0.03em' }}>
          Time to <span className="text-glow-green">₹1 Crore</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '560px', margin: '0 auto', fontWeight: 500 }}>
          Compounding trajectory and wealth milestone projection engine.
        </p>
      </div>

      {/* ── 1. WEALTH MILESTONE PARAMETERS (4 Exact Lines - Clean Business UI) ── */}
      <div style={{ background: '#FFFFFF', padding: '24px 28px', borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border-gold)', paddingBottom: '10px' }}>
          <Target size={16} color="var(--gold-dark)" />
          <h3 className="brand-font" style={{ fontSize: '12px', color: 'var(--gold-dark)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0, fontWeight: 700 }}>
            Wealth Milestone Parameters
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Line 1: Current Age (left) | Target Amount (right) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <CustomInputControl
              label="Current Age"
              value={currentAge}
              onChange={setCurrentAge}
              min={18} max={80} step={1}
              suffix="yrs"
            />
            <CustomInputControl
              label="Target Amount"
              value={targetAmount}
              onChange={setTargetAmount}
              min={1000000} max={1000000000} step={500000}
              prefix="₹"
              helpText="Default: ₹1 Crore"
            />
          </div>

          {/* Line 2: Current Savings / Investments (left) | One-Time Investment (Optional) (right) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <CustomInputControl
              label="Current Savings / Investments"
              value={currentSavings}
              onChange={setCurrentSavings}
              min={0} max={100000000} step={25000}
              prefix="₹"
            />
            <CustomInputControl
              label="One-Time Investment (Optional)"
              value={oneTimeInvestment}
              onChange={setOneTimeInvestment}
              min={0} max={50000000} step={25000}
              prefix="₹"
            />
          </div>

          {/* Line 3: Monthly SIP Amount (left) | Expected Annual Return (P.A.) (right) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <CustomInputControl
              label="Monthly SIP Amount"
              value={monthlySIP}
              onChange={setMonthlySIP}
              min={1000} max={5000000} step={1000}
              prefix="₹"
            />
            <CustomInputControl
              label="Expected Annual Return (P.A.)"
              value={expectedReturn}
              onChange={setExpectedReturn}
              min={1} max={30} step={0.5}
              suffix="%"
            />
          </div>

          {/* Line 4: Annual SIP Step-Up (left) | Calculate Button (right) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'end' }}>
            <CustomInputControl
              label="Annual SIP Step-Up"
              value={annualStepUp}
              onChange={setAnnualStepUp}
              min={0} max={50} step={1}
              suffix="%"
              helpText="Yearly increase in SIP"
            />
            
            <div style={{ marginBottom: '1px' }}>
              <button
                type="button"
                onClick={() => setHasCalculated(true)}
                className="btn-gold"
                style={{
                  width: '100%',
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  letterSpacing: '0.02em',
                  background: 'var(--gold-dark)',
                  color: '#FFFFFF',
                  border: 'none'
                }}
              >
                <Calculator size={15} /> Calculate Timeline →
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
         RESULTS WORKSPACE (BUILT ONLY AFTER CALCULATE IS CLICKED)
         ══════════════════════════════════════════════════════════════════════ */}
      {hasCalculated && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* ── 2. OUTPUT CARDS (Executive Stat Cards Grid) ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Line 1: 3 Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              
              {/* Card 1: Target Status */}
              <div className="card-hover-effect" style={{
                background: '#FFFFFF',
                padding: '20px 22px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '110px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#6B7280', fontWeight: 600, letterSpacing: '0.05em' }}>
                    Target Status
                  </span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={16} color="#059669" />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: '#059669', letterSpacing: '-0.01em' }}>
                    On Track
                  </div>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '6px', fontWeight: 500 }}>
                    Target Milestone: <span style={{ color: '#111827', fontWeight: 600 }}>{formatCompactCurrency(targetAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Time Required */}
              <div className="card-hover-effect" style={{
                background: '#FFFFFF',
                padding: '20px 22px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '110px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#6B7280', fontWeight: 600, letterSpacing: '0.05em' }}>
                    Time Required
                  </span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'var(--gold-light)', border: '1px solid var(--border-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={16} color="var(--gold-dark)" />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: '#111827', fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.01em' }}>
                    {targetYears} Yrs {targetMonthsRemainder > 0 ? `${targetMonthsRemainder} Mos` : ''}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '6px', fontWeight: 500 }}>
                    Completion Age: <span style={{ color: 'var(--gold-dark)', fontWeight: 600 }}>Age {currentAge + targetYears}</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Expected Date */}
              <div className="card-hover-effect" style={{
                background: '#FFFFFF',
                padding: '20px 22px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '110px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#6B7280', fontWeight: 600, letterSpacing: '0.05em' }}>
                    Expected Date
                  </span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={16} color="#2563EB" />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>
                    {expectedDateString}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '6px', fontWeight: 500 }}>
                    Duration: <span style={{ color: '#2563EB', fontWeight: 600 }}>{mainSim.targetHitMonth} Compounding Months</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Line 2: 3 Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              
              {/* Card 4: Portfolio Value */}
              <div className="card-hover-effect" style={{
                background: '#FFFFFF',
                padding: '20px 22px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '110px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#6B7280', fontWeight: 600, letterSpacing: '0.05em' }}>
                    Portfolio Value
                  </span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp size={16} color="#059669" />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: '#059669', fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.01em' }}>
                    {formatCompactCurrency(targetPoint.portfolioValue)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '6px', fontWeight: 500 }}>
                    Exact Value: <span style={{ color: '#111827', fontWeight: 600 }}>{formatCurrency(targetPoint.portfolioValue)}</span>
                  </div>
                </div>
              </div>

              {/* Card 5: Total Invested */}
              <div className="card-hover-effect" style={{
                background: '#FFFFFF',
                padding: '20px 22px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '110px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#6B7280', fontWeight: 600, letterSpacing: '0.05em' }}>
                    Total Invested
                  </span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#F5F3FF', border: '1px solid #DDD6FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Wallet size={16} color="#7C3AED" />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: '#7C3AED', fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.01em' }}>
                    {formatCompactCurrency(targetPoint.totalInvested)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '6px', fontWeight: 500 }}>
                    Principal Outlay: <span style={{ color: '#111827', fontWeight: 600 }}>{formatCurrency(targetPoint.totalInvested)}</span>
                  </div>
                </div>
              </div>

              {/* Card 6: Investment Gain */}
              <div className="card-hover-effect" style={{
                background: '#FFFFFF',
                padding: '20px 22px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '110px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#6B7280', fontWeight: 600, letterSpacing: '0.05em' }}>
                    Investment Gain
                  </span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#FEF3C7', border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Award size={16} color="#D97706" />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: '#D97706', fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.01em' }}>
                    {formatCompactCurrency(targetPoint.returnsEarned)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '6px', fontWeight: 500 }}>
                    Compound Interest: <span style={{ color: '#111827', fontWeight: 600 }}>{formatCurrency(targetPoint.returnsEarned)}</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* ── 3. WEALTH GROWTH OVER TIME GRAPH ── */}
          <div style={{ background: '#FFFFFF', padding: '20px 24px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h4 className="brand-font" style={{ fontSize: '12px', color: 'var(--gold-dark)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, fontWeight: 700 }}>
                  Wealth Growth Over Time
                </h4>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Hover along the curve to inspect milestone portfolio values.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '16px', fontSize: '11px', fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--gold-primary)' }}>● Portfolio Value</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#6B3FA0' }}>- - Principal Outlay</span>
              </div>
            </div>

            <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
              <svg
                ref={svgRef}
                width="100%"
                height="300"
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                onMouseMove={handleSvgMouseMove}
                onMouseLeave={() => {
                  setHoverIdx(null);
                  setHoverSvgX(null);
                }}
                style={{ cursor: 'crosshair', display: 'block' }}
              >
                {/* Y-Axis Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                  const yVal = (chartHeight - paddingBottom) - ratio * drawableHeight;
                  return (
                    <g key={i}>
                      <line x1={paddingLeft} y1={yVal} x2={chartWidth - paddingRight} y2={yVal} stroke="#F3F4F6" strokeDasharray="3 3" />
                      <text x={paddingLeft - 10} y={yVal + 3} textAnchor="end" style={{ fontSize: '9px', fill: '#9CA3AF', fontWeight: 500 }}>
                        {formatCompactCurrency(maxSimVal * ratio)}
                      </text>
                    </g>
                  );
                })}

                {/* X-Axis Year Labels */}
                {mainSim.yearlyPoints.filter((_, idx) => idx % Math.max(1, Math.floor(pointsCount / 6)) === 0).map((p, i) => {
                  const pIdx = mainSim.yearlyPoints.indexOf(p);
                  return (
                    <text key={i} x={getX(pIdx)} y={chartHeight - 8} textAnchor="middle" style={{ fontSize: '9px', fill: '#9CA3AF', fontWeight: 500 }}>
                      Yr {Math.floor(p.month / 12)} (Age {p.age})
                    </text>
                  );
                })}

                {/* Area Fill */}
                <path d={areaPath} fill="rgba(188, 163, 116, 0.10)" />

                {/* Principal Dash Line */}
                <path d={lineInvestedPath} fill="none" stroke="#6B3FA0" strokeWidth="2" strokeDasharray="4 4" />

                {/* Portfolio Line */}
                <path d={linePortfolioPath} fill="none" stroke="var(--gold-primary)" strokeWidth="3" />

                {/* Active Hover Guide Line + Points */}
                {hoverSvgX !== null && hoverIdx !== null && activeHoverPoint && (
                  <g>
                    <line
                      x1={hoverSvgX}
                      y1={paddingTop}
                      x2={hoverSvgX}
                      y2={chartHeight - paddingBottom}
                      stroke="var(--gold-dark)"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                    <circle
                      cx={getX(hoverIdx)}
                      cy={getY(activeHoverPoint.portfolioValue)}
                      r="6"
                      fill="var(--gold-dark)"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                    <circle
                      cx={getX(hoverIdx)}
                      cy={getY(activeHoverPoint.totalInvested)}
                      r="5"
                      fill="#6B3FA0"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                  </g>
                )}
              </svg>

              {/* Floating Tooltip Card */}
              {hoverIdx !== null && activeHoverPoint && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '20px',
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  pointerEvents: 'none',
                  zIndex: 10
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gold-dark)', marginBottom: '3px', textTransform: 'uppercase' }}>
                    Year {Math.floor(activeHoverPoint.month / 12)} (Age {activeHoverPoint.age})
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>
                    Portfolio: <span style={{ color: '#10B981', fontWeight: 700 }}>{formatCurrency(activeHoverPoint.portfolioValue)}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Invested: <span style={{ color: '#6B3FA0', fontWeight: 600 }}>{formatCurrency(activeHoverPoint.totalInvested)}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Returns: <span style={{ color: '#D97706', fontWeight: 600 }}>{formatCurrency(activeHoverPoint.returnsEarned)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── 4. SIDE-BY-SIDE: INVESTMENT VS RETURNS PIE CHART (LEFT) | WEALTH ACCELERATION INSIGHTS (RIGHT) ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            
            {/* Left: Investment vs Returns Pie/Donut Chart */}
            <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '8px', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '320px' }}>
              <div style={{ alignSelf: 'flex-start', marginBottom: '10px' }}>
                <h4 className="brand-font" style={{ fontSize: '12px', color: 'var(--gold-dark)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, fontWeight: 700 }}>
                  Investment vs Returns Breakup
                </h4>
              </div>

              {/* SVG Donut Chart */}
              <div style={{ position: 'relative', width: '210px', height: '210px', margin: '10px 0' }}>
                <svg width="210" height="210" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
                  <circle cx="60" cy="60" r="50" fill="transparent" stroke="#F3F4F6" strokeWidth="14" />
                  
                  {/* Principal Invested Segment */}
                  <circle
                    cx="60" cy="60" r="50"
                    fill="transparent"
                    stroke="#6B3FA0"
                    strokeWidth={pieHoverSegment === 'invested' ? 18 : 14}
                    strokeDasharray={`${investedDash} ${circ - investedDash}`}
                    strokeDashoffset="0"
                    onMouseEnter={() => setPieHoverSegment('invested')}
                    onMouseLeave={() => setPieHoverSegment(null)}
                    style={{ cursor: 'pointer', transition: 'stroke-width 0.15s ease' }}
                  />

                  {/* Returns Segment */}
                  <circle
                    cx="60" cy="60" r="50"
                    fill="transparent"
                    stroke="#10B981"
                    strokeWidth={pieHoverSegment === 'returns' ? 18 : 14}
                    strokeDasharray={`${gainsDash} ${circ - gainsDash}`}
                    strokeDashoffset={-investedDash}
                    onMouseEnter={() => setPieHoverSegment('returns')}
                    onMouseLeave={() => setPieHoverSegment(null)}
                    style={{ cursor: 'pointer', transition: 'stroke-width 0.15s ease' }}
                  />
                </svg>

                {/* Center Dynamic Label */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  {pieHoverSegment === 'invested' ? (
                    <>
                      <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#6B3FA0', fontWeight: 700 }}>
                        Invested
                      </span>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Montserrat, sans-serif' }}>
                        {formatCompactCurrency(targetPoint.totalInvested)}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {(investedRatio * 100).toFixed(0)}% of total
                      </span>
                    </>
                  ) : pieHoverSegment === 'returns' ? (
                    <>
                      <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#10B981', fontWeight: 700 }}>
                        Returns Gain
                      </span>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Montserrat, sans-serif' }}>
                        {formatCompactCurrency(targetPoint.returnsEarned)}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {(gainsRatio * 100).toFixed(0)}% of total
                      </span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Montserrat, sans-serif' }}>
                        {(gainsRatio * 100).toFixed(0)}%
                      </span>
                      <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                        Returns Gain
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Legend Tags */}
              <div style={{ display: 'flex', gap: '20px', marginTop: '8px', fontSize: '11px', fontWeight: 600 }}>
                <div 
                  onMouseEnter={() => setPieHoverSegment('invested')}
                  onMouseLeave={() => setPieHoverSegment(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', opacity: pieHoverSegment === 'returns' ? 0.5 : 1 }}
                >
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#6B3FA0' }}></span>
                  <span>Invested ({formatCompactCurrency(targetPoint.totalInvested)})</span>
                </div>
                <div 
                  onMouseEnter={() => setPieHoverSegment('returns')}
                  onMouseLeave={() => setPieHoverSegment(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', opacity: pieHoverSegment === 'invested' ? 0.5 : 1 }}
                >
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }}></span>
                  <span>Returns ({formatCompactCurrency(targetPoint.returnsEarned)})</span>
                </div>
              </div>
            </div>

            {/* Right: Wealth Acceleration Insights */}
            <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '8px', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '320px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Zap size={16} color="var(--gold-dark)" />
                <h4 className="brand-font" style={{ fontSize: '12px', color: 'var(--gold-dark)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, fontWeight: 700 }}>
                  Wealth Acceleration Insights
                </h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Insight 1: SIP Boost */}
                <div style={{ background: 'var(--bg-tertiary)', padding: '14px 16px', borderRadius: '6px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Increase SIP by {formatCurrency(2000)}
                    </span>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      New SIP: {formatCurrency(monthlySIP + 2000)} / month
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '4px' }}>
                    Reach {monthsSavedBoost > 12 ? `${(monthsSavedBoost/12).toFixed(1)} yrs` : `${monthsSavedBoost} mos`} earlier
                  </span>
                </div>

                {/* Insight 2: Step-up Acceleration */}
                <div style={{ background: 'var(--bg-tertiary)', padding: '14px 16px', borderRadius: '6px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Increase Step-Up to {annualStepUp + 5}%
                    </span>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Boost annual SIP growth by +5%
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#3B82F6', background: 'rgba(59, 130, 246, 0.1)', padding: '4px 10px', borderRadius: '4px' }}>
                    Reach {monthsSavedStepUp > 12 ? `${(monthsSavedStepUp/12).toFixed(1)} yrs` : `${monthsSavedStepUp} mos`} earlier
                  </span>
                </div>

                {/* Insight 3: Long-term Pace */}
                <div style={{ background: 'var(--bg-tertiary)', padding: '14px 16px', borderRadius: '6px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      5 Crore Milestone Pace
                    </span>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      At your current compounding pace
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gold-dark)', background: 'rgba(188, 163, 116, 0.15)', padding: '4px 10px', borderRadius: '4px' }}>
                    Hit ₹5 Cr at Age {ageAt5Cr}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* ── 5. VERTICAL MILESTONE PROGRESSION TIMELINE ── */}
          <div style={{ background: '#FFFFFF', padding: '24px 28px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <h4 className="brand-font" style={{ fontSize: '12px', color: 'var(--gold-dark)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '24px', textAlign: 'center', fontWeight: 700 }}>
              Wealth Milestone Progression Journey
            </h4>

            {/* Vertical Line Container */}
            <div style={{ position: 'relative', maxWidth: '780px', margin: '0 auto', padding: '10px 0' }}>
              
              {/* Central Spine Line */}
              <div style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: '50%',
                width: '2px',
                background: 'var(--border-gold)',
                transform: 'translateX(-50%)'
              }} />

              {/* Timeline Nodes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {milestoneList.map((m, idx) => {
                  const isLeft = idx % 2 === 0;
                  const isTargetNode = m.targetAmount === targetAmount;

                  return (
                    <div key={idx} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      
                      {/* Node Circle */}
                      <div style={{
                        position: 'absolute',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: isTargetNode ? 'var(--gold-dark)' : 'var(--gold-primary)',
                        border: '2px solid #FFFFFF',
                        boxShadow: '0 0 0 2px var(--border-gold)',
                        zIndex: 2
                      }} />

                      {/* Content Card */}
                      <div style={{
                        width: '45%',
                        marginLeft: isLeft ? '0' : 'auto',
                        marginRight: isLeft ? 'auto' : '0',
                        textAlign: isLeft ? 'right' : 'left'
                      }}>
                        <div style={{
                          background: isTargetNode ? 'var(--gold-light)' : 'var(--bg-tertiary)',
                          padding: '14px 16px',
                          borderRadius: '6px',
                          border: isTargetNode ? '1px solid var(--gold-primary)' : '1px solid #E5E7EB',
                          display: 'inline-block',
                          width: '100%'
                        }}>
                          <div style={{ display: 'flex', justifyContent: isLeft ? 'flex-end' : 'flex-start', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--gold-dark)', textTransform: 'uppercase' }}>
                              Milestone {idx + 1}
                            </span>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                              Year {Math.floor(m.month / 12)} (Age {m.age})
                            </span>
                          </div>

                          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gold-dark)', marginBottom: '2px', fontFamily: 'Montserrat, sans-serif' }}>
                            {m.label}
                          </div>

                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            Invested: {formatCompactCurrency(m.totalInvested)}
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── 6. WHAT-IF OPTIMIZATION SCENARIOS ── */}
          <div style={{ background: '#FFFFFF', padding: '24px 28px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <h4 className="brand-font" style={{ fontSize: '12px', color: 'var(--gold-dark)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '18px', fontWeight: 700 }}>
              What-If Optimization Scenarios
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              
              {/* Scenario 1: Base */}
              <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Current Base Plan</span>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: '6px 0', fontFamily: 'Montserrat, sans-serif' }}>
                  {targetYears} Yrs {targetMonthsRemainder} Mos
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  SIP: {formatCurrency(monthlySIP)} | Step: {annualStepUp}%
                </div>
              </div>

              {/* Scenario 2: +₹5k SIP */}
              <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '16px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#10B981', textTransform: 'uppercase' }}>+ ₹5,000 Monthly SIP</span>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#10B981', margin: '6px 0', fontFamily: 'Montserrat, sans-serif' }}>
                  {Math.floor(runSimulation(monthlySIP + 5000, annualStepUp, currentSavings, oneTimeInvestment, expectedReturn, targetAmount).targetHitMonth / 12)} Yrs {runSimulation(monthlySIP + 5000, annualStepUp, currentSavings, oneTimeInvestment, expectedReturn, targetAmount).targetHitMonth % 12} Mos
                </div>
                <div style={{ fontSize: '10px', color: '#10B981', fontWeight: 600 }}>
                  Saves {Math.max(0, mainSim.targetHitMonth - runSimulation(monthlySIP + 5000, annualStepUp, currentSavings, oneTimeInvestment, expectedReturn, targetAmount).targetHitMonth)} months
                </div>
              </div>

              {/* Scenario 3: 15% Step Up */}
              <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '16px', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase' }}>15% Annual Step-Up</span>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#3B82F6', margin: '6px 0', fontFamily: 'Montserrat, sans-serif' }}>
                  {Math.floor(runSimulation(monthlySIP, 15, currentSavings, oneTimeInvestment, expectedReturn, targetAmount).targetHitMonth / 12)} Yrs {runSimulation(monthlySIP, 15, currentSavings, oneTimeInvestment, expectedReturn, targetAmount).targetHitMonth % 12} Mos
                </div>
                <div style={{ fontSize: '10px', color: '#3B82F6', fontWeight: 600 }}>
                  Saves {Math.max(0, mainSim.targetHitMonth - runSimulation(monthlySIP, 15, currentSavings, oneTimeInvestment, expectedReturn, targetAmount).targetHitMonth)} months
                </div>
              </div>

              {/* Scenario 4: +2% Yield */}
              <div style={{ background: 'rgba(188, 163, 116, 0.08)', padding: '16px', borderRadius: '6px', border: '1px solid var(--gold-primary)' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--gold-dark)', textTransform: 'uppercase' }}>+ 2% Return ({expectedReturn + 2}%)</span>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--gold-dark)', margin: '6px 0', fontFamily: 'Montserrat, sans-serif' }}>
                  {Math.floor(yieldSim.targetHitMonth / 12)} Yrs {yieldSim.targetHitMonth % 12} Mos
                </div>
                <div style={{ fontSize: '10px', color: 'var(--gold-dark)', fontWeight: 600 }}>
                  Saves {monthsSavedYield} months
                </div>
              </div>

            </div>
          </div>

          {/* ── 7. YEARLY WEALTH ACCUMULATION STATEMENT SHEET ── */}
          <div style={{ background: '#FFFFFF', padding: '24px 28px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border-gold)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} color="var(--gold-dark)" />
                <h4 className="brand-font" style={{ fontSize: '12px', color: 'var(--gold-dark)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, fontWeight: 700 }}>
                  Yearly Wealth Accumulation Statement
                </h4>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Showing Entries {((schedulePage - 1) * 10) + 1} - {Math.min(mainSim.yearlyPoints.length, schedulePage * 10)} of {mainSim.yearlyPoints.length}
              </span>
            </div>

            <div className="comparison-table-wrapper" style={{ overflowX: 'auto' }}>
              <table className="comparison-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '2px solid var(--border-gold)' }}>
                    <th style={{ padding: '12px', fontSize: '11px', textTransform: 'uppercase' }}>Period / Age</th>
                    <th style={{ padding: '12px', fontSize: '11px', textTransform: 'uppercase' }}>Monthly SIP</th>
                    <th style={{ padding: '12px', fontSize: '11px', textTransform: 'uppercase' }}>Total Invested</th>
                    <th style={{ padding: '12px', fontSize: '11px', textTransform: 'uppercase' }}>Returns Earned</th>
                    <th style={{ padding: '12px', fontSize: '11px', textTransform: 'uppercase' }}>Closing Value</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTableRows.map((row, idx) => {
                    const yrs = Math.floor(row.month / 12);
                    const mos = row.month % 12;
                    const periodStr = mos > 0 ? `Year ${yrs} Mo ${mos}` : `Year ${yrs}`;
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)', background: row.portfolioValue >= targetAmount ? 'rgba(16, 185, 129, 0.05)' : 'transparent' }}>
                        <td style={{ padding: '12px', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {periodStr} (Age {row.age})
                          {row.portfolioValue >= targetAmount && <span style={{ fontSize: '10px', marginLeft: '6px', color: '#10B981', fontWeight: 700 }}>🎯 Target</span>}
                        </td>
                        <td style={{ padding: '12px', fontSize: '12px' }}>{formatCurrency(row.monthlySIP)}</td>
                        <td style={{ padding: '12px', fontSize: '12px', color: '#6B3FA0', fontWeight: 600 }}>{formatCurrency(row.totalInvested)}</td>
                        <td style={{ padding: '12px', fontSize: '12px', color: '#10B981', fontWeight: 600 }}>{formatCurrency(row.returnsEarned)}</td>
                        <td style={{ padding: '12px', fontSize: '12px', fontWeight: 700, color: 'var(--gold-dark)', fontFamily: 'Montserrat, sans-serif' }}>{formatCurrency(row.portfolioValue)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
                <button
                  type="button"
                  disabled={schedulePage === 1}
                  onClick={() => setSchedulePage(prev => Math.max(1, prev - 1))}
                  className="btn-gold-outline"
                  style={{ padding: '6px 14px', fontSize: '11px', borderRadius: '4px', opacity: schedulePage === 1 ? 0.4 : 1 }}
                >
                  ◀ Previous Page
                </button>

                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Page {schedulePage} of {totalPages}
                </span>

                <button
                  type="button"
                  disabled={schedulePage === totalPages}
                  onClick={() => setSchedulePage(prev => Math.min(totalPages, prev + 1))}
                  className="btn-gold-outline"
                  style={{ padding: '6px 14px', fontSize: '11px', borderRadius: '4px', opacity: schedulePage === totalPages ? 0.4 : 1 }}
                >
                  Next Page ▶
                </button>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
