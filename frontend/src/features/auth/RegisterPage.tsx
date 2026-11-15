import { useState, type ChangeEvent, type FormEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ChevronDown, LockKeyhole, Mail, Phone, School, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import { routes } from '../../routes/paths';
import { apiErrorMessage } from './apiErrorMessage';
import { AuthIntroPanel } from './AuthIntroPanel';
import { AuthPageHeader } from './AuthPageHeader';
import { PasswordField } from './PasswordField';

const branchOptions = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil'];
const yearOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const courseOptions = ['Python Full Stack', 'Java Full Stack', 'Data Analytics', 'Front-End Development'];
const classModeOptions = ['Online', 'Offline', 'Hybrid'];
const preferredSlotOptions = ['6:30 PM - 8:30 PM', '7:00 PM - 9:00 PM', '9:00 AM - 11:00 AM', '2:00 PM - 4:00 PM', '5:00 PM - 7:00 PM'];

type RegistrationForm = {
  fullName: string;
  email: string;
  mobile: string;
  college: string;
  branch: string;
  year: string;
  course: string;
  classMode: string;
  preferredSlot: string;
  password: string;
  confirmPassword: string;
};

type RegistrationFieldErrors = Partial<Record<keyof RegistrationForm, string>>;

const initialForm: RegistrationForm = {
  fullName: '',
  email: '',
  mobile: '',
  college: '',
  branch: '',
  year: '',
  course: '',
  classMode: '',
  preferredSlot: '',
  password: '',
  confirmPassword: '',
};

export function RegisterPage() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<RegistrationForm>(initialForm);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<RegistrationFieldErrors>({});
  const [loading, setLoading] = useState(false);

  function updateField(field: keyof RegistrationForm) {
    return (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
      setFieldErrors((current) => {
        const next = { ...current };
        delete next[field];
        if (field === 'password') {
          delete next.confirmPassword;
        }
        return next;
      });
      setError('');
    };
  }

  function validateStepOne() {
    const errors: RegistrationFieldErrors = {};
    if (!form.fullName.trim()) {
      errors.fullName = 'Enter your full name.';
    }

    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) {
      errors.email = 'Enter a valid email.';
    }

    if (!/^\d{10}$/.test(form.mobile.trim())) {
      errors.mobile = 'Enter a valid 10-digit mobile number.';
    }

    if (!form.college.trim()) {
      errors.college = 'Enter your college name.';
    }

    if (!form.branch) {
      errors.branch = 'Select your branch.';
    }

    if (!form.year) {
      errors.year = 'Select your year.';
    }

    setFieldErrors(errors);
    setError('');
    return Object.keys(errors).length === 0;
  }

  function handleContinue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (validateStepOne()) {
      setFieldErrors({});
      setStep(2);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const errors: RegistrationFieldErrors = {};
    if (!form.course) {
      errors.course = 'Select your course.';
    }

    if (!form.classMode) {
      errors.classMode = 'Select a class mode.';
    }

    if (!form.preferredSlot) {
      errors.preferredSlot = 'Select your preferred slot.';
    }

    if (form.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    }

    if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      await apiClient.post('/auth/register/', {
        full_name: form.fullName.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        password: form.password,
      });
      navigate(routes.verifyEmail, { state: { email: form.email.trim() } });
    } catch (requestError: unknown) {
      setError(apiErrorMessage(requestError, 'Unable to create your account. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="student-auth-page auth-layout-page auth-register-page">
      <AuthPageHeader actionLabel="Already registered? Sign in" actionTo={routes.login} />
      <AuthIntroPanel mode="register" step={step} />
      <section className="student-auth-card auth-form-card auth-register-card">
        <header className="student-auth-header auth-register-heading">
          <span className="auth-register-heading-icon">
            {step === 1 ? <UserRound size={25} aria-hidden="true" /> : <LockKeyhole size={25} aria-hidden="true" />}
          </span>
          <div>
            <h1>{step === 1 ? 'Student Registration' : 'Course & Password'}</h1>
            <p>{step === 1
              ? "Create your student account. You'll need to verify your email before you can sign in."
              : 'Choose your course and set a password for your account.'}</p>
          </div>
        </header>

        <div className="registration-progress-row">
          <div className="registration-progress-track" role="progressbar" aria-label="Registration progress" aria-valuemin={1} aria-valuemax={2} aria-valuenow={step}>
            <span className="registration-progress-fill" style={{ width: step === 1 ? '54%' : '100%' }} />
          </div>
          <span>Step {step} of 2</span>
        </div>

        <h2 className="student-auth-step">{step === 1 ? 'Step 1 · Your Details' : 'Step 2 · Course & Password'}</h2>

        <form onSubmit={step === 1 ? handleContinue : handleSubmit} noValidate data-step={step}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={reduceMotion ? false : { opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduceMotion ? { opacity: 1 } : { opacity: 0, x: -10 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
            {step === 1 ? (
              <>
              <div className="student-auth-field">
                <label htmlFor="fullName">Full name</label>
                <input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={form.fullName}
                  onChange={updateField('fullName')}
                  aria-invalid={Boolean(fieldErrors.fullName)}
                  aria-describedby={fieldErrors.fullName ? 'fullName-error' : undefined}
                />
                {fieldErrors.fullName ? <p id="fullName-error" className="student-field-error">{fieldErrors.fullName}</p> : null}
              </div>

              <div className="student-auth-grid">
                <div className="student-auth-field">
                  <label htmlFor="email"><Mail size={12} aria-hidden="true" /> Email address</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={updateField('email')}
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                  />
                  {fieldErrors.email ? <p id="email-error" className="student-field-error">{fieldErrors.email}</p> : null}
                </div>
                <div className="student-auth-field">
                  <label htmlFor="mobile"><Phone size={12} aria-hidden="true" /> Mobile number</label>
                  <input
                    id="mobile"
                    type="tel"
                    inputMode="numeric"
                    placeholder="Enter mobile number"
                    value={form.mobile}
                    onChange={updateField('mobile')}
                    aria-invalid={Boolean(fieldErrors.mobile)}
                    aria-describedby={fieldErrors.mobile ? 'mobile-error' : undefined}
                  />
                  {fieldErrors.mobile ? <p id="mobile-error" className="student-field-error">{fieldErrors.mobile}</p> : null}
                </div>
              </div>

              <div className="student-auth-field">
                <label htmlFor="college"><School size={12} aria-hidden="true" /> College</label>
                <input
                  id="college"
                  type="text"
                  placeholder="Enter your college name"
                  value={form.college}
                  onChange={updateField('college')}
                  aria-invalid={Boolean(fieldErrors.college)}
                  aria-describedby={fieldErrors.college ? 'college-error' : undefined}
                />
                {fieldErrors.college ? <p id="college-error" className="student-field-error">{fieldErrors.college}</p> : null}
              </div>

              <div className="student-auth-grid">
                <div className="student-auth-field student-auth-select-wrap">
                  <label htmlFor="branch">Branch</label>
                  <select
                    id="branch"
                    value={form.branch}
                    onChange={updateField('branch')}
                    aria-invalid={Boolean(fieldErrors.branch)}
                    aria-describedby={fieldErrors.branch ? 'branch-error' : undefined}
                  >
                    <option value="">Select</option>
                    {branchOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} aria-hidden="true" className="student-auth-select-icon" />
                  {fieldErrors.branch ? <p id="branch-error" className="student-field-error">{fieldErrors.branch}</p> : null}
                </div>

                <div className="student-auth-field student-auth-select-wrap">
                  <label htmlFor="year">Year</label>
                  <select
                    id="year"
                    value={form.year}
                    onChange={updateField('year')}
                    aria-invalid={Boolean(fieldErrors.year)}
                    aria-describedby={fieldErrors.year ? 'year-error' : undefined}
                  >
                    <option value="">Select</option>
                    {yearOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} aria-hidden="true" className="student-auth-select-icon" />
                  {fieldErrors.year ? <p id="year-error" className="student-field-error">{fieldErrors.year}</p> : null}
                </div>
              </div>
              </>
            ) : (
              <>
              <div className="student-auth-grid student-auth-grid-three">
                <div className="student-auth-field student-auth-select-wrap">
                  <label htmlFor="course">Course</label>
                  <select
                    id="course"
                    value={form.course}
                    onChange={updateField('course')}
                    aria-invalid={Boolean(fieldErrors.course)}
                    aria-describedby={fieldErrors.course ? 'course-error' : undefined}
                  >
                    <option value="">Select course</option>
                    {courseOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} aria-hidden="true" className="student-auth-select-icon" />
                  {fieldErrors.course ? <p id="course-error" className="student-field-error">{fieldErrors.course}</p> : null}
                </div>
                <div className="student-auth-field student-auth-select-wrap">
                  <label htmlFor="classMode">Class mode</label>
                  <select
                    id="classMode"
                    value={form.classMode}
                    onChange={updateField('classMode')}
                    aria-invalid={Boolean(fieldErrors.classMode)}
                    aria-describedby={fieldErrors.classMode ? 'classMode-error' : undefined}
                  >
                    <option value="">Select</option>
                    {classModeOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} aria-hidden="true" className="student-auth-select-icon" />
                  {fieldErrors.classMode ? <p id="classMode-error" className="student-field-error">{fieldErrors.classMode}</p> : null}
                </div>

                <div className="student-auth-field student-auth-select-wrap">
                  <label htmlFor="preferredSlot">Preferred slot</label>
                  <select
                    id="preferredSlot"
                    value={form.preferredSlot}
                    onChange={updateField('preferredSlot')}
                    aria-invalid={Boolean(fieldErrors.preferredSlot)}
                    aria-describedby={fieldErrors.preferredSlot ? 'preferredSlot-error' : undefined}
                  >
                    <option value="">Select</option>
                    {preferredSlotOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} aria-hidden="true" className="student-auth-select-icon" />
                  {fieldErrors.preferredSlot ? <p id="preferredSlot-error" className="student-field-error">{fieldErrors.preferredSlot}</p> : null}
                </div>
              </div>

              <PasswordField
                label="Password"
                id="password"
                autoComplete="new-password"
                placeholder=""
                leadingIcon={<LockKeyhole size={17} aria-hidden="true" />}
                value={form.password}
                onChange={updateField('password')}
                minLength={8}
                required
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              />
              {fieldErrors.password ? <p id="password-error" className="student-field-error">{fieldErrors.password}</p> : null}

              <PasswordField
                label="Confirm password"
                id="confirmPassword"
                autoComplete="new-password"
                placeholder=""
                leadingIcon={<LockKeyhole size={17} aria-hidden="true" />}
                value={form.confirmPassword}
                onChange={updateField('confirmPassword')}
                minLength={8}
                required
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
                aria-describedby={fieldErrors.confirmPassword ? 'confirmPassword-error' : undefined}
              />
              {fieldErrors.confirmPassword ? <p id="confirmPassword-error" className="student-field-error">{fieldErrors.confirmPassword}</p> : null}
              </>
            )}
            </motion.div>
          </AnimatePresence>

          {error ? <p className="student-form-error" role="alert">{error}</p> : null}

          <div className="student-auth-action-row">
            {step === 2 ? (
              <button type="button" className="student-auth-back" onClick={() => setStep(1)}>
                ← Back
              </button>
            ) : null}

            <button type="submit" className="student-auth-submit" disabled={loading}>
              {step === 1 ? (
                <>
                  Continue <ArrowRight size={18} />
                </>
              ) : loading ? (
                'Creating account...'
              ) : (
                'Create account'
              )}
            </button>
          </div>
        </form>

      </section>
    </main>
  );
}
