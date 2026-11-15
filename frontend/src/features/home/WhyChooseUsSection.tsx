import {
  Award,
  CalendarCheck,
  CheckCircle2,
  Code2,
  Layers,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import { instituteName } from '../../lib/config';

export interface WhyFeature {
  id: string;
  icon: typeof Code2;
  title: string;
  description: string;
  badge: string;
  highlightPoints: string[];
}

export const defaultFeatures: WhyFeature[] = [
  {
    id: 'practical-first',
    icon: Code2,
    title: '70% Practical & Project-First',
    description:
      'We ditch monotone slide decks. You write code daily, debug real scenarios, and build end-to-end applications designed to simulate actual engineering teams.',
    badge: 'Code Every Day',
    highlightPoints: ['Hands-on daily coding drills', 'Enterprise simulation repos', 'Production debugging practice'],
  },
  {
    id: 'industry-mentors',
    icon: Users,
    title: 'Senior Industry Mentors',
    description:
      'Learn from practicing software architects and senior engineers. Get actionable 1-on-1 feedback on your pull requests, architecture, and coding conventions.',
    badge: '1-on-1 Feedback',
    highlightPoints: ['Direct PR code reviews', 'Doubt-clearing lab hours', 'Architectural guidance'],
  },
  {
    id: 'placement-support',
    icon: Target,
    title: 'Dedicated Placement Cell',
    description:
      'From Day 1, we optimize your resume, build a standout GitHub profile, run simulated technical mocks, and organize interviews with vetted corporate hiring partners.',
    badge: 'Career Acceleration',
    highlightPoints: ['ATS-tailored resumes', 'Mock technical interviews', 'Direct referral hiring drives'],
  },
  {
    id: 'modern-curriculum',
    icon: Layers,
    title: 'Modern & In-Demand Stacks',
    description:
      'Curricula engineered around what high-paying tech employers require today—React 18, Python/FastAPI, Java Spring Boot, SQL, Docker, and Cloud fundamentals.',
    badge: 'Enterprise Standards',
    highlightPoints: ['Full-stack architectures', 'REST & GraphQL APIs', 'Database indexing & design'],
  },
  {
    id: 'flexible-learning',
    icon: CalendarCheck,
    title: 'Flexible Modes & Batch Timings',
    description:
      'Choose between interactive live online sessions, offline lab classes, or weekend hybrid tracks crafted to fit around your college classes or day job.',
    badge: 'Learn at Your Pace',
    highlightPoints: ['Weekday evening slots', 'Weekend intensive batches', 'Recorded sessions library'],
  },
  {
    id: 'capstones',
    icon: Award,
    title: 'Deployable Portfolio Capstones',
    description:
      'Graduate with 4+ production-deployed projects with public code repositories and live URLs that prove your competency to tech recruiters before you even speak.',
    badge: 'Proof of Work',
    highlightPoints: ['Live cloud deployments', 'CI/CD pipeline integration', 'Verifiable digital certificates'],
  },
];

export function WhyChooseUsSection({ features = defaultFeatures }: { features?: WhyFeature[] }) {
  return (
    <section className="why-choose-us-section" aria-labelledby="why-choose-us-title">
      <div className="why-choose-us-header">
        <span className="why-choose-us-eyebrow">
          <Sparkles size={13} aria-hidden="true" /> The {instituteName} Advantage
        </span>
        <h2 id="why-choose-us-title">Engineered for Real Tech Careers, Not Just Theory</h2>
        <p className="why-choose-us-subtitle">
          Traditional courses teach syntax. We teach you how production systems are architected, built, tested,
          and deployed by modern engineering teams.
        </p>
      </div>

      <div className="why-choose-us-grid">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <article key={feature.id} className="why-feature-card" data-testid={`why-feature-${feature.id}`}>
              <div className="why-feature-top">
                <div className="why-feature-icon-box" aria-hidden="true">
                  <Icon size={22} />
                </div>
                <span className="why-feature-badge">{feature.badge}</span>
              </div>
              <h3 className="why-feature-title">{feature.title}</h3>
              <p className="why-feature-desc">{feature.description}</p>
              <ul className="why-feature-bullets" aria-label={`Key aspects of ${feature.title}`}>
                {feature.highlightPoints.map((point) => (
                  <li key={point}>
                    <CheckCircle2 size={13} className="why-bullet-icon" aria-hidden="true" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}
