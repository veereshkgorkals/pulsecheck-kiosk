export interface StaffUser {
  name: string;
  role: string;
  badgeId: string;
}

const SESSION_KEY = 'pulsecheck_staff_session';

export const loginStaff = (badgeId: string, pin: string): StaffUser | null => {
  const isBadgeValid = badgeId === 'DR-7821';
  const isPinValid = pin === '1234' || pin === '9999' || pin === 'pulsecheck2026';

  if (isBadgeValid && isPinValid) {
    const user: StaffUser = {
      name: 'Dr. Sarah Chen, MD',
      role: 'Attending Physician',
      badgeId: 'DR-7821'
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  }
  return null;
};

export const logoutStaff = (): void => {
  sessionStorage.removeItem(SESSION_KEY);
};

export const getAuthenticatedStaff = (): StaffUser | null => {
  const sessionData = sessionStorage.getItem(SESSION_KEY);
  if (sessionData) {
    try {
      return JSON.parse(sessionData);
    } catch (e) {
      return null;
    }
  }
  return null;
};
