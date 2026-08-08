import { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  Award, 
  ArrowLeft,
  ArrowDownCircle,
  Activity,
  Sliders,
  Coins,
  Percent,
  ShieldAlert,
  Flame,
  PieChart,
  Target,
  Sparkles,
  Brain,
  Clock,
  Shield
} from 'lucide-react';
import './App.css';
import Calculators from './components/Calculators';
import Strategies from './components/Strategies';
import Insights from './components/Insights';
import GoalProbabilityCalculator from './components/GoalProbabilityCalculator';
import AssetAllocation from './components/AssetAllocation';
import Learning from './components/Learning';

type ViewType = 'home' | 'calculators' | 'strategies-single' | 'calculator-single' | 'time-to-1-crore' | 'goal-probability' | 'asset-allocation' | 'learning';
type CalcIdType = 'sip' | 'swp' | 'dip' | 'inflation' | 'dip_sip' | 'fd_rd';

interface RouteState {
  view: ViewType;
  singleCalc: CalcIdType | null;
  selectedStrategy?: 'debt' | 'fire' | 'wellness';
}

const scrollCache: Record<string, number> = {};

const getRouteKey = (r: RouteState): string => {
  if (r.view === 'home') return 'home';
  if (r.view === 'time-to-1-crore') return 'time-to-1-crore';
  if (r.view === 'goal-probability') return 'goal-probability';
  if (r.view === 'asset-allocation') return 'asset-allocation';
  if (r.view === 'learning') return 'learning';
  if (r.view === 'strategies-single' && r.selectedStrategy) {
    return `strategy-${r.selectedStrategy}`;
  }
  if (r.view === 'calculator-single' && r.singleCalc) {
    return `calc-${r.singleCalc}`;
  }
  return 'home';
};

// Maps clean pathnames to component view states
const getRouteFromPath = (): RouteState => {
  const path = window.location.pathname;
  if (!path || path === '/' || path === '/index.html') return { view: 'home', singleCalc: null };

  if (path === '/calculators') return { view: 'home', singleCalc: null };
  if (path === '/strategies') return { view: 'home', singleCalc: null };
  if (path === '/time-to-1-crore' || path === '/insights') return { view: 'time-to-1-crore', singleCalc: null };
  if (path.startsWith('/goal-probability')) return { view: 'goal-probability', singleCalc: null };
  if (path.startsWith('/asset-allocation')) return { view: 'asset-allocation', singleCalc: null };
  if (path.startsWith('/learning')) return { view: 'learning', singleCalc: null };
  if (path === '/debt-repayment') return { view: 'strategies-single', singleCalc: null, selectedStrategy: 'debt' };
  if (path === '/fire-projections') return { view: 'strategies-single', singleCalc: null, selectedStrategy: 'fire' };
  if (path === '/financial-fitness') return { view: 'strategies-single', singleCalc: null, selectedStrategy: 'wellness' };
  
  if (path === '/sip') return { view: 'calculator-single', singleCalc: 'sip' };
  if (path === '/swp') return { view: 'calculator-single', singleCalc: 'swp' };
  if (path === '/dip') return { view: 'calculator-single', singleCalc: 'dip' };
  if (path === '/inflation') return { view: 'calculator-single', singleCalc: 'inflation' };
  if (path === '/dip-vs-sip') return { view: 'calculator-single', singleCalc: 'dip_sip' };
  if (path === '/fd-vs-rd') return { view: 'calculator-single', singleCalc: 'fd_rd' };

  return { view: 'home', singleCalc: null };
};

