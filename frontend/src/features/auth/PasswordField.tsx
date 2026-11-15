import { useId, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { ReactNode } from 'react';

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
  leadingIcon?: ReactNode;
};

export function PasswordField({ label, id, leadingIcon, ...inputProps }: PasswordFieldProps) {
  const generatedId = useId();
  const [isVisible, setIsVisible] = useState(false);
  const inputId = id ?? generatedId;
  const EyeIcon = isVisible ? EyeOff : Eye;

  return (
    <div className="login-field">
      {label ? <label htmlFor={inputId}>{label}</label> : null}
      <div className="password-input-wrap">
        {leadingIcon ? <span className="password-leading-icon">{leadingIcon}</span> : null}
        <input
          {...inputProps}
          id={inputId}
          type={isVisible ? 'text' : 'password'}
          className={`password-input${inputProps.className ? ` ${inputProps.className}` : ''}`}
        />
        <button
          type="button"
          className="password-visibility-toggle"
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          aria-pressed={isVisible}
          onClick={() => setIsVisible((visible) => !visible)}
        >
          <span className="password-toggle-icon">
            <EyeIcon size={18} strokeWidth={1.8} aria-hidden="true" />
          </span>
        </button>
      </div>
    </div>
  );
}
