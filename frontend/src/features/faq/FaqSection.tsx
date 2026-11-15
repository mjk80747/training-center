import { ArrowRight, ChevronDown, CircleHelp, MessageCircleQuestion } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { instituteName } from '../../lib/config';

const questions = [
  {
    question: 'How do I know which career path is right for me?',
    answer:
      'Our career assessment tools and expert guidance help you identify your strengths, interests, and market opportunities to choose the right path.',
  },
  {
    question: 'Where should I search for jobs and internships?',
    answer:
      'We provide access to our exclusive job portal, partner company listings, and direct connections with hiring managers from top companies.',
  },
  {
    question: 'What are the most common interview questions for freshers?',
    answer:
      'We cover technical questions, behavioral questions, and industry-specific scenarios with detailed preparation materials and mock interviews.',
  },
  {
    question: 'How do I prepare for technical interviews?',
    answer:
      'Our structured curriculum includes coding challenges, system design concepts, and hands-on projects that mirror real interview scenarios.',
  },
  {
    question: 'Which programming languages should I learn first?',
    answer:
      'Based on current market demand, we recommend starting with Python or JavaScript, followed by specialized languages based on your career goals.',
  },
];

export function FaqSection() {
  return (
    <>
      <section className="faq-section" aria-labelledby="faq-title">
        <div className="faq-intro">
          <span className="faq-icon"><MessageCircleQuestion size={20} /></span>
          <p className="faq-eyebrow">Got questions?</p>
          <h2 id="faq-title">Frequently Asked Questions</h2>
          <p className="faq-description">
            Clear, concise answers to help you choose the right training program at {instituteName}.
          </p>
          <NavLink to="/contact" className="faq-contact-link">
            Talk to admissions <ArrowRight size={15} />
          </NavLink>
        </div>

        <div className="faq-list">
          {questions.map(({ question, answer }, index) => (
            <details className="faq-item" key={question}>
              <summary>
                <span className="faq-number">{String(index + 1).padStart(2, '0')}</span>
                <span className="faq-question">{question}</span>
                <ChevronDown className="faq-chevron" size={18} aria-hidden="true" />
              </summary>
              <p className="faq-answer">{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="faq-help-banner" aria-labelledby="faq-help-title">
        <CircleHelp className="faq-help-icon" size={28} aria-hidden="true" />
        <h2 id="faq-help-title">Still have questions?</h2>
        <p>Our training advisors are ready to help you find the right program.</p>
        <div className="faq-help-actions">
          <NavLink
            to={`/contact?message=${encodeURIComponent("I'd like to chat with a training advisor about your programs.")}`}
            className="faq-help-primary"
          >
            Live Chat Now
          </NavLink>
          <NavLink
            to={`/contact?message=${encodeURIComponent('I need help from the support team.')}`}
            className="faq-help-secondary"
          >
            Contact Support
          </NavLink>
        </div>
      </section>
    </>
  );
}
