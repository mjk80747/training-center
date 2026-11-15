import { ArrowRight, Sparkles } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const spotlights = [
  {
    category: 'AI & AUTOMATION',
    title: 'AI is moving from chat into everyday workflows',
    description: 'Learn how AI tools are helping teams turn ideas into useful products.',
    image: 'photo-1677442136019-21780ecad995',
    accent: 'ai',
    course: 'Python Full Stack',
  },
  {
    category: 'CYBERSECURITY',
    title: 'Security-minded developers are more important than ever',
    description: 'Explore the habits that help keep applications and user data safer.',
    image: 'photo-1550751827-4bd374c3f58b',
    accent: 'security',
    course: 'Java Full Stack',
  },
  {
    category: 'DATA & ANALYTICS',
    title: 'Good data stories make complex decisions clearer',
    description: 'Turn spreadsheets and raw data into insights people can act on.',
    image: 'photo-1551288049-bebda4e38f71',
    accent: 'data',
    course: 'Data Analytics',
  },
  {
    category: 'WEB DEVELOPMENT',
    title: 'The web keeps getting faster, smarter, and more interactive',
    description: 'Build accessible experiences with modern frontend tools and skills.',
    image: 'photo-1498050108023-c5249f4df085',
    accent: 'web',
    course: 'Front-End Development',
  },
  {
    category: 'CLOUD & SOFTWARE',
    title: 'Cloud skills connect code to products used at scale',
    description: 'See how modern applications move from a laptop to the real world.',
    image: 'photo-1451187580459-43490279c0fa',
    accent: 'cloud',
    course: 'Java Full Stack',
  },
];

function SpotlightCards({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <div className="tech-gallery-group" aria-hidden={duplicate || undefined}>
      {spotlights.map((spotlight) => (
        <article className={`tech-gallery-card tech-gallery-${spotlight.accent}`} key={spotlight.category}>
          <div className="tech-gallery-image">
            <img
              src={`https://images.unsplash.com/${spotlight.image}?auto=format&fit=crop&w=800&q=80`}
              alt=""
              loading="lazy"
            />
            <span className="tech-gallery-image-shade" />
            <span className="tech-gallery-category">{spotlight.category}</span>
            <Sparkles className="tech-gallery-sparkle" size={18} aria-hidden="true" />
          </div>
          <div className="tech-gallery-copy">
            <h3>{spotlight.title}</h3>
            <p>{spotlight.description}</p>
            <NavLink to="/courses" tabIndex={duplicate ? -1 : undefined}>
              Explore {spotlight.course} <ArrowRight size={14} />
            </NavLink>
          </div>
        </article>
      ))}
    </div>
  );
}

export function TechNewsGallery() {
  return (
    <section className="tech-gallery" aria-labelledby="tech-gallery-title">
      <div className="tech-gallery-heading">
        <div>
          <p className="tech-gallery-eyebrow"><span /> THE STUDENT TECH RADAR</p>
          <h2 id="tech-gallery-title">What’s moving the tech world?</h2>
          <p>Fresh ideas, emerging skills, and inspiration for your next project.</p>
        </div>
      </div>
      <div className="tech-gallery-viewport">
        <div className="tech-gallery-track">
          <SpotlightCards />
          <SpotlightCards duplicate />
        </div>
      </div>
      <div className="tech-gallery-footnote">
        <span>Ideas worth exploring</span>
        <span className="tech-gallery-footnote-line" />
        <span>Move your pointer over a card to pause</span>
      </div>
    </section>
  );
}
