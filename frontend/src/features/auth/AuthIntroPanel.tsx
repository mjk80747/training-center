import { BookOpen, Check, GraduationCap, LockKeyhole, Mail, Play, Trophy, UserRound, Zap, ChartNoAxesColumnIncreasing } from 'lucide-react';

type AuthIntroPanelProps = {
  mode: 'login' | 'forgot' | 'register';
  step?: number;
};

export function AuthIntroPanel({ mode, step = 1 }: AuthIntroPanelProps) {
  if (mode === 'register') {
    return (
      <aside className="auth-intro-card auth-registration-sidebar" aria-label="Registration steps">
        <ol className="auth-registration-steps">
          <li className={step >= 1 ? 'is-current' : ''}>
            <span className="auth-step-indicator">{step > 1 ? <Check size={16} aria-hidden="true" /> : '1'}</span>
            <span>Account Details</span>
          </li>
          <li className={step >= 2 ? 'is-current' : ''}>
            <span className="auth-step-indicator">2</span>
            <span>Course &amp; Password</span>
          </li>
          <li>
            <span className="auth-step-indicator"><Check size={16} aria-hidden="true" /></span>
            <span>Complete</span>
          </li>
        </ol>

        <div className="auth-community-card">
          <span className="auth-community-icon"><Trophy size={25} aria-hidden="true" /></span>
          <h2>{step === 1 ? 'Join our growing community of learners!' : "You're almost there!"}</h2>
          <p>
            {step === 1
              ? <><span className="auth-avatar-stack" aria-hidden="true"><i>R</i><i>A</i><i>S</i></span> +10K Students</>
              : 'Complete your registration to start learning.'}
          </p>
        </div>
      </aside>
    );
  }

  if (mode === 'forgot') {
    return (
      <aside className="auth-intro-card auth-forgot-visual" aria-label="Password recovery information">
        <div className="auth-recovery-art" aria-hidden="true">
          <span className="auth-recovery-orbit" />
          <span className="auth-recovery-mail"><Mail size={112} strokeWidth={1.2} /></span>
          <span className="auth-recovery-lock"><LockKeyhole size={28} /></span>
        </div>
        <div className="auth-intro-copy">
          <h2>Forgot password?</h2>
          <p>Enter the email address linked to your account and we’ll send you a reset code.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="auth-intro-card auth-login-visual" aria-label="KSR IT Solutions learning platform">
      <div className="auth-intro-copy">
        <p className="auth-intro-eyebrow"><Play size={12} fill="currentColor" aria-hidden="true" /> Learn <i /> Practice <i /> Grow</p>
        <h2>Welcome <span>Back!</span></h2>
        <p>Sign in to continue to your<br className="auth-desktop-break" /> KSR IT SOLUTIONS workspace.</p>
        <div className="auth-feature-row">
          <div><span><BookOpen size={19} aria-hidden="true" /></span><strong>Expert-Led<br />Courses</strong></div>
          <div><span><Zap size={19} aria-hidden="true" /></span><strong>Interactive<br />Learning</strong></div>
          <div><span><ChartNoAxesColumnIncreasing size={19} aria-hidden="true" /></span><strong>Track Your<br />Progress</strong></div>
        </div>
      </div>

      <div className="auth-learning-art" aria-hidden="true">
        <div className="auth-art-glow" />
        <span className="auth-art-cap"><GraduationCap size={64} strokeWidth={1.5} /></span>
        <span className="auth-art-screen"><UserRound size={46} /><GraduationCap size={38} /></span>
        <span className="auth-art-base" />
      </div>
    </aside>
  );
}
