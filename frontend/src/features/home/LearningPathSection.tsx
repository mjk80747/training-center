import {
  ArrowRight,
  CheckCircle2,
  Code2,
  Compass,
  GitPullRequest,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

export interface ProcessStep {
  step: string;
  phase: string;
  title: string;
  description: string;
  deliverable: string;
  icon: typeof Compass;
  skills: string[];
}

export const defaultSteps: ProcessStep[] = [
  {
    step: '01',
    phase: 'Month 1',
    title: 'Foundations & Architecture',
    description:
      'Build unshakeable command of modern programming syntax, computational thinking, data structures, and Git version control.',
    deliverable: 'Clean Code Foundations',
    icon: Compass,
    skills: ['Core Language Mechanics', 'Git & GitHub Workflows', 'Problem Solving & DSA'],
  },
  {
    step: '02',
    phase: 'Months 2–3',
    title: 'Intensive Practical Labs',
    description:
      'Immerse in 70% practical coding. Build complete backends, modern frontend user interfaces, relational schemas, and APIs.',
    deliverable: 'Full-Stack Functional Apps',
    icon: Code2,
    skills: ['Component State & UI', 'RESTful API Engineering', 'Database Design & SQL'],
  },
  {
    step: '03',
    phase: 'Month 4',
    title: 'Enterprise Capstone & Reviews',
    description:
      'Architect a production-grade application following industry standards with automated tests, code reviews, and cloud deployment.',
    deliverable: 'Live Production Capstone',
    icon: GitPullRequest,
    skills: ['Peer & Mentor PR Reviews', 'Docker & Cloud Deployment', 'Unit & Integration Testing'],
  },
  {
    step: '04',
    phase: 'Month 5 & Beyond',
    title: 'Mock Interviews & Hiring',
    description:
      'Sharpen technical and behavioral interview performance through rigorous 1-on-1 mocks, resume tailoring, and direct corporate interviews.',
    deliverable: 'Dream Job Placement',
    icon: Trophy,
    skills: ['1-on-1 Mock Interviews', 'ATS-Optimized Resumes', 'Direct Referral Drives'],
  },
];

export function LearningPathSection({ steps = defaultSteps }: { steps?: ProcessStep[] }) {
  return (
    <section className="learning-path-section" aria-labelledby="learning-path-title">
      <div className="learning-path-header">
        <span className="learning-path-eyebrow">
          <Sparkles size={13} aria-hidden="true" /> Structured Roadmap
        </span>
        <h2 id="learning-path-title">Your 4-Step Journey from Beginner to Hired Engineer</h2>
        <p className="learning-path-subtitle">
          A proven, milestone-driven curriculum designed to systematically build your skills,
          confidence, and portfolio from day one.
        </p>
      </div>

      <div className="learning-path-timeline">
        <div className="learning-path-track" aria-hidden="true" />
        <div className="learning-path-steps">
          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="learning-path-step-card" data-testid={`learning-step-${item.step}`}>
                <div className="learning-step-badge-row">
                  <span className="learning-step-number">{item.step}</span>
                  <span className="learning-step-phase">{item.phase}</span>
                </div>

                <div className="learning-step-icon-wrapper" aria-hidden="true">
                  <Icon size={20} />
                </div>

                <h3 className="learning-step-title">{item.title}</h3>
                <p className="learning-step-description">{item.description}</p>

                <div className="learning-step-deliverable">
                  <span className="deliverable-label">Key Milestone</span>
                  <strong className="deliverable-value">
                    <CheckCircle2 size={13} aria-hidden="true" /> {item.deliverable}
                  </strong>
                </div>

                <div className="learning-step-skills" aria-label={`Skills in ${item.title}`}>
                  {item.skills.map((skill) => (
                    <span key={skill} className="learning-skill-pill">
                      {skill}
                    </span>
                  ))}
                </div>

                {index < steps.length - 1 && (
                  <div className="learning-step-connector" aria-hidden="true">
                    <ArrowRight size={16} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="learning-path-cta-strip">
        <div className="learning-path-cta-copy">
          <strong>Ready to start your roadmap?</strong>
          <span>Explore our full catalog of structured technical tracks.</span>
        </div>
        <NavLink to="/courses" className="learning-path-cta-link">
          Browse All Syllabuses <ArrowRight size={14} aria-hidden="true" />
        </NavLink>
      </div>
    </section>
  );
}
