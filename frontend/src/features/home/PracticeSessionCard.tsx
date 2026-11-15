import { BookOpen, CheckCircle2, Clock3, Coffee, Code2, MessageCircle, RotateCcw } from 'lucide-react';

const sessionSteps = [
  { title: 'Revision', duration: '15 min', icon: RotateCcw, tone: 'review' },
  { title: 'Concept instruction', duration: '45 min', icon: BookOpen, tone: 'lesson' },
  { title: 'Break', duration: '10 min', icon: Coffee, tone: 'break' },
  { title: 'Practical work', duration: '40 min', icon: Code2, tone: 'practice' },
  { title: 'Doubts & assignment', duration: '10 min', icon: MessageCircle, tone: 'review' },
] as const;

export function PracticeSessionCard() {
  return (
    <aside className="practice-session-card" aria-label="Sample two-hour class plan">
      <div className="practice-session-heading">
        <div>
          <span className="practice-session-eyebrow">A class at a glance</span>
          <h2>Learn it. Build it. Get feedback.</h2>
        </div>
        <span className="practice-session-duration"><Clock3 size={14} /> 2 hours</span>
      </div>

      <p className="practice-session-intro">
        A clear rhythm for every session, from the first recap to your next assignment.
      </p>

      <ol className="practice-session-list">
        {sessionSteps.map(({ title, duration, icon: Icon, tone }) => (
          <li className="practice-session-step" key={title}>
            <span className={`practice-session-icon practice-session-icon-${tone}`} aria-hidden="true">
              <Icon size={16} />
            </span>
            <span className="practice-session-step-title">{title}</span>
            <span className="practice-session-step-duration">{duration}</span>
          </li>
        ))}
      </ol>

      <div className="practice-session-footer">
        <CheckCircle2 size={16} aria-hidden="true" />
        <span>Time to apply what you learn, every class.</span>
      </div>
    </aside>
  );
}
