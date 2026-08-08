import { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  ChevronUp,
  User,
  Wallet,
  ShoppingCart,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  Brain,
  Plus,
  Trash2,
  RotateCcw,
  Award,
  AlertTriangle,
  CheckCircle,
  Target,
  HeartHandshake,
  BarChart3,
  PieChart,
  Sliders
} from 'lucide-react';

/* ============================================================================
   TYPE DEFINITIONS
   ============================================================================ */

type MaritalStatus = 'single' | 'married';
type IncomeSafety = 'seasonal' | 'normal' | 'permanent';
type IncomeType = 'business' | 'regular' | 'self_employment' | 'freelance' | 'passive';
type HousingType = 'rental' | 'loan' | 'own';
type InsuranceCover = 'none' | 'basic' | 'adequate';
type EmergencyFundLevel = 'none' | 'low' | 'moderate' | 'strong';
type DiversificationLevel = 'none' | 'partial' | 'diversified';
type DependantRelation = 'spouse' | 'child' | 'parent' | 'other';

interface IncomeSource {
  id: string;
  value: number;
  yearlyGrowth: number;
  safety: IncomeSafety;
  type: IncomeType;
}

interface PersonalDetails {
  age: number;
  status: MaritalStatus;
  dependants: number;
}

interface DependantItem {
  id: string;
  name: string;
  relation: DependantRelation;
  age: number;
  monthlyIncome: number;
  safety: IncomeSafety;
  monthlyExpense: number;
}

interface NeedsExpenses {
  housing: HousingType;
  housingAmount: number;
  fuel: number;
  healthFoodGroceries: number;
  workerPay: number;
  miscellaneous: number;
}

interface WantsExpenses {
  entertainment: number;
  subscriptions: number;
  shopping: number;
  miscellaneous: number;
}

interface SafetyData {
  termInsurance: InsuranceCover;
  healthInsurance: InsuranceCover;
  emergencyFund: EmergencyFundLevel;
}

interface InvestmentData {
  monthlyAllocated: number;
  portfolioDiversified: DiversificationLevel;
  currentValue: number;
}

interface EMIData {
  assetEMI: number;
  liabilityEMI: number;
}

interface MindsetData {
  satisfaction: number;
  discipline: number;
  futurePlanning: number;
  riskTolerance: number;
  financialLiteracy: number;
}

interface CategoryScore {
  name: string;
  score: number;
  max: number;
  icon: React.ReactNode;
  color: string;
}

interface Recommendation {
  category: string;
  currentScore: number;
  maxScore: number;
  advice: string[];
  priority: 'critical' | 'important' | 'moderate' | 'good';
}

/* ============================================================================
   HELPER
   ============================================================================ */

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
};

/* ============================================================================
   SCORING ENGINE
   ============================================================================ */

function calculatePersonalScore(data: PersonalDetails): number {
  let score = 0;
  if (data.age >= 18 && data.age <= 30) score += 2;
  else if (data.age <= 45) score += 1.5;
  else if (data.age <= 60) score += 1;
  else score += 0.5;

  score += data.status === 'married' ? 1.5 : 1;

  if (data.dependants === 0) score += 1.5;
  else if (data.dependants <= 2) score += 1;
  else score += 0.5;

  return Math.min(5, score);
}

function calculateIncomeScore(sources: IncomeSource[], totalExpenses: number): number {
  if (!sources || sources.length === 0) return 0;

  const totalIncome = sources.reduce((s, src) => s + (src.value || 0), 0);
  if (totalIncome <= 0) return 0;
  let score = 0;

  if (totalExpenses > 0) {
    const ratio = totalIncome / totalExpenses;
    if (ratio >= 3) score += 7;
    else if (ratio >= 2) score += 5;
    else if (ratio >= 1) score += 2;
  } else {
    score += 7;
  }

  const avgGrowth = sources.reduce((s, src) => s + (src.yearlyGrowth || 0), 0) / sources.length;
  if (avgGrowth >= 10) score += 4;
  else if (avgGrowth >= 5) score += 3;
  else if (avgGrowth > 0) score += 1;

  const safetyMap: Record<IncomeSafety, number> = { permanent: 5, normal: 3, seasonal: 1 };
  const weightedSafety = sources.reduce((s, src) => s + (safetyMap[src.safety] || 3) * (src.value || 0), 0) / totalIncome;
  score += Math.min(5, isNaN(weightedSafety) ? 0 : weightedSafety);

  const uniqueTypes = new Set(sources.map(s => s.type));
  if (uniqueTypes.size >= 2) score += 4;
  else if (sources.length > 0) {
    const singleSource = sources[0];
    if (singleSource && singleSource.safety === 'permanent') score += 3;
    else score += 1;
  }

  return Math.min(20, isNaN(score) ? 0 : Math.round(score * 10) / 10);
}

function calculateExpenseScore(needs: NeedsExpenses, wants: WantsExpenses, totalIncome: number): number {
  if (totalIncome <= 0) return 0;
  let score = 0;

  const totalNeeds = needs.housingAmount + needs.fuel + needs.healthFoodGroceries + needs.workerPay + needs.miscellaneous;
  const totalWants = wants.entertainment + wants.subscriptions + wants.shopping + wants.miscellaneous;

  const needsRatio = totalNeeds / totalIncome;
  if (needsRatio <= 0.5) score += 8;
  else if (needsRatio <= 0.7) score += 5;
  else if (needsRatio <= 0.9) score += 2;

  const wantsRatio = totalWants / totalIncome;
  if (wantsRatio <= 0.1) score += 7;
  else if (wantsRatio <= 0.2) score += 5;
  else if (wantsRatio <= 0.3) score += 3;

  if (needs.housing === 'own') score += 5;
  else if (needs.housing === 'loan') score += 3;
  else score += 1;

  return Math.min(20, score);
}

function calculateDependantsScore(dependants: DependantItem[]): number {
  if (dependants.length === 0) return 5;

  let score = 0;
  const perDepMax = 5 / dependants.length;

  for (const dep of dependants) {
    let depScore = perDepMax * 0.4;
    if (dep.monthlyIncome > 0) {
      if (dep.monthlyIncome >= dep.monthlyExpense) depScore += perDepMax * 0.4;
      else depScore += perDepMax * 0.2;
    } else {
      if (dep.monthlyExpense < 5000) depScore += perDepMax * 0.2;
    }
    if (dep.safety === 'permanent') depScore += perDepMax * 0.2;
    else if (dep.safety === 'normal') depScore += perDepMax * 0.1;
    score += depScore;
  }
  return Math.min(5, Math.round(score * 10) / 10);
}

function calculateSafetyScore(data: SafetyData): number {
  let score = 0;

  if (data.termInsurance === 'adequate') score += 7;
  else if (data.termInsurance === 'basic') score += 4;

  if (data.healthInsurance === 'adequate') score += 7;
  else if (data.healthInsurance === 'basic') score += 4;

  const efMap: Record<string, number> = { strong: 6, moderate: 4, low: 2, none: 0, adequate: 4 };
  score += (efMap[data.emergencyFund] || 0);

  return Math.min(20, isNaN(score) ? 0 : score);
}

function calculateInvestmentScore(data: InvestmentData, totalIncome: number, totalExpenses: number): number {
  let score = 0;

  if (totalIncome > 0) {
    const allocPct = (data.monthlyAllocated / totalIncome) * 100;
    if (allocPct >= 25) score += 6;
    else if (allocPct >= 15) score += 4;
    else if (allocPct >= 5) score += 2;
  }

  if (data.portfolioDiversified === 'diversified') score += 5;
  else if (data.portfolioDiversified === 'partial') score += 3;
  else score += 1;

  if (totalExpenses > 0) {
    const monthsCovered = data.currentValue / totalExpenses;
    if (monthsCovered >= 24) score += 4;
    else if (monthsCovered >= 12) score += 3;
    else if (monthsCovered >= 6) score += 2;
    else score += 1;
  }

  return Math.min(15, score);
}

function calculateEMIScore(data: EMIData, totalIncome: number): number {
  let score = 0;

  if (totalIncome > 0) {
    const assetPct = (data.assetEMI / totalIncome) * 100;
    if (data.assetEMI === 0) score += 3;
    else if (assetPct <= 30) score += 5;
    else score += 2;
  } else {
    score += 3;
  }

  if (totalIncome > 0) {
    const liabPct = (data.liabilityEMI / totalIncome) * 100;
    if (data.liabilityEMI === 0) score += 5;
    else if (liabPct <= 10) score += 3;
    else score += 0;
  } else {
    score += 5;
  }

  return Math.min(10, score);
}

/* Mindset Score: 5 questions, max 5 marks (each question = 1 mark) */
function calculateMindsetScore(data: MindsetData): number {
  const m1 = (data.satisfaction / 5) * 1;
  const m2 = (data.discipline / 5) * 1;
  const m3 = (data.futurePlanning / 5) * 1;
  const m4 = (data.riskTolerance / 5) * 1;
  const m5 = (data.financialLiteracy / 5) * 1;

  const total = m1 + m2 + m3 + m4 + m5;
  return Math.min(5, Math.round(total * 10) / 10);
}

