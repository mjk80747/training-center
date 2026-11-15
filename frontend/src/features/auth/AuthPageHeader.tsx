import { ArrowLeft, ArrowRight, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { instituteName } from '../../lib/config';

type AuthPageHeaderProps = {
  actionLabel: string;
  actionTo: string;
  leadingArrow?: boolean;
};

export function AuthPageHeader({ actionLabel, actionTo, leadingArrow = false }: AuthPageHeaderProps) {
  return (
    <header className="auth-page-header">
      <div className="auth-page-brand" aria-label={instituteName}>
        <span className="auth-page-brand-mark"><GraduationCap size={29} aria-hidden="true" /></span>
        <span className="auth-page-brand-copy">
          <strong>KSR</strong>
          <small>IT SOLUTIONS</small>
        </span>
      </div>
      <Link to={actionTo} className="auth-header-action">
        {leadingArrow ? <ArrowLeft size={15} aria-hidden="true" /> : null}
        <span>{actionLabel}</span>
        {!leadingArrow ? <ArrowRight size={15} aria-hidden="true" /> : null}
      </Link>
    </header>
  );
}