function App() {
  const [route, setRoute] = useState<RouteState>(getRouteFromPath());
  const currentRouteRef = useRef<RouteState>(route);

  useEffect(() => {
    currentRouteRef.current = route;
  }, [route]);

  const restoreScrollForRoute = (targetRoute: RouteState, isPopState: boolean) => {
    const key = getRouteKey(targetRoute);
    const savedY = scrollCache[key] ?? 0;
    setTimeout(() => {
      window.scrollTo(0, isPopState ? savedY : 0);
    }, 10);
  };

  // Listen to popstate event (e.g. Back/Forward browser buttons)
  useEffect(() => {
    const onPopState = () => {
      const newRoute = getRouteFromPath();
      setRoute(newRoute);
      restoreScrollForRoute(newRoute, true);
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Intercept navigation to update address bar using HTML5 pushState
  const navigateTo = (
    newView: ViewType, 
    calcId: CalcIdType | null = null, 
    strategyId: 'debt' | 'fire' | 'wellness' | null = null
  ) => {
    // Save current scroll of the page we are leaving
    const currentKey = getRouteKey(currentRouteRef.current);
    scrollCache[currentKey] = window.scrollY;

    let targetPath = '/';
    if (newView === 'home') {
      targetPath = '/';
    } else if (newView === 'time-to-1-crore') {
      targetPath = '/time-to-1-crore';
    } else if (newView === 'goal-probability') {
      targetPath = '/goal-probability';
    } else if (newView === 'asset-allocation') {
      targetPath = '/asset-allocation';
    } else if (newView === 'strategies-single' && strategyId) {
      if (strategyId === 'debt') {
        targetPath = '/debt-repayment';
      } else if (strategyId === 'fire') {
        targetPath = '/fire-projections';
      } else if (strategyId === 'wellness') {
        targetPath = '/financial-fitness';
      }
    } else if (newView === 'calculator-single' && calcId) {
      const pathMapping: Record<CalcIdType, string> = {
        sip: '/sip',
        swp: '/swp',
        dip: '/dip',
        inflation: '/inflation',
        dip_sip: '/dip-vs-sip',
        fd_rd: '/fd-vs-rd'
      };
      targetPath = pathMapping[calcId] || '/';
    }

    window.history.pushState(null, '', targetPath);
    const nextRoute: RouteState = { view: newView, singleCalc: calcId, selectedStrategy: strategyId || undefined };
    setRoute(nextRoute);
    restoreScrollForRoute(nextRoute, false);
  };

  const { view, singleCalc, selectedStrategy } = route;

  return (
    <>
      {/* 1. Header Navigation */}
      <nav className="navbar">
        <a href="/" onClick={(e) => { e.preventDefault(); navigateTo('home'); }} className="navbar-brand">
          <div className="brand-logo-icon">
            <img src="/Dosh.png" alt="Dosh Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} />
          </div>
          <div>
            <div className="brand-text brand-font" style={{ fontWeight: 700, fontSize: '18px' }}>
              DOSH
            </div>
            <div className="brand-subtitle">Financial Fitness</div>
          </div>
        </a>
        <ul className="nav-links">
          <li>
            <button 
              onClick={() => navigateTo('home')} 
              className={`nav-link-btn ${view === 'home' ? 'active' : ''}`}
            >
              Journey
            </button>
          </li>
          <li>
            <button 
              onClick={() => {
                if (view !== 'home') {
                  navigateTo('home');
                  setTimeout(() => {
                    document.getElementById('calculators-suite-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                } else {
                  document.getElementById('calculators-suite-section')?.scrollIntoView({ behavior: 'smooth' });
                }
              }} 
              className="nav-link-btn"
            >
              Calculators
            </button>
          </li>
          <li>
            <button 
              onClick={() => {
                if (view !== 'home') {
                  navigateTo('home');
                  setTimeout(() => {
                    document.getElementById('strategies-portfolio-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                } else {
                  document.getElementById('strategies-portfolio-section')?.scrollIntoView({ behavior: 'smooth' });
                }
              }} 
              className="nav-link-btn"
            >
              Strategies
            </button>
          </li>
          <li>
            <button 
              onClick={() => {
                if (view !== 'home') {
                  navigateTo('home');
                  setTimeout(() => {
                    document.getElementById('insights-intelligence-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                } else {
                  document.getElementById('insights-intelligence-section')?.scrollIntoView({ behavior: 'smooth' });
                }
              }} 
              className="nav-link-btn"
            >
              Insights
            </button>
          </li>
        </ul>
      </nav>

      {/* 2. Page Content rendering based on view tab */}
      {view === 'home' && (
        <>
          {/* Hero Section */}
          <header className="hero-section">
            <div className="hero-content">
              <h1 className="hero-title">
                Your Path to
                <span>Financial Fitness</span>
              </h1>
              <p className="hero-description">
                Financial fitness is not just about accumulating wealth — it's about building security, freedom, and lasting peace of mind. Use our tools and frameworks to take control of your financial future.
              </p>
              <div className="hero-actions">
                <button 
                  onClick={() => document.getElementById('calculators-suite-section')?.scrollIntoView({ behavior: 'smooth' })} 
                  className="btn-gold"
                >
                  Explore Calculators
                </button>
                <button 
                  onClick={() => document.getElementById('strategies-portfolio-section')?.scrollIntoView({ behavior: 'smooth' })} 
                  className="btn-gold-outline"
                >
                  Create Strategy
                </button>
              </div>
            </div>

            {/* Decorative Royal Card */}
            <div className="hero-visual">
              <div className="royal-crest-card">
                <div className="crest-icon-wrap">
                  <Award size={38} />
                </div>
                <span className="badge-gold">Health Check</span>
                <h3 style={{ marginTop: '16px' }}>Your Financial Health</h3>
                <p>
                  Assess your income, expenses, safety nets, investments, and mindset — all in one comprehensive fitness score.
                </p>
                <button 
                  onClick={() => navigateTo('strategies-single', null, 'wellness')} 
                  className="btn-gold" 
                  style={{ width: '100%', padding: '12px' }}
                >
                  Evaluate Financial Fitness
                </button>
              </div>
            </div>
          </header>

          {/* Core Pillars Section */}
          <section className="landing-wellness-intro">
            <h2 className="section-title">The Foundations of Financial Fitness</h2>
            <p className="section-subtitle">
              Mastering your money is more about psychology than math. These core principles form the psychological foundation of lifelong wealth.
            </p>

            <div className="pillars-grid">
              <div className="pillar-card">
                <div className="pillar-icon-box">
                  <Brain size={24} />
                </div>
                <h4>Behavior</h4>
                <p style={{ marginBottom: '12px', fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                  How you behave with money matters more than what you know about money.
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Your financial decisions are shaped by your personal experiences, emotions, ego, and the environment you grew up in. Understanding your own behavior is one of the biggest advantages you can develop as an investor.
                </p>
              </div>

              <div className="pillar-card">
                <div className="pillar-icon-box">
                  <Clock size={24} />
                </div>
                <h4>Compounding</h4>
                <p style={{ marginBottom: '12px', fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                  Great wealth is often the result of extraordinary patience, not extraordinary returns.
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Housel emphasizes how relatively small advantages can become enormous when given decades to compound. The key isn't just earning high returns—it's staying invested long enough for compounding to work.
                </p>
              </div>

              <div className="pillar-card">
                <div className="pillar-icon-box">
                  <Shield size={24} />
                </div>
                <h4>Room for Error</h4>
                <p style={{ marginBottom: '12px', fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                  You don't need every decision to be right. You need to survive the decisions that are wrong.
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Build enough savings, flexibility, and margin of safety to handle unexpected events. Financial plans should account for uncertainty because the future will almost never unfold exactly as expected.
                </p>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <button 
                onClick={() => navigateTo('learning')} 
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--gold-dark)',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                See more &gt;&gt;
              </button>
            </div>
          </section>

          {/* Interactive Calculators Suite (2x3 grid on 100% resolution) */}
          <section id="calculators-suite-section" className="landing-wellness-intro" style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-light)' }}>
            <h2 className="section-title">Calculators</h2>
            <p className="section-subtitle">
              Pick a calculator to explore — each opens in a clean, focused workspace.
            </p>

            <div className="calculators-grid-2x3">
              {/* Row 1 */}
              <div className="pillar-card" style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border-gold)' }}>
                <div className="pillar-icon-box" style={{ background: 'var(--gold-light)' }}>
                  <TrendingUp size={24} />
                </div>
                <h4>SIP Calculator</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  See how your monthly SIP investments grow over time with the power of compounding.
                </p>
                <button 
                  onClick={() => navigateTo('calculator-single', 'sip')} 
                  className="btn-royal-orange" 
                  style={{ padding: '10px 20px', fontSize: '12px' }}
                >
                  Calculate
                </button>
              </div>

              <div className="pillar-card" style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border-gold)' }}>
                <div className="pillar-icon-box" style={{ background: 'var(--gold-light)' }}>
                  <ArrowDownCircle size={24} />
                </div>
                <h4>SWP Calculator</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Plan systematic withdrawals from your investment corpus for retirement income.
                </p>
                <button 
                  onClick={() => navigateTo('calculator-single', 'swp')} 
                  className="btn-royal-orange" 
                  style={{ padding: '10px 20px', fontSize: '12px' }}
                >
                  Calculate
                </button>
              </div>

              <div className="pillar-card" style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border-gold)' }}>
                <div className="pillar-icon-box" style={{ background: 'var(--gold-light)' }}>
                  <Activity size={24} />
                </div>
                <h4>DIP Calculator</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Calculate how deferred income plans compound your contributions into a steady future payout.
                </p>
                <button 
                  onClick={() => navigateTo('calculator-single', 'dip')} 
                  className="btn-royal-orange" 
                  style={{ padding: '10px 20px', fontSize: '12px' }}
                >
                  Calculate
                </button>
              </div>

              {/* Row 2 */}
              <div className="pillar-card" style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border-gold)' }}>
                <div className="pillar-icon-box" style={{ background: 'var(--gold-light)' }}>
                  <Sliders size={24} />
                </div>
                <h4>Inflation Calculator</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  See how inflation eats into your savings and increases your cost of living over the years.
                </p>
                <button 
                  onClick={() => navigateTo('calculator-single', 'inflation')} 
                  className="btn-royal-orange" 
                  style={{ padding: '10px 20px', fontSize: '12px' }}
                >
                  Calculate
                </button>
              </div>

              <div className="pillar-card" style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border-gold)' }}>
                <div className="pillar-icon-box" style={{ background: 'var(--gold-light)' }}>
                  <Coins size={24} />
                </div>
                <h4>DIP vs DIY SIP</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Compare structured Deferred Income Plans against a DIY Mutual Fund SIP + SWP approach.
                </p>
                <button 
                  onClick={() => navigateTo('calculator-single', 'dip_sip')} 
                  className="btn-royal-red" 
                  style={{ padding: '10px 20px', fontSize: '12px' }}
                >
                  Compare
                </button>
              </div>

              <div className="pillar-card" style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border-gold)' }}>
                <div className="pillar-icon-box" style={{ background: 'var(--gold-light)' }}>
                  <Percent size={24} />
                </div>
                <h4>FD vs RD</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Compare returns from a Fixed Deposit (lump sum) vs a Recurring Deposit (monthly).
                </p>
                <button 
                  onClick={() => navigateTo('calculator-single', 'fd_rd')} 
                  className="btn-royal-red" 
                  style={{ padding: '10px 20px', fontSize: '12px' }}
                >
                  Compare
                </button>
              </div>
            </div>
          </section>

          {/* Strategies Portfolio Section */}
          <section id="strategies-portfolio-section" className="landing-wellness-intro" style={{ backgroundColor: 'var(--bg-primary)', borderTop: '1px solid var(--border-light)' }}>
            <h2 className="section-title">Financial Strategies</h2>
            <p className="section-subtitle">
              Plan your debt payoff, model early retirement, or get a complete financial health check.
            </p>

            <div className="calculators-grid-2x3">
              {/* Card 1: Debt Repayment */}
              <div className="pillar-card" style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border-gold)' }}>
                <div className="pillar-icon-box" style={{ background: 'var(--gold-light)' }}>
                  <ShieldAlert size={24} />
                </div>
                <h4>Debt Repayment</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Compare Snowball vs Avalanche strategies to pay off your debts faster.
                </p>
                <button 
                  onClick={() => navigateTo('strategies-single', null, 'debt')} 
                  className="btn-royal-violet" 
                  style={{ padding: '10px 20px', fontSize: '12px' }}
                >
                  Model Debts
                </button>
              </div>

              {/* Card 2: FIRE Projections */}
              <div className="pillar-card" style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border-gold)' }}>
                <div className="pillar-icon-box" style={{ background: 'var(--gold-light)' }}>
                  <Flame size={24} />
                </div>
                <h4>FIRE Projections</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Calculate how much you need to save monthly to retire early with financial independence.
                </p>
                <button 
                  onClick={() => navigateTo('strategies-single', null, 'fire')} 
                  className="btn-royal-green" 
                  style={{ padding: '10px 20px', fontSize: '12px' }}
                >
                  Project FIRE
                </button>
              </div>

              {/* Card 3: Financial Fitness */}
              <div className="pillar-card" style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border-gold)' }}>
                <div className="pillar-icon-box" style={{ background: 'var(--gold-light)' }}>
                  <PieChart size={24} />
                </div>
                <h4>Financial Fitness</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Assess your complete financial health across income, expenses, safety, investments, and mindset.
                </p>
                <button 
                  onClick={() => navigateTo('strategies-single', null, 'wellness')} 
                  className="btn-royal-gold" 
                  style={{ padding: '10px 20px', fontSize: '12px' }}
                >
                  Check Fitness
                </button>
              </div>
            </div>
          </section>

          {/* Insights & Intelligence Section */}
          <section id="insights-intelligence-section" className="landing-wellness-intro" style={{ backgroundColor: 'var(--bg-primary)', borderTop: '1px solid var(--border-light)' }}>
            <h2 className="section-title">Insights & Intelligence</h2>
            <p className="section-subtitle">
              Interactive engines designed to project long-term wealth milestones, audit financial age, audit leakages, and forecast goal probability.
            </p>

            <div className="calculators-grid-2x3">
              
              {/* Card 1: Time to ₹1 Crore (ACTIVE) */}
              <div className="pillar-card" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid var(--border-gold-strong)', position: 'relative' }}>
                <div className="pillar-icon-box" style={{ background: 'var(--gold-light)', marginTop: '10px' }}>
                  <Target size={24} color="var(--gold-dark)" />
                </div>
                <h4>Time to ₹1 Crore</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '25px' }}>
                  Calculate your exact compounding timeline to reach ₹1 Crore or custom target wealth goals.
                </p>
                <button 
                  onClick={() => navigateTo('time-to-1-crore')} 
                  className="btn-royal-blue" 
                  style={{ padding: '10px 20px', fontSize: '12px' }}
                >
                  Explore →
                </button>
              </div>

              {/* Card 2: Asset Allocation (ACTIVE) */}
              <div className="pillar-card" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid var(--border-gold-strong)', position: 'relative' }}>
                <div className="pillar-icon-box" style={{ background: 'var(--gold-light)', marginTop: '10px' }}>
                  <PieChart size={24} color="var(--gold-dark)" />
                </div>
                <h4>Asset Allocation</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '25px' }}>
                  Optimize your portfolio distribution across various asset classes based on risk profile.
                </p>
                <button 
                  onClick={() => navigateTo('asset-allocation')} 
                  className="btn-royal-green" 
                  style={{ padding: '10px 20px', fontSize: '12px' }}
                >
                  Explore →
                </button>
              </div>

              {/* Card 4: Goal Achievement Probability (ACTIVE) */}
              <div className="pillar-card" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid var(--border-gold-strong)', position: 'relative' }}>
                <div className="pillar-icon-box" style={{ background: 'var(--gold-light)', marginTop: '10px' }}>
                  <Sparkles size={24} color="var(--gold-dark)" />
                </div>
                <h4>Goal Probability</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '25px' }}>
                  Run Monte Carlo simulations to estimate the exact success probability of major life goals.
                </p>
                <button 
                  onClick={() => navigateTo('goal-probability')} 
                  className="btn-royal-violet" 
                  style={{ padding: '10px 20px', fontSize: '12px' }}
                >
                  Explore →
                </button>
              </div>

            </div>
          </section>
        </>
      )}

      {view === 'learning' && (
        <Learning onBack={() => navigateTo('home')} />
      )}

      {/* Render Strategies Workspace in Single Visibility Mode */}
      {view === 'strategies-single' && selectedStrategy && (
        <div className="workspace-container" style={{ marginTop: '40px' }}>
          <div 
            onClick={() => navigateTo('home')} 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              marginBottom: '30px', 
              cursor: 'pointer',
              color: 'var(--gold-dark)',
              fontWeight: 600,
              fontSize: '14px',
              fontFamily: 'Montserrat, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            <ArrowLeft size={16} /> Back to Journey
          </div>
          <Strategies key={selectedStrategy} initialStrategy={selectedStrategy} hideSidebar={true} />
        </div>
      )}

      {/* Render Single Calculator Workspace (Each gets its own page) */}
      {view === 'calculator-single' && singleCalc && (
        <div className="workspace-container" style={{ marginTop: '40px' }}>
          <div 
            onClick={() => navigateTo('home')} 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              marginBottom: '30px', 
              cursor: 'pointer',
              color: 'var(--gold-dark)',
              fontWeight: 600,
              fontSize: '14px',
              fontFamily: 'Montserrat, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            <ArrowLeft size={16} /> Back to Journey
          </div>
          <Calculators key={singleCalc} initialCalc={singleCalc} hideSidebar={true} />
        </div>
      )}

      {/* Render Time to ₹1 Crore View */}
      {view === 'time-to-1-crore' && (
        <div className="workspace-container" style={{ marginTop: '40px' }}>
          <div 
            onClick={() => navigateTo('home')} 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              marginBottom: '30px', 
              cursor: 'pointer',
              color: 'var(--gold-dark)',
              fontWeight: 600,
              fontSize: '14px',
              fontFamily: 'Montserrat, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            <ArrowLeft size={16} /> Back to Journey
          </div>
          <Insights />
        </div>
      )}

      {/* Render Goal Probability View */}
      {view === 'goal-probability' && (
        <div className="workspace-container" style={{ marginTop: '40px' }}>
          <div 
            onClick={() => navigateTo('home')} 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              marginBottom: '30px', 
              cursor: 'pointer',
              color: 'var(--gold-dark)',
              fontWeight: 600,
              fontSize: '14px',
              fontFamily: 'Montserrat, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            <ArrowLeft size={16} /> Back to Journey
          </div>
          <GoalProbabilityCalculator />
        </div>
      )}

      {/* Render Asset Allocation View */}
      {view === 'asset-allocation' && (
        <div className="workspace-container" style={{ marginTop: '40px' }}>
          <div 
            onClick={() => navigateTo('home')} 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              marginBottom: '30px', 
              cursor: 'pointer',
              color: 'var(--gold-dark)',
              fontWeight: 600,
              fontSize: '14px',
              fontFamily: 'Montserrat, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            <ArrowLeft size={16} /> Back to Journey
          </div>
          <AssetAllocation />
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="footer-logo">
          <div className="brand-logo-icon" style={{ margin: '0 auto 12px auto' }}>
            <img src="/Dosh.png" alt="Dosh Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} />
          </div>
          <h3 className="brand-font" style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '0.15em' }}>
            DOSH
          </h3>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Personal Finance Platform
          </p>
        </div>

        <ul className="footer-links">
          <li>
            <a href="/" onClick={(e) => { e.preventDefault(); navigateTo('home'); }}>
              Home
            </a>
          </li>
          <li>
            <button 
              onClick={() => {
                if (view !== 'home') {
                  navigateTo('home');
                  setTimeout(() => {
                    document.getElementById('strategies-portfolio-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                } else {
                  document.getElementById('strategies-portfolio-section')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px', padding: 0 }}
            >
              Strategies Portfolio
            </button>
          </li>
        </ul>

        <div className="footer-copy">
          &copy; {new Date().getFullYear()} Dosh. All rights reserved.
        </div>
      </footer>
    </>
  );
}

export default App;