function generateRecommendations(scores: CategoryScore[]): Recommendation[] {
  const recs: Recommendation[] = [];

  for (const cat of scores) {
    const pct = cat.max > 0 ? (cat.score / cat.max) * 100 : 100;
    let priority: Recommendation['priority'] = 'good';
    if (pct < 40) priority = 'critical';
    else if (pct < 60) priority = 'important';
    else if (pct < 80) priority = 'moderate';

    const advice: string[] = [];

    switch (cat.name) {
      case 'Personal Details':
        if (pct < 60) {
          advice.push('Ensure adequate insurance and liquid emergency savings for your family requirements.');
        }
        break;
      case 'Monthly Income':
        if (pct < 40) {
          advice.push('Income stability is low. Build a secondary income stream like freelancing or investments.');
          advice.push('Target annual income growth of 8-10% through upskilling or role advancement.');
        } else if (pct < 70) {
          advice.push('Explore passive income channels to diversify away from a single earning source.');
        }
        break;
      case 'Monthly Expense':
        if (pct < 40) {
          advice.push('Expenses are consuming too much of your earnings. Apply the 50/30/20 budget framework.');
        } else if (pct < 70) {
          advice.push('Audit discretionary wants (subscriptions, shopping) to increase your monthly savings buffer.');
        }
        break;
      case 'Dependants':
        if (pct < 60) {
          advice.push('Ensure adequate health insurance and emergency reserves covering all family dependants.');
        }
        break;
      case 'Safety':
        if (pct < 40) {
          advice.push('Get a term life insurance policy covering at least 10x your annual income.');
          advice.push('Secure a family health cover of at least ₹10 Lakhs and a 6-month emergency reserve.');
        } else if (pct < 70) {
          advice.push('Review insurance coverage to match your current cost of living.');
        }
        break;
      case 'Investment':
        if (pct < 40) {
          advice.push('Automate monthly investments into diversified low-cost index funds.');
        } else if (pct < 70) {
          advice.push('Increase your investment rate to 20-25% of monthly net income.');
        }
        break;
      case 'Installments/EMI':
        if (pct < 40) {
          advice.push('Clear high-interest consumer debt (credit card/gadget EMIs) immediately.');
        } else if (pct < 70) {
          advice.push('Keep total EMI expenses strictly below 35-40% of total income.');
        }
        break;
      case 'Mindset':
        if (pct < 40) {
          advice.push('Build a habit of reviewing expenses weekly to improve money control.');
        } else if (pct < 70) {
          advice.push('Set clear 1-year and 5-year goal milestones to boost financial planning confidence.');
        }
        break;
    }

    if (advice.length > 0 || priority !== 'good') {
      if (advice.length === 0 && priority === 'good') {
        advice.push('Strong habits in this dimension. Maintain momentum.');
      }
      recs.push({ category: cat.name, currentScore: cat.score, maxScore: cat.max, advice, priority });
    }
  }

  const priorityOrder = { critical: 0, important: 1, moderate: 2, good: 3 };
  recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recs;
}

/* ============================================================================
   1. UNIFIED PIE CHART & EXPENDITURE BAR CHART (Side-by-Side Layout)
   ============================================================================ */

