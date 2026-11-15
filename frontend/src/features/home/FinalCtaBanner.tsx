import { ArrowRight, Calendar, CheckCircle2, Headphones, MessageSquare, Sparkles } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { instituteName } from '../../lib/config';

export function FinalCtaBanner() {
  return (
    <section className="final-cta-section" aria-labelledby="final-cta-heading">
      <div className="final-cta-card">
        <div className="final-cta-decorations" aria-hidden="true">
          <div className="final-cta-glow-1" />
          <div className="final-cta-glow-2" />
        </div>

        <div className="final-cta-content">
          <span className="final-cta-kicker">
            <Sparkles size={13} aria-hidden="true" /> Take the First Step Today
          </span>

          <h2 id="final-cta-heading">Ready to Accelerate Your Career in Tech?</h2>

          <p className="final-cta-description">
            Join hundreds of successful B.Tech graduates and ambitious career switchers at {instituteName}.
            Master modern stacks through 70% practical coding and land a role you love.
          </p>

          <div className="final-cta-actions">
            <NavLink to="/courses" className="final-cta-primary-btn">
              Explore All Courses <ArrowRight size={16} aria-hidden="true" />
            </NavLink>

            <NavLink
              to={`/contact?message=${encodeURIComponent('Hi, I want to schedule a free 1-on-1 career counselling session.')}`}
              className="final-cta-secondary-btn"
            >
              <MessageSquare size={16} aria-hidden="true" /> Book Free Counselling
            </NavLink>
          </div>

          <div className="final-cta-trust-strip">
            <div className="final-cta-trust-item">
              <Calendar size={14} className="trust-icon" aria-hidden="true" />
              <span>Next batch starts this Monday</span>
            </div>
            <div className="final-cta-trust-item">
              <CheckCircle2 size={14} className="trust-icon" aria-hidden="true" />
              <span>Flexible EMI & Instalments</span>
            </div>
            <div className="final-cta-trust-item">
              <Headphones size={14} className="trust-icon" aria-hidden="true" />
              <span>Dedicated Placement Guidance</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
