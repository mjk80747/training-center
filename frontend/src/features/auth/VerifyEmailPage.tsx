import { type ChangeEvent, type ClipboardEvent, type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { CheckCircle2, RefreshCcw } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import { routes } from '../../routes/paths';
import { apiErrorMessage } from './apiErrorMessage';

const OTP_LENGTH = 6;
const CODE_EXPIRY_SECONDS = 10 * 60;
const RESEND_DELAY_SECONDS = 60;

export function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const routeState = location.state as { email?: unknown } | null;
  const initialEmail = typeof routeState?.email === 'string' ? routeState.email : '';
  const [digits, setDigits] = useState<string[]>(Array.from({ length: OTP_LENGTH }, () => ''));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [expiryCountdown, setExpiryCountdown] = useState(CODE_EXPIRY_SECONDS);
  const [resendCountdown, setResendCountdown] = useState(RESEND_DELAY_SECONDS);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setExpiryCountdown((current) => Math.max(current - 1, 0));
      setResendCountdown((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  function updateDigit(index: number, value: string) {
    const clean = value.replace(/\D/g, '').slice(0, 1);
    const nextDigits = [...digits];
    nextDigits[index] = clean;
    setDigits(nextDigits);
    setError('');
    setSuccess('');

    if (clean && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) {
      return;
    }

    const nextDigits = Array.from({ length: OTP_LENGTH }, (_, index) => pasted[index] ?? '');
    setDigits(nextDigits);
    const nextIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputsRef.current[nextIndex]?.focus();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = digits.join('');

    if (!initialEmail) {
      setError('Registration details are missing. Please register again.');
      return;
    }

    if (code.length !== OTP_LENGTH) {
      setError('Please enter the 6-digit code.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    apiClient.post('/auth/verify-email/', { email: initialEmail, code })
      .then(() => {
        setSuccess('Email verified. You can now sign in.');
        window.setTimeout(() => {
          navigate(routes.login, { state: { email: initialEmail, verified: true } });
        }, 900);
      })
      .catch((requestError: unknown) => {
        setError(apiErrorMessage(requestError, 'We could not verify that code. Please check it and try again.'));
      })
      .finally(() => setLoading(false));
  }

  async function handleResend() {
    if (!initialEmail || resendCountdown > 0 || resending) {
      return;
    }

    setError('');
    setSuccess('');
    setResending(true);
    try {
      const response = await apiClient.post('/auth/resend-verification/', { email: initialEmail });
      setSuccess(response.data.detail);
      setDigits(Array.from({ length: OTP_LENGTH }, () => ''));
      setExpiryCountdown(CODE_EXPIRY_SECONDS);
      setResendCountdown(RESEND_DELAY_SECONDS);
      window.setTimeout(() => inputsRef.current[0]?.focus(), 0);
    } catch (requestError: unknown) {
      setError(apiErrorMessage(requestError, 'Unable to send a new verification code right now.'));
    } finally {
      setResending(false);
    }
  }

  const minutes = Math.floor(expiryCountdown / 60);
  const seconds = expiryCountdown % 60;

  return (
    <div className="student-verify-page">
      <div className="student-verify-card">
        <h1>Verify your email</h1>
        <p>Enter the 6-digit code we sent to <strong>{initialEmail || 'your email address'}</strong>.</p>

        <div className="student-verify-email-pill">
          <span className="student-verify-pill-label">EMAIL SENT</span>
          <span className="student-verify-pill-code">Check your inbox for your verification code.</span>
        </div>

        <form onSubmit={handleSubmit} className="student-verify-form">
          <div className="student-verify-otp" aria-label="Verification code input">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputsRef.current[index] = element;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(event: ChangeEvent<HTMLInputElement>) => updateDigit(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                onPaste={handlePaste}
                aria-label={`Digit ${index + 1}`}
              />
            ))}
          </div>

          <button type="submit" className="student-verify-submit" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify email'}
          </button>
        </form>

        <div className="student-verify-meta">
          <span>
            Code expires in {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
          <button
            type="button"
            className="student-verify-resend"
            onClick={() => { void handleResend(); }}
            disabled={!initialEmail || resendCountdown > 0 || resending}
          >
            <RefreshCcw size={14} /> {resending ? 'Sending...' : resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend code'}
          </button>
        </div>

        <p className="student-verify-note">Up to 5 attempts allowed • codes expire after 10 minutes.</p>

        {error ? <p className="student-form-error student-verify-error" role="alert">{error}</p> : null}
        {success ? (
          <div className="student-success-toast" role="status">
            <CheckCircle2 size={22} />
            <span>{success}</span>
          </div>
        ) : null}

        <div className="student-auth-switch student-verify-switch">
          Already registered? <Link to={routes.login}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