function PieChartAndBarChartSection({ 
  totalIncome, 
  needs, 
  wants, 
  emi, 
  investmentAmount 
}: { 
  totalIncome: number; 
  needs: NeedsExpenses; 
  wants: WantsExpenses; 
  emi: EMIData; 
  investmentAmount: number; 
}) {
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);
  const [pieMousePos, setPieMousePos] = useState<{ x: number; y: number } | null>(null);

  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [barMousePos, setBarMousePos] = useState<{ x: number; y: number } | null>(null);

  const formatCurrency = (val: number) => '₹' + Math.round(val).toLocaleString('en-IN');
  const formatShortCurrency = (val: number) => {
    if (val >= 100000) return '₹' + (val / 100000).toFixed(1) + 'L';
    if (val >= 1000) return '₹' + Math.round(val / 1000) + 'k';
    return '₹' + Math.round(val);
  };

  const needsTotal = (needs.housingAmount || 0) + (needs.fuel || 0) + (needs.healthFoodGroceries || 0) + (needs.workerPay || 0) + (needs.miscellaneous || 0);
  const wantsTotal = (wants.entertainment || 0) + (wants.subscriptions || 0) + (wants.shopping || 0) + (wants.miscellaneous || 0);
  const emiTotal = (emi.assetEMI || 0) + (emi.liabilityEMI || 0);
  const surplusAmount = Math.max(0, totalIncome - (needsTotal + wantsTotal + emiTotal + investmentAmount));
  const baseTotal = totalIncome > 0 ? totalIncome : (needsTotal + wantsTotal + emiTotal + investmentAmount);

  if (baseTotal <= 0) return null;

  const pieItems = [
    { label: 'Essential Needs', amount: needsTotal, color: '#D44A1C', detail: 'Housing, Food, Fuel, Worker Pay & Essential Needs' },
    { label: 'Lifestyle Wants', amount: wantsTotal, color: '#6B3FA0', detail: 'Shopping, Outings, Subscriptions & Discretionary' },
    { label: 'Investments & SIP', amount: investmentAmount, color: '#137A57', detail: 'Monthly Allocated Investments & Wealth SIPs' },
    { label: 'Loan EMIs', amount: emiTotal, color: '#B31B1B', detail: 'Asset Loans & Consumer Debt EMIs' },
    { label: 'Unallocated Surplus', amount: surplusAmount, color: '#8E703F', detail: 'Unallocated Monthly Income Surplus' },
  ].filter(i => i.amount > 0);

  // Big Solid Pie Chart (Radius R=170, SVG 360x360)
  let cumulativePercent = 0;
  const slices = pieItems.map((item, idx) => {
    const startPercent = cumulativePercent;
    const slicePercent = item.amount / baseTotal;
    cumulativePercent += slicePercent;
    const endPercent = cumulativePercent;

    const startX = Math.cos(2 * Math.PI * startPercent - Math.PI / 2);
    const startY = Math.sin(2 * Math.PI * startPercent - Math.PI / 2);
    const endX = Math.cos(2 * Math.PI * endPercent - Math.PI / 2);
    const endY = Math.sin(2 * Math.PI * endPercent - Math.PI / 2);

    const largeArcFlag = slicePercent > 0.5 ? 1 : 0;
    const radius = 170;
    const cx = 180;
    const cy = 180;

    const pathData = slicePercent >= 0.999 
      ? `M ${cx - radius} ${cy} A ${radius} ${radius} 0 1 0 ${cx + radius} ${cy} A ${radius} ${radius} 0 1 0 ${cx - radius} ${cy}`
      : [
          `M ${cx} ${cy}`,
          `L ${cx + radius * startX} ${cy + radius * startY}`,
          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${cx + radius * endX} ${cy + radius * endY}`,
          `Z`,
        ].join(' ');

    return { idx, pathData, item, pct: Math.round(slicePercent * 100) };
  });

  const barCategories = [
    { label: 'Housing', fullLabel: 'Housing (Rent / Home Loan)', amount: needs.housingAmount || 0, color: '#D44A1C' },
    { label: 'Food & Health', fullLabel: 'Food, Groceries & Healthcare', amount: needs.healthFoodGroceries || 0, color: '#D44A1C' },
    { label: 'Fuel', fullLabel: 'Fuel & Commute', amount: needs.fuel || 0, color: '#D44A1C' },
    { label: 'Staff Pay', fullLabel: 'Staff & Worker Pay', amount: needs.workerPay || 0, color: '#D44A1C' },
    { label: 'Misc Needs', fullLabel: 'Essential Misc.', amount: needs.miscellaneous || 0, color: '#D44A1C' },
    { label: 'Shopping', fullLabel: 'Shopping & Apparel', amount: wants.shopping || 0, color: '#6B3FA0' },
    { label: 'Outings', fullLabel: 'Entertainment & Outings', amount: wants.entertainment || 0, color: '#6B3FA0' },
    { label: 'Subscriptions', fullLabel: 'Subscriptions & Apps', amount: wants.subscriptions || 0, color: '#6B3FA0' },
    { label: 'Misc Wants', fullLabel: 'Discretionary Misc.', amount: wants.miscellaneous || 0, color: '#6B3FA0' },
    { label: 'Asset EMI', fullLabel: 'Wealth Asset EMI', amount: emi.assetEMI || 0, color: '#1E3C72' },
    { label: 'Debt EMI', fullLabel: 'Consumer Debt EMI', amount: emi.liabilityEMI || 0, color: '#B31B1B' },
    { label: 'SIP Invest', fullLabel: 'Monthly Investment SIP', amount: investmentAmount || 0, color: '#137A57' },
  ].filter(c => c.amount > 0);

  const maxBarAmount = Math.max(...barCategories.map(c => c.amount), 1000);
  const yTicks = [1, 0.75, 0.5, 0.25, 0].map(ratio => Math.round(maxBarAmount * ratio));

  return (
    <div 
      style={{ 
        width: '100%', 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', 
        gap: '28px', 
        marginBottom: '36px', 
        alignItems: 'stretch',
        textAlign: 'left'
      }}
    >
      {/* LEFT: BIG SOLID PIE CHART CONTAINER (LEFT SIDE) */}
      <div 
        style={{ 
          background: '#FFFFFF', 
          border: '1px solid var(--border-light)', 
          borderRadius: '16px', 
          padding: '24px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          justifyContent: 'flex-start',
          position: 'relative',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
        }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setPieMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }}
        onMouseLeave={() => {
          setHoveredSlice(null);
          setPieMousePos(null);
        }}
      >
        <div style={{ width: '100%', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-light)' }}>
          <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '19px', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PieChart size={20} style={{ color: 'var(--gold-dark)' }} />
            Income Allocation Breakdown
          </h4>
        </div>

        {/* Big SVG Pie Chart Container (Fills Full Card Space) */}
        <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 0' }}>
          <div style={{ position: 'relative', width: '360px', height: '360px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="360" height="360" viewBox="0 0 360 360" style={{ display: 'block', maxWidth: '100%', height: 'auto' }}>
              {slices.map((slice) => {
                const isHovered = hoveredSlice === slice.idx;
                return (
                  <path
                    key={slice.idx}
                    d={slice.pathData}
                    fill={slice.item.color}
                    stroke="#FFFFFF"
                    strokeWidth="3"
                    onMouseEnter={() => setHoveredSlice(slice.idx)}
                    onMouseLeave={() => setHoveredSlice(null)}
                    style={{
                      cursor: 'pointer',
                      opacity: hoveredSlice === null || isHovered ? 1 : 0.45,
                      transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                      transformOrigin: '180px 180px',
                      filter: isHovered ? 'drop-shadow(0px 8px 18px rgba(0,0,0,0.25))' : 'none',
                      transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease, filter 0.2s ease'
                    }}
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* Cursor-Following Hover Tooltip Card for Pie Slices (Compact Explanation) */}
        {hoveredSlice !== null && pieItems[hoveredSlice] && pieMousePos && (
          <div
            style={{
              position: 'absolute',
              left: Math.min(Math.max(12, pieMousePos.x + 12), 220),
              top: Math.max(12, pieMousePos.y - 60),
              pointerEvents: 'none',
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(8px)',
              border: `1.5px solid ${pieItems[hoveredSlice].color}`,
              borderRadius: '8px',
              padding: '7px 11px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              zIndex: 100,
              maxWidth: '190px',
              transition: 'left 0.05s linear, top 0.05s linear'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: pieItems[hoveredSlice].color }} />
              <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{pieItems[hoveredSlice].label}</strong>
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: pieItems[hoveredSlice].color }}>
              {formatCurrency(pieItems[hoveredSlice].amount)} ({Math.round((pieItems[hoveredSlice].amount / baseTotal) * 100)}%)
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.2 }}>
              {pieItems[hoveredSlice].detail}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: VERTICAL EXPENDITURE BAR CHART (Y-AXIS LEFT, NAMES BELOW, VERTICAL BARS) */}
      <div 
        style={{ 
          background: '#FFFFFF', 
          border: '1px solid var(--border-light)', 
          borderRadius: '16px', 
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
        }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setBarMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }}
        onMouseLeave={() => {
          setHoveredBar(null);
          setBarMousePos(null);
        }}
      >
        <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-light)' }}>
          <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '19px', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 size={20} style={{ color: 'var(--gold-dark)' }} />
            Monthly Expenditure Breakdown
          </h4>
        </div>

        {/* Cursor-Following Hover Tooltip Card for Vertical Bars */}
        {hoveredBar !== null && barCategories[hoveredBar] && barMousePos && (
          <div
            style={{
              position: 'absolute',
              left: Math.min(Math.max(16, barMousePos.x - 60), 280),
              top: Math.max(16, barMousePos.y - 75),
              pointerEvents: 'none',
              background: 'rgba(255, 255, 255, 0.97)',
              backdropFilter: 'blur(8px)',
              border: `2px solid ${barCategories[hoveredBar].color}`,
              borderRadius: '10px',
              padding: '10px 14px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.18)',
              zIndex: 100,
              whiteSpace: 'nowrap',
              transition: 'left 0.05s linear, top 0.05s linear'
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
              {barCategories[hoveredBar].fullLabel}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: barCategories[hoveredBar].color, marginTop: '2px' }}>
              {formatCurrency(barCategories[hoveredBar].amount)}
            </div>
          </div>
        )}

        {/* Vertical Chart Box with Left Y-Axis Grid */}
        <div style={{ display: 'flex', flex: 1, minHeight: '300px', position: 'relative', marginTop: '10px' }}>
          
          {/* Y-Axis Labels (Left side) */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingRight: '12px', height: '280px' }}>
            {yTicks.map((val, idx) => (
              <span key={idx} style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right', whiteSpace: 'nowrap' }}>
                {formatShortCurrency(val)}
              </span>
            ))}
          </div>

          {/* Gridlines & Vertical Bars Column Plot */}
          <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
            
            {/* Background Horizontal Grid Lines */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
              {yTicks.map((_, idx) => (
                <div key={idx} style={{ borderBottom: '1px dashed var(--border-light)', width: '100%' }} />
              ))}
            </div>

            {/* Vertical Columns Grid */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '280px', padding: '0 8px', position: 'relative', zIndex: 2 }}>
              {barCategories.map((cat, i) => {
                const heightPct = Math.max(6, Math.round((cat.amount / maxBarAmount) * 100));
                const isHovered = hoveredBar === i;

                return (
                  <div
                    key={i}
                    onMouseEnter={() => setHoveredBar(i)}
                    onMouseLeave={() => setHoveredBar(null)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%',
                      justifyContent: 'flex-end',
                      flex: 1,
                      maxWidth: '36px',
                      margin: '0 3px',
                      cursor: 'pointer'
                    }}
                  >
                    {/* Top Value Label Pill */}
                    <span 
                      style={{ 
                        fontSize: '10px', 
                        fontWeight: 700, 
                        color: isHovered ? cat.color : 'var(--text-secondary)', 
                        marginBottom: '6px',
                        whiteSpace: 'nowrap',
                        transition: 'color 0.2s ease, transform 0.2s ease',
                        transform: isHovered ? 'scale(1.15)' : 'scale(1)'
                      }}
                    >
                      {formatShortCurrency(cat.amount)}
                    </span>

                    {/* Vertical Bar Fill Track */}
                    <div 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        maxHeight: `${heightPct}%`, 
                        background: isHovered ? `${cat.color}33` : 'var(--bg-tertiary)',
                        borderRadius: '6px 6px 2px 2px', 
                        display: 'flex',
                        alignItems: 'flex-end',
                        overflow: 'hidden',
                        transition: 'background 0.2s ease'
                      }}
                    >
                      <div 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          background: `linear-gradient(to top, ${cat.color}, ${cat.color}DD)`, 
                          borderRadius: '6px 6px 2px 2px',
                          boxShadow: isHovered ? `0 0 12px ${cat.color}66` : 'none',
                          transform: isHovered ? 'scaleY(1.04)' : 'scaleY(1)',
                          transformOrigin: 'bottom',
                          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                        }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

/* ============================================================================
   3. INTEREST & COMPOUND GROWTH GRAPH (30 Years)
   ============================================================================ */

function CompoundInterestGrowthGraph({ 
  currentPortfolio, 
  monthlyInvestment 
}: { 
  currentPortfolio: number; 
  monthlyInvestment: number; 
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const years = [0, 5, 10, 15, 20, 25, 30];
  const annualReturn = 0.12; // 12% p.a.
  const monthlyRate = annualReturn / 12;

  const points = years.map((y) => {
    const months = y * 12;
    const pFuture = currentPortfolio * Math.pow(1 + monthlyRate, months);
    const sipFuture = monthlyInvestment > 0 
      ? monthlyInvestment * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate)
      : 0;
    const totalFuture = Math.round(pFuture + sipFuture);
    const totalInvested = Math.round(currentPortfolio + (monthlyInvestment * months));
    const gains = Math.max(0, totalFuture - totalInvested);

    return { year: y, totalFuture, totalInvested, gains };
  });

  const maxFuture = Math.max(...points.map(p => p.totalFuture), 10000);
  const width = 900;
  const height = 240;
  const paddingLeft = 40;
  const paddingBottom = 35;
  const chartWidth = width - paddingLeft - 20;
  const chartHeight = height - paddingBottom - 20;

  // Build SVG path
  const linePoints = points.map((p, idx) => {
    const x = paddingLeft + (idx / (points.length - 1)) * chartWidth;
    const y = height - paddingBottom - (p.totalFuture / maxFuture) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  const investedLinePoints = points.map((p, idx) => {
    const x = paddingLeft + (idx / (points.length - 1)) * chartWidth;
    const y = height - paddingBottom - (p.totalInvested / maxFuture) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '24px', marginBottom: '28px', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-light)' }}>
        <div>
          <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} style={{ color: '#137A57' }} />
            Compound Interest & Wealth Accelerator
          </h4>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Compounding returns on initial capital + monthly SIP @ 12% p.a.
          </span>
        </div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '11px', fontWeight: 600 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '3px', background: '#1E3C72' }} />
            <span>Principal Invested</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '3px', background: '#10B981' }} />
            <span>Total Compounded Wealth</span>
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = height - paddingBottom - ratio * chartHeight;
            return (
              <g key={i}>
                <line x1={paddingLeft} y1={y} x2={width - 20} y2={y} stroke="var(--border-light)" strokeDasharray="3 3" />
              </g>
            );
          })}

          {/* Invested Area/Line */}
          <polyline fill="none" stroke="#1E3C72" strokeWidth="2.5" points={investedLinePoints} />

          {/* Total Compounded Line */}
          <polyline fill="none" stroke="#10B981" strokeWidth="3" points={linePoints} />

          {/* Dots on points */}
          {points.map((p, idx) => {
            const x = paddingLeft + (idx / (points.length - 1)) * chartWidth;
            const y = height - paddingBottom - (p.totalFuture / maxFuture) * chartHeight;
            const isHovered = hoverIdx === idx;

            return (
              <g key={idx} onMouseEnter={() => setHoverIdx(idx)} onMouseLeave={() => setHoverIdx(null)} style={{ cursor: 'pointer' }}>
                <circle cx={x} cy={y} r={isHovered ? 6 : 4} fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
                <text x={x} y={height - 8} fontSize="10" fontFamily="Montserrat" fill="var(--text-secondary)" textAnchor="middle">
                  Yr {p.year}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Card */}
        {hoverIdx !== null && (
          <div
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: '#1A1A1A',
              color: '#FFFFFF',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
              fontFamily: 'Montserrat, sans-serif'
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--gold-primary)', marginBottom: '4px' }}>Year {points[hoverIdx].year} Milestone</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '2px' }}>
              <span>Invested:</span> <strong>{formatCurrency(points[hoverIdx].totalInvested)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '2px' }}>
              <span>Interest Gain:</span> <strong style={{ color: '#10B981' }}>{formatCurrency(points[hoverIdx].gains)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '4px', marginTop: '4px', fontWeight: 700 }}>
              <span>Total Wealth:</span> <strong style={{ color: 'var(--gold-secondary)' }}>{formatCurrency(points[hoverIdx].totalFuture)}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
   4. ALLOCATION OPTIMIZATION GUIDE
   ============================================================================ */

function AllocationOptimizationGuide({
  totalIncome,
  needsAmount,
  wantsAmount,
  emiAmount,
  investmentAmount
}: {
  totalIncome: number;
  needsAmount: number;
  wantsAmount: number;
  emiAmount: number;
  investmentAmount: number;
}) {
  if (totalIncome <= 0) return null;

  const actualNeedsPct = Math.round((needsAmount / totalIncome) * 100);
  const actualWantsPct = Math.round((wantsAmount / totalIncome) * 100);
  const actualEMIPct = Math.round((emiAmount / totalIncome) * 100);
  const actualInvPct = Math.round((investmentAmount / totalIncome) * 100);
  const totalAllocated = needsAmount + wantsAmount + emiAmount + investmentAmount;
  const surplusAmount = Math.max(0, totalIncome - totalAllocated);
  const actualSurplusPct = Math.round((surplusAmount / totalIncome) * 100);
  const totalSavingsRatePct = Math.round(((investmentAmount + surplusAmount) / totalIncome) * 100);

  // 4 Left items (Cashflow & Spending Metrics)
  const leftAllocations = [
    { 
      category: '1. Essential Needs', 
      actual: `${actualNeedsPct}%`, 
      target: '≤ 50%', 
      status: actualNeedsPct <= 50 ? 'Optimal' : 'High', 
      color: actualNeedsPct <= 50 ? '#137A57' : '#D44A1C',
      advice: actualNeedsPct > 50 ? 'Audit housing, food & fuel expenses to bring needs under 50%.' : 'Needs expenses are properly controlled.' 
    },
    { 
      category: '2. Lifestyle Wants', 
      actual: `${actualWantsPct}%`, 
      target: '≤ 30%', 
      status: actualWantsPct <= 30 ? 'Optimal' : 'High', 
      color: actualWantsPct <= 30 ? '#137A57' : '#6B3FA0',
      advice: actualWantsPct > 30 ? 'Trim shopping and monthly subscriptions to reclaim cash flow.' : 'Wants spending is well disciplined.' 
    },
    { 
      category: '3. Loan EMIs Burden', 
      actual: `${actualEMIPct}%`, 
      target: '≤ 35%', 
      status: actualEMIPct <= 35 ? 'Optimal' : 'High', 
      color: actualEMIPct <= 35 ? '#137A57' : '#B31B1B',
      advice: actualEMIPct > 35 ? 'Prioritize paying off consumer debt to eliminate interest burden.' : 'EMI commitments are within safe bounds.' 
    },
    { 
      category: '4. Unallocated Cash Buffer', 
      actual: `${actualSurplusPct}%`, 
      target: '10 - 20%', 
      status: actualSurplusPct >= 10 ? 'Optimal' : 'Low', 
      color: actualSurplusPct >= 10 ? '#137A57' : '#8E703F',
      advice: actualSurplusPct < 10 ? 'Maintain unallocated cash reserve to avoid tight liquidity.' : 'Healthy liquidity buffer maintained.' 
    },
  ];

  // 4 Right items (Wealth & Growth Benchmarks)
  const rightAllocations = [
    { 
      category: '5. Investments & SIP Rate', 
      actual: `${actualInvPct}%`, 
      target: '≥ 20%', 
      status: actualInvPct >= 20 ? 'Optimal' : 'Low', 
      color: actualInvPct >= 20 ? '#137A57' : '#D44A1C',
      advice: actualInvPct < 20 ? 'Increase monthly equity/mutual fund SIPs to compound wealth.' : 'Investment allocation is strong.' 
    },
    { 
      category: '6. Net Wealth Savings Rate', 
      actual: `${totalSavingsRatePct}%`, 
      target: '≥ 25%', 
      status: totalSavingsRatePct >= 25 ? 'Optimal' : 'Moderate', 
      color: totalSavingsRatePct >= 25 ? '#137A57' : '#D4A21C',
      advice: totalSavingsRatePct < 25 ? 'Aim to save at least 25% of total income for long-term goals.' : 'Excellent net savings rate.' 
    },
    { 
      category: '7. Fixed Expense Ratio', 
      actual: `${actualNeedsPct + actualEMIPct}%`, 
      target: '≤ 65%', 
      status: (actualNeedsPct + actualEMIPct) <= 65 ? 'Optimal' : 'High', 
      color: (actualNeedsPct + actualEMIPct) <= 65 ? '#137A57' : '#D44A1C',
      advice: (actualNeedsPct + actualEMIPct) > 65 ? 'High mandatory commitments reduce financial flexibility.' : 'Mandatory commitments are balanced.' 
    },
    { 
      category: '8. Discretionary vs Growth Ratio', 
      actual: `${actualWantsPct}:${actualInvPct}`, 
      target: '1 : 1+', 
      status: actualInvPct >= actualWantsPct ? 'Optimal' : 'Attention', 
      color: actualInvPct >= actualWantsPct ? '#137A57' : '#E65100',
      advice: actualInvPct < actualWantsPct ? 'Reallocate lifestyle spending into monthly investment SIPs.' : 'Investing more than spending on wants.' 
    },
  ];

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '28px', marginBottom: '32px', width: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '14px', borderBottom: '1px solid var(--border-light)' }}>
        <div>
          <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sliders size={20} style={{ color: 'var(--gold-dark)' }} />
            Allocation Optimization Framework
          </h4>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px', display: 'block' }}>
            Comprehensive 8-Metric Financial Health Allocation Benchmarks (50/30/20 Rule)
          </span>
        </div>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--gold-dark)', background: 'var(--gold-light)', border: '1px solid var(--border-gold)', borderRadius: '20px', padding: '4px 12px' }}>
          8 Core Indicators
        </span>
      </div>

      {/* Side-by-Side 2-Column Grid: Left Column (4 items) + Right Column (4 items) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
        
        {/* LEFT COLUMN: 4 VALUES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h5 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold-dark)', margin: '0 0 4px 0', borderBottom: '1.5px solid var(--border-light)', paddingBottom: '6px' }}>
            Cashflow & Spending Metrics
          </h5>
          {leftAllocations.map((a, i) => (
            <div 
              key={i} 
              style={{ 
                background: 'var(--bg-secondary)', 
                border: '1px solid var(--border-light)', 
                borderRadius: '12px', 
                padding: '20px 22px',
                minHeight: '105px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{a.category}</span>
                <span style={{ fontSize: '11px', fontWeight: 700, background: `${a.color}15`, color: a.color, border: `1px solid ${a.color}40`, borderRadius: '16px', padding: '3px 10px' }}>
                  {a.status}
                </span>
              </div>
              <div style={{ fontSize: '20px', fontFamily: "'Playfair Display', serif", fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                {a.actual} <span style={{ fontSize: '12px', fontFamily: "'Montserrat', sans-serif", fontWeight: 500, color: 'var(--text-muted)' }}>(Target: {a.target})</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                {a.advice}
              </p>
            </div>
          ))}
        </div>

        {/* RIGHT COLUMN: 4 VALUES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h5 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold-dark)', margin: '0 0 4px 0', borderBottom: '1.5px solid var(--border-light)', paddingBottom: '6px' }}>
            Wealth & Growth Benchmarks
          </h5>
          {rightAllocations.map((a, i) => (
            <div 
              key={i} 
              style={{ 
                background: 'var(--bg-secondary)', 
                border: '1px solid var(--border-light)', 
                borderRadius: '12px', 
                padding: '20px 22px',
                minHeight: '105px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{a.category}</span>
                <span style={{ fontSize: '11px', fontWeight: 700, background: `${a.color}15`, color: a.color, border: `1px solid ${a.color}40`, borderRadius: '16px', padding: '3px 10px' }}>
                  {a.status}
                </span>
              </div>
              <div style={{ fontSize: '20px', fontFamily: "'Playfair Display', serif", fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                {a.actual} <span style={{ fontSize: '12px', fontFamily: "'Montserrat', sans-serif", fontWeight: 500, color: 'var(--text-muted)' }}>(Target: {a.target})</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                {a.advice}
              </p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}



/* ============================================================================
   3. EXCEL-STYLE FINANCIAL SUMMARY STATEMENT
   ============================================================================ */

function FinancialSummaryExcelTable({
  totalIncome,
  totalNeeds,
  totalWants,
  emiAmount,
  monthlyInvestment,
  currentSavings,
  emergencyMonths: _emergencyMonths
}: {
  totalIncome: number;
  totalNeeds: number;
  totalWants: number;
  emiAmount: number;
  monthlyInvestment: number;
  currentSavings: number;
  emergencyMonths: string;
}) {
  const totalExpenses = totalNeeds + totalWants + emiAmount;
  const netSurplus = totalIncome - totalExpenses - monthlyInvestment;
  const savingsRatePct = totalIncome > 0 ? Math.round(((monthlyInvestment + Math.max(0, netSurplus)) / totalIncome) * 100) : 0;
  const needsPct = totalIncome > 0 ? Math.round((totalNeeds / totalIncome) * 100) : 0;

  const rows = [
    { item: 'Gross Monthly Income', monthly: totalIncome, annual: totalIncome * 12, pct: '100%', target: 'Base', status: 'OK', color: '#137A57' },
    { item: 'Essential Needs (Housing, Food, Fuel)', monthly: totalNeeds, annual: totalNeeds * 12, pct: `${needsPct}%`, target: '≤ 50%', status: needsPct <= 50 ? 'Optimal' : 'High', color: needsPct <= 50 ? '#137A57' : '#D44A1C' },
    { item: 'Discretionary Wants (Shopping, Entertainment)', monthly: totalWants, annual: totalWants * 12, pct: totalIncome > 0 ? `${Math.round((totalWants / totalIncome) * 100)}%` : '0%', target: '≤ 30%', status: 'Normal', color: '#6B3FA0' },
    { item: 'Total Loan & EMI Commitments', monthly: emiAmount, annual: emiAmount * 12, pct: totalIncome > 0 ? `${Math.round((emiAmount / totalIncome) * 100)}%` : '0%', target: '≤ 35%', status: emiAmount === 0 ? 'Excellent' : 'Controlled', color: '#B31B1B' },
    { item: 'Monthly Investment SIP', monthly: monthlyInvestment, annual: monthlyInvestment * 12, pct: totalIncome > 0 ? `${Math.round((monthlyInvestment / totalIncome) * 100)}%` : '0%', target: '≥ 20%', status: savingsRatePct >= 20 ? 'Strong' : 'Low', color: '#137A57' },
    { item: 'Net Monthly Cashflow / Surplus', monthly: netSurplus, annual: netSurplus * 12, pct: totalIncome > 0 ? `${Math.round((netSurplus / totalIncome) * 100)}%` : '0%', target: '> 0', status: netSurplus >= 0 ? 'Positive' : 'Deficit', color: netSurplus >= 0 ? '#137A57' : '#C62828' },
  ];

  return (
    <div className="ff-excel-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h4 className="ff-breakdown-title" style={{ margin: 0, border: 'none', padding: 0 }}>
          Financial Cashflow Statement (Spreadsheet View)
        </h4>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--gold-dark)', background: 'var(--gold-light)', padding: '4px 10px', borderRadius: '12px' }}>
          Total Portfolio: {formatCurrency(currentSavings)}
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="ff-excel-table">
          <thead>
            <tr>
              <th>Financial Item</th>
              <th>Monthly Amount</th>
              <th>Annualized</th>
              <th>% of Income</th>
              <th>Target Benchmark</th>
              <th>Health Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.item}</td>
                <td style={{ fontWeight: 700 }}>{formatCurrency(r.monthly)}</td>
                <td>{formatCurrency(r.annual)}</td>
                <td>{r.pct}</td>
                <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{r.target}</td>
                <td>
                  <span className="ff-badge-status" style={{ background: `${r.color}20`, color: r.color, border: `1px solid ${r.color}` }}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================================
   SCORE GAUGE COMPONENT
   ============================================================================ */

function ScoreGauge({ score, maxScore }: { score: number; maxScore: number }) {
  const safeScore = isNaN(score) ? 0 : Math.max(0, score);
  const safeMax = isNaN(maxScore) || maxScore <= 0 ? 100 : maxScore;
  const [animatedScore, setAnimatedScore] = useState(0);
  const pct = (safeScore / safeMax) * 100;
  
  useEffect(() => {
    let frame: number;
    const duration = 1500;
    const start = performance.now();
    
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * safeScore));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [safeScore]);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const fillRatio = safeMax > 0 ? (animatedScore / safeMax) : 0;
  const safeRatio = isNaN(fillRatio) ? 0 : Math.min(1, Math.max(0, fillRatio));
  const dashOffset = circumference - (circumference * safeRatio);

  let gaugeColor = '#C62828';
  if (pct > 85) gaugeColor = '#BCA374';
  else if (pct > 70) gaugeColor = '#137A57';
  else if (pct > 50) gaugeColor = '#D4A21C';
  else if (pct > 30) gaugeColor = '#D44A1C';

  let bandLabel = 'Poor';
  if (pct > 85) bandLabel = 'Excellent';
  else if (pct > 70) bandLabel = 'Good';
  else if (pct > 50) bandLabel = 'Fair';
  else if (pct > 30) bandLabel = 'Needs Work';

  return (
    <div className="ff-score-gauge-wrap">
      <div className="ff-score-circle-container">
        <svg width="200" height="200" viewBox="0 0 200 200" className="ff-score-svg">
          <circle
            cx="100" cy="100" r={radius}
            fill="none"
            stroke="var(--border-light)"
            strokeWidth="10"
          />
          <circle
            cx="100" cy="100" r={radius}
            fill="none"
            stroke={gaugeColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 100 100)"
            style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.25,0.8,0.25,1), stroke 0.5s ease' }}
          />
        </svg>
        <div className="ff-score-gauge-center">
          <span className="ff-score-number">{animatedScore}</span>
          <span className="ff-score-max">/ {maxScore}</span>
        </div>
      </div>
      <div className="ff-score-band" style={{ color: gaugeColor }}>{bandLabel}</div>
    </div>
  );
}

/* ============================================================================
   COLLAPSIBLE SECTION COMPONENT (Click-only toggle)
   ============================================================================ */

function AccordionSection({ 
  title, 
  icon, 
  isOpen, 
  onToggle, 
  children,
  accentColor 
}: { 
  title: string; 
  icon: React.ReactNode;
  isOpen: boolean; 
  onToggle: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  accentColor: string;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [isOpen, children]);

  return (
    <div className={`ff-accordion ${isOpen ? 'open' : ''}`}>
      <button 
        type="button" 
        className="ff-accordion-header" 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle(e);
        }}
      >
        <div className="ff-accordion-left">
          <div className="ff-accordion-icon" style={{ background: accentColor }}>
            {icon}
          </div>
          <div>
            <h4 className="ff-accordion-title">{title}</h4>
          </div>
        </div>
        <div className="ff-accordion-chevron">
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>
      <div 
        className="ff-accordion-body"
        style={{ 
          maxHeight: isOpen ? `${contentHeight}px` : '0px',
          opacity: isOpen ? 1 : 0
        }}
      >
        <div ref={contentRef} className="ff-accordion-inner">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   MINI INPUT COMPONENTS
   ============================================================================ */

function NumberInput({ 
  label, value, onChange, prefix = '', suffix = '', min = 0, max = 99999999, step = 1000 
}: { 
  label: string; value: number; onChange: (v: number) => void; 
  prefix?: string; suffix?: string; min?: number; max?: number; step?: number;
}) {
  const [localVal, setLocalVal] = useState(value.toString());
  useEffect(() => { setLocalVal(value.toString()); }, [value]);

  return (
    <div className="ff-field">
      <label className="ff-field-label">{label}</label>
      <div className="ff-input-wrap">
        {prefix && <span className="ff-input-prefix">{prefix}</span>}
        <input
          type="number"
          className="ff-input"
          value={localVal}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            setLocalVal(e.target.value);
            const n = Number(e.target.value);
            if (!isNaN(n)) onChange(Math.max(min, Math.min(max, n)));
          }}
          onBlur={() => {
            let n = Number(localVal);
            if (isNaN(n)) n = min;
            n = Math.max(min, Math.min(max, n));
            onChange(n);
            setLocalVal(n.toString());
          }}
        />
        {suffix && <span className="ff-input-suffix">{suffix}</span>}
      </div>
    </div>
  );
}

function SelectInput<T extends string>({ 
  label, value, onChange, options 
}: { 
  label: string; value: T; onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="ff-field">
      <label className="ff-field-label">{label}</label>
      <select 
        className="ff-select" 
        value={value} 
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function SliderInput({ 
  label, value, onChange, min = 0, max = 5, labels 
}: { 
  label: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; labels?: string[];
}) {
  return (
    <div className="ff-field">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label className="ff-field-label">{label}</label>
        <span className="ff-slider-badge">{value} / 5</span>
      </div>
      <div className="ff-slider-wrap">
        <input
          type="range"
          className="form-range-input"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <div className="ff-slider-labels">
          {labels ? labels.map((l, i) => (
            <span key={i} className={value === i ? 'active' : ''}>{l}</span>
          )) : Array.from({ length: max - min + 1 }, (_, i) => (
            <span key={i} className={value === i + min ? 'active' : ''}>{i + min}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   MAIN COMPONENT
   ============================================================================ */

export default function FinancialFitness() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    personal: true,
    income: true,
    expense: true,
    dependants: true,
    safety: true,
    investment: true,
    emi: true,
    mindset: true,
  });

  const [activeTab, setActiveTab] = useState<'know' | 'score' | 'improve'>('know');

  // --- Data States ---
  const [personal, setPersonal] = useState<PersonalDetails>({
    age: 28,
    status: 'single',
    dependants: 0
  });

  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([
    { id: '1', value: 50000, yearlyGrowth: 8, safety: 'permanent', type: 'regular' }
  ]);

  const [needs, setNeeds] = useState<NeedsExpenses>({
    housing: 'rental',
    housingAmount: 15000,
    fuel: 3000,
    healthFoodGroceries: 10000,
    workerPay: 0,
    miscellaneous: 0
  });

  const [wants, setWants] = useState<WantsExpenses>({
    entertainment: 3000,
    subscriptions: 1500,
    shopping: 2000,
    miscellaneous: 0
  });

  const [dependantsList, setDependantsList] = useState<DependantItem[]>([]);

  const [safety, setSafety] = useState<SafetyData>({
    termInsurance: 'basic',
    healthInsurance: 'basic',
    emergencyFund: 'moderate'
  });

  const [investment, setInvestment] = useState<InvestmentData>({
    monthlyAllocated: 5000,
    portfolioDiversified: 'partial',
    currentValue: 100000
  });

  const [emi, setEmi] = useState<EMIData>({
    assetEMI: 0,
    liabilityEMI: 0
  });

  const [mindset, setMindset] = useState<MindsetData>({
    satisfaction: 3,
    discipline: 3,
    futurePlanning: 3,
    riskTolerance: 3,
    financialLiteracy: 3
  });

  // Keep dependants count in sync with list length
  const updateDependantsCount = (newCount: number) => {
    const clamped = Math.max(0, Math.min(10, newCount));
    setPersonal(p => ({ ...p, dependants: clamped }));

    if (clamped > dependantsList.length) {
      const toAdd = clamped - dependantsList.length;
      const added: DependantItem[] = Array.from({ length: toAdd }, (_, i) => ({
        id: (Date.now() + i).toString(),
        name: `Dependant ${dependantsList.length + i + 1}`,
        relation: 'child',
        age: 8,
        monthlyIncome: 0,
        safety: 'normal',
        monthlyExpense: 3000
      }));
      setDependantsList(prev => [...prev, ...added]);
    } else if (clamped < dependantsList.length) {
      setDependantsList(prev => prev.slice(0, clamped));
    }
  };

  const addDependantItem = () => {
    const newCount = dependantsList.length + 1;
    updateDependantsCount(newCount);
  };

  const removeDependantItem = (id: string) => {
    const nextList = dependantsList.filter(d => d.id !== id);
    setDependantsList(nextList);
    setPersonal(p => ({ ...p, dependants: nextList.length }));
  };

  const updateDependantField = (id: string, field: keyof DependantItem, val: any) => {
    setDependantsList(prev => prev.map(d => d.id === id ? { ...d, [field]: val } : d));
  };

  // --- Derived calculations ---
  const totalIncome = incomeSources.reduce((s, src) => s + src.value, 0);
  const totalNeeds = needs.housingAmount + needs.fuel + needs.healthFoodGroceries + needs.workerPay + needs.miscellaneous;
  const totalWants = wants.entertainment + wants.subscriptions + wants.shopping + wants.miscellaneous;
  const totalExpenses = totalNeeds + totalWants;

  // --- Scoring ---
  const personalScore = calculatePersonalScore(personal);
  const incomeScore = calculateIncomeScore(incomeSources, totalExpenses);
  const expenseScore = calculateExpenseScore(needs, wants, totalIncome);
  const dependantsScore = calculateDependantsScore(dependantsList);
  const safetyScore = calculateSafetyScore(safety);
  const investmentScore = calculateInvestmentScore(investment, totalIncome, totalExpenses);
  const emiScore = calculateEMIScore(emi, totalIncome);
  const mindsetScore = calculateMindsetScore(mindset);

  const categoryScores: CategoryScore[] = [
    { name: 'Personal Details', score: personalScore, max: 5, icon: <User size={18} />, color: '#6B3FA0' },
    { name: 'Monthly Income', score: incomeScore, max: 20, icon: <Wallet size={18} />, color: '#137A57' },
    { name: 'Monthly Expense', score: expenseScore, max: 20, icon: <ShoppingCart size={18} />, color: '#D44A1C' },
    ...(personal.dependants > 0 || dependantsList.length > 0 ? [
      { name: 'Dependants', score: dependantsScore, max: 5, icon: <HeartHandshake size={18} />, color: '#D44A1C' }
    ] : []),
    { name: 'Safety', score: safetyScore, max: 20, icon: <ShieldCheck size={18} />, color: '#1E3C72' },
    { name: 'Investment', score: investmentScore, max: 15, icon: <TrendingUp size={18} />, color: '#0F5E43' },
    { name: 'Installments/EMI', score: emiScore, max: 10, icon: <CreditCard size={18} />, color: '#B31B1B' },
    { name: 'Mindset', score: mindsetScore, max: 5, icon: <Brain size={18} />, color: '#8E703F' },
  ];

  const totalScore = categoryScores.reduce((s, c) => s + c.score, 0);
  const recommendations = generateRecommendations(categoryScores);

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const addIncomeSource = () => {
    setIncomeSources(prev => [...prev, {
      id: Date.now().toString(),
      value: 0,
      yearlyGrowth: 5,
      safety: 'normal',
      type: 'regular'
    }]);
  };

  const removeIncomeSource = (id: string) => {
    if (incomeSources.length <= 1) return;
    setIncomeSources(prev => prev.filter(s => s.id !== id));
  };

  const updateIncomeSource = (id: string, field: keyof IncomeSource, val: any) => {
    setIncomeSources(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s));
  };

  const resetAll = () => {
    setPersonal({ age: 28, status: 'single', dependants: 0 });
    setDependantsList([]);
    setIncomeSources([{ id: '1', value: 50000, yearlyGrowth: 8, safety: 'permanent', type: 'regular' }]);
    setNeeds({ housing: 'rental', housingAmount: 15000, fuel: 3000, healthFoodGroceries: 8000, workerPay: 0, miscellaneous: 2000 });
    setWants({ entertainment: 2000, subscriptions: 500, shopping: 3000, miscellaneous: 1000 });
    setSafety({ termInsurance: 'none', healthInsurance: 'none', emergencyFund: 'none' });
    setInvestment({ monthlyAllocated: 5000, portfolioDiversified: 'none', currentValue: 100000 });
    setEmi({ assetEMI: 0, liabilityEMI: 0 });
    setMindset({ satisfaction: 3, discipline: 3, futurePlanning: 3, riskTolerance: 3, financialLiteracy: 3 });
    setActiveTab('know');
  };

  const canProceedToScore = () => {
    if (personal.age < 18) return false;
    const hasIncome = incomeSources.some(src => src.value > 0);
    if (!hasIncome) return false;
    if (needs.housingAmount <= 0 && needs.healthFoodGroceries <= 0) return false;
    return true;
  };

  const getStepProgress = () => {
    return (
      <div className="ff-segmented-bar">
        {/* Step 1: Know Me */}
        <button 
          className={`ff-segment ${activeTab === 'know' ? 'active' : ''} ${activeTab === 'score' || activeTab === 'improve' ? 'completed' : ''}`} 
          onClick={() => setActiveTab('know')}
        >
          <User size={16} /> KNOW ME
        </button>

        {/* Step 2: Your Score */}
        <button 
          className={`ff-segment ${activeTab === 'score' ? 'active' : ''} ${activeTab === 'improve' ? 'completed' : ''}`} 
          onClick={() => {
            if (canProceedToScore()) {
              setActiveTab('score');
            } else {
              alert('Please fill in your Age, at least one Monthly Income, and basic Needs Expenses to proceed.');
            }
          }}
          disabled={!canProceedToScore() && activeTab === 'know'}
        >
          <Award size={16} /> YOUR SCORE
        </button>

        {/* Step 3: Improvements */}
        <button 
          className={`ff-segment ${activeTab === 'improve' ? 'active' : ''}`} 
          onClick={() => {
            if (canProceedToScore()) {
              setActiveTab('improve');
            } else {
              alert('Please fill in your Age, at least one Monthly Income, and basic Needs Expenses to proceed.');
            }
          }}
          disabled={!canProceedToScore() && activeTab === 'know'}
        >
          <Target size={16} /> IMPROVEMENTS
        </button>
      </div>
    );
  };

  const sectionColors = ['#6B3FA0', '#137A57', '#D44A1C', '#E65100', '#1E3C72', '#0F5E43', '#B31B1B', '#8E703F'];

  return (
    <div className="ff-container">
      {/* Header */}
      <div className="calculator-header">
        <h3 className="royal-title">Financial Fitness</h3>
        <p>Comprehensive assessment of your financial health across key life dimensions.</p>
      </div>

      {/* Step Progress Navigation */}
      {getStepProgress()}

      {/* === TAB 1: KNOW ME === */}
      {activeTab === 'know' && (
        <div className="ff-know-me">
          {/* 1. Personal Details */}
          <AccordionSection
            title="1. Personal Details"
            icon={<User size={18} />}
            isOpen={openSections.personal}
            onToggle={() => toggleSection('personal')}
            accentColor={sectionColors[0]}
          >
            <div className="ff-fields-row">
              <NumberInput 
                label="Age" 
                value={personal.age} 
                onChange={(v) => setPersonal(p => ({ ...p, age: v }))}
                min={18} max={100} step={1}
                suffix="yrs"
              />
              <SelectInput
                label="Status"
                value={personal.status}
                onChange={(v) => setPersonal(p => ({ ...p, status: v }))}
                options={[
                  { value: 'single', label: 'Single' },
                  { value: 'married', label: 'Married' }
                ]}
              />
              <NumberInput
                label="Dependants"
                value={personal.dependants}
                onChange={(v) => updateDependantsCount(v)}
                min={0} max={10} step={1}
              />
            </div>
          </AccordionSection>

          {/* 2. Monthly Income */}
          <AccordionSection
            title="2. Monthly Income"
            icon={<Wallet size={18} />}
            isOpen={openSections.income}
            onToggle={() => toggleSection('income')}
            accentColor={sectionColors[1]}
          >
            {incomeSources.map((src, idx) => (
              <div key={src.id} className="ff-income-card">
                <div className="ff-income-card-header">
                  <span className="ff-income-card-label">Source {idx + 1}</span>
                  {incomeSources.length > 1 && (
                    <button className="ff-remove-btn" onClick={() => removeIncomeSource(src.id)}>
                      <Trash2 size={14} /> Remove
                    </button>
                  )}
                </div>
                <div className="ff-fields-row">
                  <NumberInput
                    label="Monthly Amount"
                    value={src.value}
                    onChange={(v) => updateIncomeSource(src.id, 'value', v)}
                    prefix="₹"
                  />
                  <NumberInput
                    label="Yearly Growth"
                    value={src.yearlyGrowth}
                    onChange={(v) => updateIncomeSource(src.id, 'yearlyGrowth', v)}
                    suffix="%"
                    min={0} max={100} step={1}
                  />
                  <SelectInput
                    label="Stability"
                    value={src.safety}
                    onChange={(v) => updateIncomeSource(src.id, 'safety', v)}
                    options={[
                      { value: 'seasonal', label: 'Seasonal / Unstable' },
                      { value: 'normal', label: 'Normal / Regular' },
                      { value: 'permanent', label: 'Stable / Fixed' }
                    ]}
                  />
                  <SelectInput
                    label="Type"
                    value={src.type}
                    onChange={(v) => updateIncomeSource(src.id, 'type', v)}
                    options={[
                      { value: 'regular', label: 'Job / Salary' },
                      { value: 'business', label: 'Business' },
                      { value: 'self_employment', label: 'Self-Employed' },
                      { value: 'freelance', label: 'Freelance / Side Work' },
                      { value: 'passive', label: 'Other / Passive' }
                    ]}
                  />
                </div>
              </div>
            ))}
            <button className="ff-add-btn" onClick={addIncomeSource}>
              <Plus size={16} /> Add Income Source
            </button>
            <div className="ff-summary-bar">
              <span>Total Monthly Income</span>
              <strong>{formatCurrency(totalIncome)}</strong>
            </div>
          </AccordionSection>

          {/* 3. Monthly Expense */}
          <AccordionSection
            title="3. Monthly Expense"
            icon={<ShoppingCart size={18} />}
            isOpen={openSections.expense}
            onToggle={() => toggleSection('expense')}
            accentColor={sectionColors[2]}
          >
            {/* Needs */}
            <div className="ff-subsection">
              <h5 className="ff-subsection-title">
                <span className="ff-subsection-dot" style={{ background: '#D44A1C' }}></span>
                Needs
              </h5>
              <div className="ff-fields-row">
                <SelectInput
                  label="House"
                  value={needs.housing}
                  onChange={(v) => setNeeds(n => ({ ...n, housing: v }))}
                  options={[
                    { value: 'rental', label: 'Rent' },
                    { value: 'loan', label: 'Home Loan' },
                    { value: 'own', label: 'Own House' }
                  ]}
                />
                <NumberInput
                  label={needs.housing === 'own' ? 'Maintenance' : needs.housing === 'loan' ? 'Home Loan EMI' : 'Rent'}
                  value={needs.housingAmount}
                  onChange={(v) => setNeeds(n => ({ ...n, housingAmount: v }))}
                  prefix="₹"
                />
              </div>
              <div className="ff-fields-row">
                <NumberInput label="Fuel & Travel" value={needs.fuel} onChange={(v) => setNeeds(n => ({ ...n, fuel: v }))} prefix="₹" />
                <NumberInput label="Food & Health" value={needs.healthFoodGroceries} onChange={(v) => setNeeds(n => ({ ...n, healthFoodGroceries: v }))} prefix="₹" />
                <NumberInput label="Worker / Staff Pay" value={needs.workerPay} onChange={(v) => setNeeds(n => ({ ...n, workerPay: v }))} prefix="₹" />
                <NumberInput label="Other Needs" value={needs.miscellaneous} onChange={(v) => setNeeds(n => ({ ...n, miscellaneous: v }))} prefix="₹" />
              </div>
            </div>

            {/* Wants */}
            <div className="ff-subsection">
              <h5 className="ff-subsection-title">
                <span className="ff-subsection-dot" style={{ background: '#6B3FA0' }}></span>
                Wants
              </h5>
              <div className="ff-fields-row">
                <NumberInput label="Entertainment" value={wants.entertainment} onChange={(v) => setWants(w => ({ ...w, entertainment: v }))} prefix="₹" />
                <NumberInput label="Subscriptions" value={wants.subscriptions} onChange={(v) => setWants(w => ({ ...w, subscriptions: v }))} prefix="₹" />
                <NumberInput label="Shopping" value={wants.shopping} onChange={(v) => setWants(w => ({ ...w, shopping: v }))} prefix="₹" />
                <NumberInput label="Other Wants" value={wants.miscellaneous} onChange={(v) => setWants(w => ({ ...w, miscellaneous: v }))} prefix="₹" />
              </div>
            </div>

            <div className="ff-summary-bar">
              <div>
                <span>Total Needs: {formatCurrency(totalNeeds)}</span>
                <span className="ff-summary-sep">|</span>
                <span>Total Wants: {formatCurrency(totalWants)}</span>
              </div>
              <strong>Total: {formatCurrency(totalExpenses)}</strong>
            </div>
          </AccordionSection>

          {/* 3B. NEW SECTION: DEPENDANTS (Shown right after Monthly Expense if dependants > 0) */}
          {(personal.dependants > 0 || dependantsList.length > 0) && (
            <AccordionSection
              title="4. Dependants"
              icon={<HeartHandshake size={18} />}
              isOpen={openSections.dependants}
              onToggle={() => toggleSection('dependants')}
              accentColor={sectionColors[3]}
            >
              <p className="ff-section-hint">
                Add details for each dependant to evaluate their age, monthly income, stability, and financial support needs.
              </p>
              {dependantsList.map((dep, idx) => (
                <div key={dep.id} className="ff-income-card">
                  <div className="ff-income-card-header">
                    <span className="ff-income-card-label">Dependant {idx + 1}</span>
                    <button className="ff-remove-btn" onClick={() => removeDependantItem(dep.id)}>
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                  <div className="ff-fields-row">
                    <SelectInput
                      label="Relation"
                      value={dep.relation}
                      onChange={(v) => updateDependantField(dep.id, 'relation', v)}
                      options={[
                        { value: 'child', label: 'Child' },
                        { value: 'spouse', label: 'Spouse' },
                        { value: 'parent', label: 'Parent' },
                        { value: 'other', label: 'Other Family' }
                      ]}
                    />
                    <NumberInput
                      label="Age"
                      value={dep.age}
                      onChange={(v) => updateDependantField(dep.id, 'age', v)}
                      min={0} max={100} step={1}
                      suffix="yrs"
                    />
                    <NumberInput
                      label="Monthly Income"
                      value={dep.monthlyIncome}
                      onChange={(v) => updateDependantField(dep.id, 'monthlyIncome', v)}
                      prefix="₹"
                    />
                    <SelectInput
                      label="Income Stability"
                      value={dep.safety}
                      onChange={(v) => updateDependantField(dep.id, 'safety', v)}
                      options={[
                        { value: 'seasonal', label: 'Seasonal / Unstable' },
                        { value: 'normal', label: 'Normal / Regular' },
                        { value: 'permanent', label: 'Stable / Fixed' }
                      ]}
                    />
                    <NumberInput
                      label="Monthly Support Needed"
                      value={dep.monthlyExpense}
                      onChange={(v) => updateDependantField(dep.id, 'monthlyExpense', v)}
                      prefix="₹"
                    />
                  </div>
                </div>
              ))}
              <button className="ff-add-btn" onClick={addDependantItem}>
                <Plus size={16} /> Add Dependant
              </button>
            </AccordionSection>
          )}

          {/* 4. Safety */}
          <AccordionSection
            title={personal.dependants > 0 ? "5. Safety" : "4. Safety"}
            icon={<ShieldCheck size={18} />}
            isOpen={openSections.safety}
            onToggle={() => toggleSection('safety')}
            accentColor={sectionColors[4]}
          >
            <div className="ff-fields-row">
              <SelectInput
                label="Term Insurance"
                value={safety.termInsurance}
                onChange={(v) => setSafety(s => ({ ...s, termInsurance: v }))}
                options={[
                  { value: 'none', label: 'No Cover' },
                  { value: 'basic', label: 'Some Cover' },
                  { value: 'adequate', label: 'Good Cover (10x+ Income)' }
                ]}
              />
              <SelectInput
                label="Health Insurance"
                value={safety.healthInsurance}
                onChange={(v) => setSafety(s => ({ ...s, healthInsurance: v }))}
                options={[
                  { value: 'none', label: 'No Cover' },
                  { value: 'basic', label: 'Basic Cover' },
                  { value: 'adequate', label: 'Good Cover (₹10L+)' }
                ]}
              />
              <SelectInput
                label="Emergency Fund"
                value={safety.emergencyFund}
                onChange={(v) => setSafety(s => ({ ...s, emergencyFund: v }))}
                options={[
                  { value: 'none', label: '< 1 Month' },
                  { value: 'low', label: '1 to 3 Months' },
                  { value: 'moderate', label: '3 to 6 Months' },
                  { value: 'strong', label: '6+ Months' }
                ]}
              />
            </div>
          </AccordionSection>

          {/* 5. Investment */}
          <AccordionSection
            title={personal.dependants > 0 ? "6. Investment" : "5. Investment"}
            icon={<TrendingUp size={18} />}
            isOpen={openSections.investment}
            onToggle={() => toggleSection('investment')}
            accentColor={sectionColors[5]}
          >
            <div className="ff-fields-row">
              <NumberInput
                label="Monthly Saved / Invested"
                value={investment.monthlyAllocated}
                onChange={(v) => setInvestment(inv => ({ ...inv, monthlyAllocated: v }))}
                prefix="₹"
              />
              <SelectInput
                label="Investment Mix"
                value={investment.portfolioDiversified}
                onChange={(v) => setInvestment(inv => ({ ...inv, portfolioDiversified: v }))}
                options={[
                  { value: 'none', label: 'Only 1 Type (e.g. Savings only)' },
                  { value: 'partial', label: '2 Types (e.g. Stocks + FD)' },
                  { value: 'diversified', label: '3+ Types (Stocks, Gold, FD, etc.)' }
                ]}
              />
              <NumberInput
                label="Current Total Savings"
                value={investment.currentValue}
                onChange={(v) => setInvestment(inv => ({ ...inv, currentValue: v }))}
                prefix="₹"
                step={10000}
              />
            </div>
          </AccordionSection>

          {/* 6. Installments/EMI */}
          <AccordionSection
            title={personal.dependants > 0 ? "7. Installments / EMI" : "6. Installments / EMI"}
            icon={<CreditCard size={18} />}
            isOpen={openSections.emi}
            onToggle={() => toggleSection('emi')}
            accentColor={sectionColors[6]}
          >
            <p className="ff-section-hint">
              <strong>Good EMI (Assets):</strong> Loan payments that build value (e.g. Home Loan, Land, Business Tools).
              <br/>
              <strong>Bad EMI (Liabilities):</strong> Loan payments for items that lose value (e.g. Phone, TV, Gadgets, Credit Cards).
            </p>
            <div className="ff-fields-row">
              <NumberInput
                label="Good EMI (Home / Land / Business)"
                value={emi.assetEMI}
                onChange={(v) => setEmi(e => ({ ...e, assetEMI: v }))}
                prefix="₹"
              />
              <NumberInput
                label="Bad EMI (Phone / Gadgets / Cards)"
                value={emi.liabilityEMI}
                onChange={(v) => setEmi(e => ({ ...e, liabilityEMI: v }))}
                prefix="₹"
              />
            </div>
          </AccordionSection>

          {/* 7. Mindset (5 marks total, 1 mark for each slider) */}
          <AccordionSection
            title={personal.dependants > 0 ? "8. Mindset (5 Marks Total)" : "7. Mindset (5 Marks Total)"}
            icon={<Brain size={18} />}
            isOpen={openSections.mindset}
            onToggle={() => toggleSection('mindset')}
            accentColor={sectionColors[7]}
          >
            <div className="ff-sliders-grid">
              <SliderInput
                label="1. Money Satisfaction"
                value={mindset.satisfaction}
                onChange={(v) => setMindset(m => ({ ...m, satisfaction: v }))}
                labels={['Very Low', 'Low', 'Fair', 'Good', 'High', 'Very High']}
              />
              <SliderInput
                label="2. Saving Discipline"
                value={mindset.discipline}
                onChange={(v) => setMindset(m => ({ ...m, discipline: v }))}
                labels={['Very Low', 'Low', 'Fair', 'Good', 'High', 'Very High']}
              />
              <SliderInput
                label="3. Future Planning"
                value={mindset.futurePlanning}
                onChange={(v) => setMindset(m => ({ ...m, futurePlanning: v }))}
                labels={['Very Low', 'Low', 'Fair', 'Good', 'High', 'Very High']}
              />
              <SliderInput
                label="4. Risk Comfort"
                value={mindset.riskTolerance}
                onChange={(v) => setMindset(m => ({ ...m, riskTolerance: v }))}
                labels={['Very Low', 'Low', 'Fair', 'Good', 'High', 'Very High']}
              />
              <SliderInput
                label="5. Money Knowledge"
                value={mindset.financialLiteracy}
                onChange={(v) => setMindset(m => ({ ...m, financialLiteracy: v }))}
                labels={['Very Low', 'Low', 'Fair', 'Good', 'High', 'Very High']}
              />
            </div>
          </AccordionSection>

          {/* Bottom actions */}
          <div className="ff-bottom-actions">
            <button 
              className={`btn-gold ${!canProceedToScore() ? 'disabled' : ''}`} 
              onClick={() => {
                if (canProceedToScore()) {
                  setActiveTab('score');
                } else {
                  alert('Please fill in your Age, at least one Monthly Income, and basic Needs Expenses to proceed.');
                }
              }}
              style={!canProceedToScore() ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              Calculate Score →
            </button>
            <button className="btn-gold-outline" onClick={resetAll} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <RotateCcw size={16} /> Reset All
            </button>
          </div>
        </div>
      )}

      {/* ═══ TAB 2: YOUR SCORE ═══ */}
      {activeTab === 'score' && (
        <div className="ff-score-section">
          {/* Executive Score Gauge */}
          <ScoreGauge score={totalScore} maxScore={100} />

          {/* 1. Unified Side-by-Side: Big Solid Pie Chart (Left) + Itemized Expenditure Bar Chart (Right) */}
          <PieChartAndBarChartSection
            totalIncome={totalIncome}
            needs={needs}
            wants={wants}
            emi={emi}
            investmentAmount={investment.monthlyAllocated}
          />

          {/* 2. Compound Interest & Wealth Growth Line/Area Chart */}
          <CompoundInterestGrowthGraph
            currentPortfolio={investment.currentValue}
            monthlyInvestment={investment.monthlyAllocated}
          />
          <FinancialSummaryExcelTable
            totalIncome={totalIncome}
            totalNeeds={totalNeeds}
            totalWants={totalWants}
            emiAmount={emi.assetEMI + emi.liabilityEMI}
            monthlyInvestment={investment.monthlyAllocated}
            currentSavings={investment.currentValue}
            emergencyMonths={safety.emergencyFund}
          />

          <div className="ff-bottom-actions" style={{ marginTop: '40px' }}>
            <button className="btn-gold" onClick={() => setActiveTab('improve')}>
              View Recommendations →
            </button>
            <button className="btn-gold-outline" onClick={() => setActiveTab('know')}>
              ← Edit Details
            </button>
          </div>
        </div>
      )}

      {/* ═══ TAB 3: IMPROVEMENTS ═══ */}
      {activeTab === 'improve' && (
        <div className="ff-improve-section" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* 1. Allocation Optimization Framework */}
          <AllocationOptimizationGuide
            totalIncome={totalIncome}
            needsAmount={totalNeeds}
            wantsAmount={totalWants}
            emiAmount={emi.assetEMI + emi.liabilityEMI}
            investmentAmount={investment.monthlyAllocated}
          />

          {/* 2. Personalized Recommendations & Remedies */}
          <div style={{ background: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ marginBottom: '24px', paddingBottom: '14px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Target size={20} style={{ color: 'var(--gold-dark)' }} />
                  Personalized Recommendations & Remedies
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 0 0' }}>
                  Itemized category scores paired with actionable remedies to strengthen your financial health.
                </p>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--gold-dark)', background: 'var(--gold-light)', border: '1px solid var(--border-gold)', borderRadius: '20px', padding: '4px 12px' }}>
                Priority Action Plan
              </span>
            </div>

            {recommendations.length === 0 && (
              <div className="ff-empty-state" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <CheckCircle size={48} style={{ color: '#137A57', marginBottom: '16px' }} />
                <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Outstanding! Your financial fitness is exemplary across all categories.</p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {recommendations.map((rec, idx) => {
                const pct = rec.maxScore > 0 ? Math.round((rec.currentScore / rec.maxScore) * 100) : 100;
                let priorityLabel = '';
                let priorityColor = '';
                let PriorityIcon = CheckCircle;

                if (rec.priority === 'critical') {
                  priorityLabel = 'High Priority Remedy';
                  priorityColor = '#C62828';
                  PriorityIcon = AlertTriangle;
                } else if (rec.priority === 'important') {
                  priorityLabel = 'Action Recommended';
                  priorityColor = '#D44A1C';
                  PriorityIcon = AlertTriangle;
                } else if (rec.priority === 'moderate') {
                  priorityLabel = 'Moderate Tweak';
                  priorityColor = '#D4A21C';
                  PriorityIcon = Target;
                } else {
                  priorityLabel = 'Good Standing';
                  priorityColor = '#137A57';
                  PriorityIcon = CheckCircle;
                }

                return (
                  <div 
                    key={idx} 
                    style={{ 
                      background: 'var(--bg-secondary)', 
                      border: '1px solid var(--border-light)', 
                      borderRadius: '12px', 
                      padding: '22px 24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px'
                    }}
                  >
                    {/* Header Row: Item Name (Left) & Category Score (Right) */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                      
                      {/* Left: Item Name & Priority Badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, background: `${priorityColor}18`, color: priorityColor, border: `1px solid ${priorityColor}40`, borderRadius: '16px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <PriorityIcon size={13} /> {priorityLabel}
                        </span>
                        <h5 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                          {rec.category}
                        </h5>
                      </div>

                      {/* Right: The Score */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '120px', height: '8px', background: 'var(--border-light)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: priorityColor, borderRadius: '4px' }} />
                        </div>
                        <div style={{ fontSize: '18px', fontFamily: "'Playfair Display', serif", fontWeight: 700, color: priorityColor }}>
                          {rec.currentScore.toFixed(1)} <span style={{ fontSize: '12px', fontFamily: "'Montserrat', sans-serif", fontWeight: 500, color: 'var(--text-muted)' }}>/ {rec.maxScore}</span>
                        </div>
                      </div>
                    </div>

                    {/* Remedies Box */}
                    <div style={{ background: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '14px 18px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold-dark)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>💡 Key Remedies & Action Steps</span>
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6 }}>
                        {rec.advice.map((a, i) => (
                          <li key={i} style={{ marginBottom: i < rec.advice.length - 1 ? '6px' : 0 }}>
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          <div className="ff-bottom-actions">
            <button className="btn-gold-outline" onClick={() => setActiveTab('know')}>
              ← Edit Details
            </button>
            <button className="btn-gold-outline" onClick={() => setActiveTab('score')}>
              View Score
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
