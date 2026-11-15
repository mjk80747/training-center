import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { getAuthSession } from '../store/auth';

const roleLabels = {
  ADMIN: 'Administrator',
  COUNSELLOR: 'Counsellor',
  TRAINER: 'Trainer',
  STUDENT: 'Student',
};

export function AdminHeaderControls() {
  const user = getAuthSession();
  const [profileOpen, setProfileOpen] = useState(false);
  const displayName = user?.full_name || user?.email || 'Account';
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
  const roleLabel = user ? roleLabels[user.role] : 'Workspace';

  return (
    <div className="admin-header-controls">
      <div className="admin-header-control">
        <button
          type="button"
          className="top-user"
          aria-expanded={profileOpen}
          aria-label={`Account menu for ${displayName}`}
          onClick={() => setProfileOpen((open) => !open)}
        >
          <span className="avatar avatar-indigo">{initials || 'U'}</span>
          <span className="top-user-copy"><strong>{displayName}</strong><small>{roleLabel}</small></span>
          <ChevronDown size={15} aria-hidden="true" />
        </button>
        {profileOpen ? (
          <div className="admin-header-popover admin-profile-popover" role="dialog" aria-label="Account menu">
            <div className="admin-profile-summary">
              <span className="avatar avatar-indigo">{initials || 'U'}</span>
              <span><strong>{displayName}</strong><small>{user?.email}</small><small>{roleLabel}</small></span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
