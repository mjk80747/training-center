import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Compass, RotateCcw, Sparkles, Trophy, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../../lib/format';
import { routes } from '../../routes/paths';
import type { CourseItem } from './types';

const quizSteps = [
  {
    title: "What's your background?",
    subtitle: "This helps us understand where you're starting from.",
    options: [
      { value: 'fresher', label: 'Fresher', description: 'Just graduated or still studying' },
      { value: 'working', label: 'Working Professional', description: 'Currently employed in any field' },
      { value: 'switcher', label: 'Career Switcher', description: 'Looking to move into tech' },
      { value: 'student', label: 'Student', description: 'Currently pursuing a degree' },
    ],
  },
  {
    title: 'How much coding experience do you have?',
    subtitle: "Be honest — there's no wrong answer.",
    options: [
      { value: 'none', label: 'None', description: 'Never written code before' },
      { value: 'basics', label: 'Some Basics', description: 'Done a tutorial or two' },
      { value: 'comfortable', label: 'Comfortable', description: 'Can build small projects' },
      { value: 'advanced', label: 'Advanced', description: 'Built production apps' },
    ],
  },
  {
    title: 'What excites you most?',
    subtitle: 'Pick the area that sounds most interesting.',
    options: [
      { value: 'web', label: 'Building Websites & Apps', description: 'Frontend, backend, full-stack' },
      { value: 'data', label: 'Working with Data', description: 'Analytics, dashboards, insights' },
      { value: 'enterprise', label: 'Enterprise Systems', description: 'Large-scale, robust applications' },
      { value: 'explore', label: 'Not Sure Yet', description: 'I want to explore options' },
    ],
  },
  {
    title: "What's your primary goal?",
    subtitle: 'What would you like to achieve in the next 6 months?',
    options: [
      { value: 'first-job', label: 'First Tech Job', description: 'Land my first role in tech' },
      { value: 'promotion', label: 'Upskill for Promotion', description: 'Level up in my current career' },
      { value: 'switch', label: 'Switch to Tech', description: 'Transition from another field' },
      { value: 'startup', label: 'Freelance / Startup', description: 'Work independently or build something' },
    ],
  },
] as const;

type QuizAnswers = string[];

function recommendCourse(answers: QuizAnswers, courses: CourseItem[]) {
  const [background, experience, interest, goal] = answers;
  let recommendedCode: string;

  if (interest === 'data' || (interest === 'explore' && background === 'working' && goal === 'promotion')) {
    recommendedCode = 'DA';
  } else if (interest === 'enterprise' || (interest === 'explore' && experience === 'advanced')) {
    recommendedCode = 'JFS';
  } else if (
    interest === 'web' &&
    (experience === 'none' || experience === 'basics') &&
    (goal === 'first-job' || goal === 'switch')
  ) {
    recommendedCode = 'PFS';
  } else if (interest === 'web' || (interest === 'explore' && experience === 'comfortable')) {
    recommendedCode = 'FED';
  } else {
    recommendedCode = 'PFS';
  }

  return courses.find((course) => course.code === recommendedCode);
}

