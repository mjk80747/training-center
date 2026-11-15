import { Award, Building2, Code2, GraduationCap, Star, TrendingUp } from 'lucide-react';

export interface StatItem {
  id: string;
  value: string;
  label: string;
  detail: string;
  icon: typeof GraduationCap;
  accentColor: string;
}

export const defaultStats: StatItem[] = [
  {
    id: 'students',
    value: '1,250+',
    label: 'Graduates Trained',
    detail: 'Across 4 career tracks',
    icon: GraduationCap,
    accentColor: '#08adbf',
  },
  {
    id: 'placement',
    value: '94.8%',
    label: 'Placement Success',
    detail: 'Within 90 days of graduation',
    icon: TrendingUp,
    accentColor: '#10b981',
  },
  {
    id: 'partners',
    value: '50+',
    label: 'Hiring Partners',
    detail: 'Top MNCs & tech startups',
    icon: Building2,
    accentColor: '#6366f1',
  },
  {
    id: 'rating',
    value: '4.9 / 5',
    label: 'Alumni Rating',
    detail: 'Over 600+ verified reviews',
    icon: Star,
    accentColor: '#f59e0b',
  },
  {
    id: 'practical',
    value: '70%',
    label: 'Hands-on Coding',
    detail: 'Real-world project labs',
    icon: Code2,
    accentColor: '#ec4899',
  },
];

export function StatsCounterStrip({ stats = defaultStats }: { stats?: StatItem[] }) {
  return (
    <section className="home-stats-strip-container" aria-label="Key Institute Metrics & Highlights">
      <div className="home-stats-strip">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.id} className="home-stat-item" data-testid={`stat-${stat.id}`}>
              <div
                className="home-stat-icon-wrap"
                style={{ backgroundColor: `${stat.accentColor}15`, color: stat.accentColor }}
                aria-hidden="true"
              >
                <Icon size={22} />
              </div>
              <div className="home-stat-content">
                <span className="home-stat-value">{stat.value}</span>
                <span className="home-stat-label">{stat.label}</span>
                <span className="home-stat-detail">{stat.detail}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
