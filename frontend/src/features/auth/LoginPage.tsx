import { type FormEvent, useState } from 'react';
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import { instituteName } from '../../lib/config';
import { routes } from '../../routes/paths';
import { setAuthSession } from '../../store/auth';
import { apiErrorMessage } from './apiErrorMessage';
import { AuthIntroPanel } from './AuthIntroPanel';
import { AuthPageHeader } from './AuthPageHeader';
import { PasswordField } from './PasswordField';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as { email?: unknown; verified?: unknown } | null;
  const [email, setEmail] = useState(typeof routeState?.email === 'string' ? routeState.email : '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/auth/login/', { email, password });
      setAuthSession(response.data.user, response.data.access, response.data.refresh);
      const role = response.data.user.role;
      if (role === 'ADMIN' || role === 'COUNSELLOR') navigate('/admin');
      else if (role === 'TRAINER') navigate('/trainer');
      else if (role === 'STUDENT') navigate('/student');
      else navigate('/');
    } catch (requestError: unknown) {
      setError(apiErrorMessage(requestError, 'Unable to sign in. Check your details and try again.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="student-auth-page auth-layout-page auth-login-page">
      <AuthPageHeader actionLabel="Don't have an account? Register" actionTo={routes.register} />
      <AuthIntroPanel mode="login" />
      <div className="student-auth-card login-card auth-form-card">
        <header className="student-auth-header login-header auth-login-heading">
          <span className="auth-login-user-icon"><UserRoundIcon /></span>
          <div>
            <h1>Sign In</h1>
            <p>Email and password to access your account</p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="student-auth-field">
            <label className="auth-visually-hidden" htmlFor="login-email">Email address</label>
            <div className="auth-input-wrap">
              <Mail size={17} aria-hidden="true" />
              <input
                id="login-email"
                type="email"
                autoComplete="username"
                placeholder="Email address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
          </div>

          <PasswordField
            label=""
            id="login-password"
            autoComplete="current-password"
            placeholder="Password"
            leadingIcon={<LockKeyhole size={17} aria-hidden="true" />}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <div className="auth-login-options">
            <label className="auth-remember">
              <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
              <span>Remember me</span>
            </label>
            <Link to={routes.forgotPassword}>Forgot password?</Link>
          </div>

          {routeState?.verified === true ? <p className="student-form-success" role="status">Email verified. You can now sign in.</p> : null}
          {error ? <p className="student-form-error" role="alert">{error}</p> : null}

          <button type="submit" disabled={loading} className="student-auth-submit login-submit-btn">
            {loading ? 'Signing in...' : <>Sign In <ArrowRight size={18} aria-hidden="true" /></>}
          </button>
        </form>

        <div className="student-auth-switch login-switch auth-login-switch">
          New to {instituteName}? <Link to={routes.register}>Register</Link>
        </div>
      </div>
    </main>
  );
}

function UserRoundIcon() {
  return <span className="auth-user-glyph" aria-hidden="true" />;
}
