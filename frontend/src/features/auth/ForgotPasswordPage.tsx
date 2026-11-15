import { type ClipboardEvent, type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, LockKeyhole, Mail, RefreshCcw, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import { routes } from '../../routes/paths';
import { apiErrorMessage } from './apiErrorMessage';
import { AuthIntroPanel } from './AuthIntroPanel';
import { AuthPageHeader } from './AuthPageHeader';
import { PasswordField } from './PasswordField';

const OTP_LENGTH = 6;
const RESEND_DELAY_SECONDS = 60;

type ResetStep = 'email' | 'code' | 'complete';

export function ForgotPasswordPage() {
  const [step, setStep] = useState<ResetStep>('email');
  const [email, setEmail] = useState('');
  const [codeDigits, setCodeDigits] = useState<string[]>(Array.from({ length: OTP_LENGTH }, () => ''));
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const otpInputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (resendCountdown <= 0) return undefined;
    const timer = window.setTimeout(() => setResendCountdown((current) => Math.max(current - 1, 0)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCountdown]);

  function updateDigit(index: number, value: string) {
    const digits = value.replace(/\D/g, '');
    if (digits.length > 1) {
      const next = Array.from({ length: OTP_LENGTH }, (_, digitIndex) => digits[digitIndex] ?? '');
      setCodeDigits(next);
      otpInputs.current[Math.min(digits.length, OTP_LENGTH) - 1]?.focus();
    } else {
      const next = [...codeDigits];
      next[index] = digits;
      setCodeDigits(next);
      if (digits && index < OTP_LENGTH - 1) {
        otpInputs.current[index + 1]?.focus();
      }
    }
    setError('');
  }

  function handleOtpKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !codeDigits[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!digits) return;
    setCodeDigits(Array.from({ length: OTP_LENGTH }, (_, index) => digits[index] ?? ''));
    otpInputs.current[Math.min(digits.length, OTP_LENGTH) - 1]?.focus();
    setError('');
  }

  async function handleRequestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/auth/password/forgot/', { email: email.trim() });
      setMessage(response.data.detail);
      setCodeDigits(Array.from({ length: OTP_LENGTH }, () => ''));
      setResendCountdown(RESEND_DELAY_SECONDS);
      setStep('code');
      window.setTimeout(() => otpInputs.current[0]?.focus(), 0);
    } catch (requestError: unknown) {
      setError(apiErrorMessage(requestError, 'Unable to send a reset code right now. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    const code = codeDigits.join('');

    if (code.length !== OTP_LENGTH) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    if (password.length < 8) {
      setError('Your new password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/auth/password/reset/', {
        email: email.trim(),
        code,
        password,
      });
      setMessage(response.data.detail);
      setStep('complete');
    } catch (requestError: unknown) {
      setError(apiErrorMessage(requestError, 'We could not reset your password. Check the code and try again.'));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCountdown > 0 || resending) return;
    setError('');
    setMessage('');
    setResending(true);
    try {
      const response = await apiClient.post('/auth/password/forgot/', { email: email.trim() });
      setMessage(response.data.detail);
      setCodeDigits(Array.from({ length: OTP_LENGTH }, () => ''));
      setResendCountdown(RESEND_DELAY_SECONDS);
      window.setTimeout(() => otpInputs.current[0]?.focus(), 0);
    } catch (requestError: unknown) {
      setError(apiErrorMessage(requestError, 'Unable to resend the code right now. Please try again.'));
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="student-auth-page auth-layout-page auth-forgot-page">
      <AuthPageHeader actionLabel="Back to sign in" actionTo={routes.login} leadingArrow />
      <AuthIntroPanel mode="forgot" />
      <section className="student-auth-card password-reset-card auth-form-card" aria-labelledby="password-reset-heading">
        {step === 'email' ? (
          <>
            <header className="student-auth-header auth-reset-heading">
              <span className="auth-reset-icon"><Send size={25} aria-hidden="true" /></span>
              <h1 id="password-reset-heading">Reset Your Password</h1>
              <p>Enter your email address and we’ll send you a reset code.</p>
            </header>
            <form className="password-reset-form auth-forgot-form" onSubmit={handleRequestCode} noValidate>
              <div className="student-auth-field">
                <label className="auth-visually-hidden" htmlFor="reset-email">Email address</label>
                <div className="auth-input-wrap">
                  <Mail size={17} aria-hidden="true" />
                  <input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setError('');
                    }}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? 'reset-error' : undefined}
                  />
                </div>
              </div>
              {error ? <p id="reset-error" className="student-field-error" role="alert">{error}</p> : null}
              <button type="submit" className="student-auth-submit password-reset-submit" disabled={loading}>
                {loading ? 'Sending code...' : <>Send reset code <ArrowRight size={18} aria-hidden="true" /></>}
              </button>
            </form>
            <div className="auth-divider"><span />or<span /></div>
            <div className="student-auth-switch password-reset-switch auth-reset-switch">
              <Link to={routes.login}><ArrowLeft size={15} aria-hidden="true" /> Back to sign in</Link>
            </div>
          </>
        ) : null}

        {step === 'code' ? (
          <>
            <header className="student-auth-header">
              <h1 id="password-reset-heading">Reset your password</h1>
              <p>Enter the code sent to <strong>{email}</strong>, then choose a new password.</p>
            </header>
            <p className="password-reset-info" role="status">
              {message || 'If an account exists for that email, a password reset code has been sent.'}
            </p>
            <form className="password-reset-form" onSubmit={handleResetPassword} noValidate>
              <fieldset className="password-reset-code">
                <legend>Email verification code</legend>
                <div className="student-verify-otp">
                  {codeDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(element) => { otpInputs.current[index] = element; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(event) => updateDigit(index, event.target.value)}
                      onKeyDown={(event) => handleOtpKeyDown(index, event)}
                      onPaste={handleOtpPaste}
                      aria-label={`Code digit ${index + 1}`}
                    />
                  ))}
                </div>
              </fieldset>
              <PasswordField
                label="New password"
                id="new-password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError('');
                }}
                leadingIcon={<LockKeyhole size={17} aria-hidden="true" />}
                minLength={8}
                required
              />
              <PasswordField
                label="Confirm new password"
                id="confirm-new-password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setError('');
                }}
                leadingIcon={<LockKeyhole size={17} aria-hidden="true" />}
                minLength={8}
                required
              />
              {error ? <p className="student-field-error" role="alert">{error}</p> : null}
              <button type="submit" className="student-auth-submit password-reset-submit" disabled={loading}>
                {loading ? 'Updating password...' : <>Create new password <ArrowRight size={18} aria-hidden="true" /></>}
              </button>
            </form>
            <div className="password-reset-actions">
              <button type="button" className="student-verify-resend" onClick={() => { void handleResend(); }} disabled={resendCountdown > 0 || resending}>
                <RefreshCcw size={14} aria-hidden="true" />
                {resending ? 'Sending...' : resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : 'Resend code'}
              </button>
              <button type="button" className="password-reset-link-button" onClick={() => {
                setStep('email');
                setError('');
                setMessage('');
              }}>
                Change email
              </button>
            </div>
          </>
        ) : null}

        {step === 'complete' ? (
          <div className="password-reset-complete">
            <span className="password-reset-success-icon"><CheckCircle2 size={26} aria-hidden="true" /></span>
            <h1 id="password-reset-heading">Password updated</h1>
            <p>Your password has been changed. You can now sign in with your new password.</p>
            <Link to={routes.login} state={{ email }} className="student-auth-submit password-reset-submit">
              Back to sign in <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}