export function CourseFinderQuiz({ courses }: { courses: CourseItem[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>([]);
  const isResult = step === quizSteps.length;
  const recommendedCourse = isResult ? recommendCourse(answers, courses) : undefined;

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  function startQuiz() {
    setStep(0);
    setAnswers([]);
    setIsOpen(true);
  }

  function selectAnswer(value: string) {
    setAnswers((current) => {
      const updated = [...current];
      updated[step] = value;
      return updated;
    });
  }

  function goBack() {
    setStep((current) => Math.max(0, current - 1));
  }

  return (
    <>
      <section className="course-finder-promo" aria-labelledby="course-finder-title">
        <span className="course-finder-promo-icon"><Compass size={21} /></span>
        <p className="course-finder-eyebrow">Your next step starts here</p>
        <h2 id="course-finder-title">Not sure which course is right for you?</h2>
        <p>Take our 60-second quiz and get a course recommendation based on your background, interests, and goals.</p>
        <button type="button" className="course-finder-start" onClick={startQuiz}>
          Find Your Perfect Course <ArrowRight size={18} />
        </button>
      </section>

      {isOpen ? (
        <div
          className="course-quiz-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <section
            className="course-quiz-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="course-quiz-title"
            aria-describedby="course-quiz-subtitle"
          >
            <button type="button" className="course-quiz-close" onClick={() => setIsOpen(false)} aria-label="Close course finder">
              <X size={20} />
            </button>

            {isResult ? (
              <div className="course-quiz-result">
                <span className="course-quiz-trophy"><Trophy size={28} /></span>
                <p className="course-quiz-step-label">YOUR PERSONALIZED RECOMMENDATION</p>
                <h2 id="course-quiz-title">Your next step in tech</h2>
                <p id="course-quiz-subtitle" className="course-quiz-subtitle">Based on your answers, here’s a course to explore:</p>
                {recommendedCourse ? (
                  <article className="course-quiz-result-card">
                    <span className="course-quiz-match"><Sparkles size={13} /> Recommended for you</span>
                    <h3>{recommendedCourse.name}</h3>
                    <p>{recommendedCourse.description}</p>
                    <div className="course-quiz-facts">
                      <span>{recommendedCourse.duration_months} months</span>
                      <span>{formatPrice(recommendedCourse.fee)}</span>
                    </div>
                    {recommendedCourse.skills_covered ? (
                      <div className="course-quiz-skills">
                        {recommendedCourse.skills_covered.split(',').map((skill) => skill.trim()).filter(Boolean).slice(0, 3).map((skill) => (
                          <span key={skill}>{skill}</span>
                        ))}
                      </div>
                    ) : null}
                    <div className="course-quiz-result-actions">
                      <Link
                        to={`${routes.courses}#course-${recommendedCourse.id}`}
                        className="course-quiz-details"
                        onClick={() => setIsOpen(false)}
                      >
                        View Course Details <ArrowRight size={17} />
                      </Link>
                      <Link to={routes.courses} className="course-quiz-all" onClick={() => setIsOpen(false)}>
                        See All Courses
                      </Link>
                    </div>
                  </article>
                ) : (
                  <div className="course-quiz-unavailable" role="alert">
                    <p>We couldn’t load course details just now. Please browse the catalog or contact admissions for help.</p>
                    <Link to={routes.courses} onClick={() => setIsOpen(false)}>Browse all courses <ArrowRight size={15} /></Link>
                  </div>
                )}
                <button type="button" className="course-quiz-retake" onClick={startQuiz}>
                  <RotateCcw size={14} /> Retake Quiz
                </button>
              </div>
            ) : (
              <>
                <div className="course-quiz-progress">
                  <span style={{ width: `${((step + 1) / quizSteps.length) * 100}%` }} />
                </div>
                <p className="course-quiz-step-label">STEP {step + 1} OF {quizSteps.length}</p>
                <h2 id="course-quiz-title">{quizSteps[step].title}</h2>
                <p id="course-quiz-subtitle" className="course-quiz-subtitle">{quizSteps[step].subtitle}</p>

                <div className="course-quiz-options" role="group" aria-label={quizSteps[step].title}>
                  {quizSteps[step].options.map((option) => {
                    const selected = answers[step] === option.value;
                    return (
                      <button
                        type="button"
                        key={option.value}
                        className={`course-quiz-option${selected ? ' course-quiz-option-selected' : ''}`}
                        aria-pressed={selected}
                        onClick={() => selectAnswer(option.value)}
                      >
                        <span className="course-quiz-radio" aria-hidden="true">{selected ? <Check size={14} /> : null}</span>
                        <span className="course-quiz-option-copy">
                          <strong>{option.label}</strong>
                          <small>{option.description}</small>
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="course-quiz-navigation">
                  {step > 0 ? (
                    <button type="button" className="course-quiz-back" onClick={goBack}>
                      <ArrowLeft size={16} /> Back
                    </button>
                  ) : <span />}
                  <button
                    type="button"
                    className="course-quiz-next"
                    disabled={!answers[step]}
                    onClick={() => setStep((current) => current + 1)}
                  >
                    {step === quizSteps.length - 1 ? 'See My Result' : 'Next'}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
