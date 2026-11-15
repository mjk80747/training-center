import { Building, CheckCircle2, Handshake, Sparkles, TrendingUp } from 'lucide-react';
import { instituteName } from '../../lib/config';

export interface HiringPartner {
  id: string;
  name: string;
  category: string;
  badgeText: string;
}

export const defaultPartners: HiringPartner[] = [
  { id: 'tcs', name: 'TCS', category: 'Global IT Services', badgeText: 'Tata Consultancy Services' },
  { id: 'infosys', name: 'Infosys', category: 'Enterprise Digital', badgeText: 'Infosys BPM & Systems' },
  { id: 'wipro', name: 'Wipro', category: 'Tech Consulting', badgeText: 'Wipro Technologies' },
  { id: 'capgemini', name: 'Capgemini', category: 'Cloud & Engineering', badgeText: 'Capgemini Global' },
  { id: 'accenture', name: 'Accenture', category: 'Strategy & Technology', badgeText: 'Accenture Solutions' },
  { id: 'cognizant', name: 'Cognizant', category: 'Digital Engineering', badgeText: 'Cognizant Technology' },
  { id: 'tech-mahindra', name: 'Tech Mahindra', category: 'Next-Gen Services', badgeText: 'Tech Mahindra' },
  { id: 'hcl', name: 'HCLTech', category: 'Engineering & R&D', badgeText: 'HCL Technologies' },
  { id: 'persistent', name: 'Persistent', category: 'Software Products', badgeText: 'Persistent Systems' },
  { id: 'deloitte', name: 'Deloitte', category: 'Advisory & Tech', badgeText: 'Deloitte Digital' },
  { id: 'amazon', name: 'Amazon', category: 'Cloud & Operations', badgeText: 'Amazon Web Services' },
  { id: 'oracle', name: 'Oracle', category: 'Database & Cloud', badgeText: 'Oracle Cloud' },
];

export function HiringPartnersSection({ partners = defaultPartners }: { partners?: HiringPartner[] }) {
  return (
    <section className="hiring-partners-section" aria-labelledby="hiring-partners-title">
      <div className="hiring-partners-header">
        <span className="hiring-partners-eyebrow">
          <Handshake size={14} aria-hidden="true" /> Trusted Network
        </span>
        <h2 id="hiring-partners-title">Top Companies Hiring from {instituteName}</h2>
        <p className="hiring-partners-subtitle">
          Our alumni work at world-class technology consulting firms, product organizations,
          and fast-growing startups across India.
        </p>
      </div>

      <div className="hiring-partners-grid" aria-label="Hiring Partners List">
        {partners.map((partner) => (
          <div key={partner.id} className="hiring-partner-tile" data-testid={`partner-${partner.id}`}>
            <div className="partner-logo-mark" aria-hidden="true">
              <Building size={16} />
            </div>
            <div className="partner-info">
              <span className="partner-name">{partner.name}</span>
              <span className="partner-category">{partner.category}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="hiring-partners-stats-footer">
        <div className="hiring-stat-bullet">
          <CheckCircle2 size={15} className="hiring-stat-check" aria-hidden="true" />
          <span><strong>50+</strong> Active Recruiting Partners</span>
        </div>
        <div className="hiring-stat-bullet">
          <TrendingUp size={15} className="hiring-stat-check" aria-hidden="true" />
          <span><strong>4.5 LPA – 12 LPA</strong> Placement Package Range</span>
        </div>
        <div className="hiring-stat-bullet">
          <Sparkles size={15} className="hiring-stat-check" aria-hidden="true" />
          <span><strong>100+</strong> Campus & Direct Off-Campus Drives</span>
        </div>
      </div>
    </section>
  );
}
