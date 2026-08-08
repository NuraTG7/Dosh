import React, { useEffect } from 'react';
import {
  Brain,
  Clock,
  Shield,
  HelpCircle,
  AlertTriangle,
  ShieldCheck,
  Trophy,
  Timer,
  Crown,
  Lock,
  ArrowLeft
} from 'lucide-react';

interface LearningProps {
  onBack: () => void;
}

const Learning: React.FC<LearningProps> = ({ onBack }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const principles = [
    {
      icon: <Brain size={24} />,
      title: 'Behavior',
      subtitle: 'How you behave with money matters more than what you know about money.',
      description: 'Your financial decisions are shaped by your personal experiences, emotions, ego, and the environment you grew up in. Understanding your own behavior is one of the biggest advantages you can develop as an investor.'
    },
    {
      icon: <Clock size={24} />,
      title: 'Compounding',
      subtitle: 'Great wealth is often the result of extraordinary patience, not extraordinary returns.',
      description: "Housel emphasizes how relatively small advantages can become enormous when given decades to compound. The key isn't just earning high returns—it's staying invested long enough for compounding to work."
    },
    {
      icon: <Shield size={24} />,
      title: 'Room for Error',
      subtitle: "You don't need every decision to be right. You need to survive the decisions that are wrong.",
      description: 'Build enough savings, flexibility, and margin of safety to handle unexpected events. Financial plans should account for uncertainty because the future will almost never unfold exactly as expected.'
    },
    {
      icon: <HelpCircle size={24} />,
      title: 'Luck & Uncertainty',
      subtitle: "Success isn't always skill, and failure isn't always incompetence.",
      description: 'Understand how luck and randomness influence financial outcomes, and why judging the quality of a decision requires looking beyond the result.'
    },
    {
      icon: <AlertTriangle size={24} />,
      title: 'The More Trap',
      subtitle: 'There will always be another number to chase.',
      description: 'Learn how constantly wanting more income, wealth, or status can push you toward unnecessary risks—and why defining what is enough can protect your financial future.'
    },
    {
      icon: <ShieldCheck size={24} />,
      title: 'Build & Protect',
      subtitle: 'Creating wealth and keeping it require different mindsets.',
      description: 'Learn why taking calculated risks can help you build wealth, while patience, diversification, humility, and caution help you keep it.'
    },
    {
      icon: <Trophy size={24} />,
      title: 'Big Wins Matter',
      subtitle: 'A small number of outcomes can drive most of your financial success.',
      description: "Understand why you don't need every investment or decision to work perfectly, and why a few exceptional outcomes can have an outsized impact on long-term wealth."
    },
    {
      icon: <Timer size={24} />,
      title: 'Time Freedom',
      subtitle: 'The greatest value of money is the control it gives you over your time.',
      description: 'Measure wealth not only by what you can buy, but by how much freedom you have to choose your work, spend your time, and live life on your own terms.'
    },
    {
      icon: <Crown size={24} />,
      title: 'Looking Rich vs. Being Wealthy',
      subtitle: 'What looks like wealth may actually be the opposite.',
      description: 'Expensive cars, houses, and lifestyles show what someone has spent—not what they have accumulated. Learn why financial strength is often invisible.'
    },
    {
      icon: <Lock size={24} />,
      title: 'Invisible Wealth',
      subtitle: "The money you don't spend is often the money that gives you the most freedom.",
      description: 'Understand why savings, investments, and financial reserves matter more than appearances, and how keeping money invested creates future options.'
    }
  ];

  return (
    <div className="workspace-container" style={{ marginTop: '40px' }}>
      <div className="workspace-header">
        <div 
          onClick={onBack} 
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
          <ArrowLeft size={18} /> Back
        </div>
        <div className="workspace-title-block">
          <h2 className="workspace-title">The Psychology of Money</h2>
          <p className="workspace-subtitle">
            Mastering your money is more about psychology than math. These 10 core principles form the psychological foundation of lifelong wealth.
          </p>
        </div>
      </div>

      <div className="pillars-grid" style={{ marginTop: '40px', paddingBottom: '60px' }}>
        {principles.map((p, index) => (
          <div key={index} className="pillar-card">
            <div className="pillar-icon-box">
              {p.icon}
            </div>
            <h4>{p.title}</h4>
            <p style={{ marginBottom: '12px', fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
              {p.subtitle}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {p.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Learning;
