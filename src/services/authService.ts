export interface DoctorAccount {
  doctorId: string;
  fullName: string;
  email: string;
  password?: string;
  department: string;
  createdAt: string;
  isOnDuty?: boolean;
}

export interface StaffUser {
  doctorId: string;
  fullName: string;
  email: string;
  department: string;
  isOnDuty?: boolean;
}

const SESSION_KEY = 'pulsecheck_staff_session';
const DOCTORS_KEY = 'pulsecheck_registered_doctors';
export const ADMIN_KEY = 'HOSP-PULSE-2026';

export const getRegisteredDoctors = (): DoctorAccount[] => {
  const data = localStorage.getItem(DOCTORS_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  }
  return [];
};

export const getAvailableDoctors = (): DoctorAccount[] => {
  const docs = getRegisteredDoctors();
  if (docs.length > 0) return docs;
  
  // Default on-duty physicians if none registered
  return [
    {
      doctorId: 'DOC-2026-001',
      fullName: 'Dr. Sarah Chen, MD',
      email: 'schen@hospital.org',
      department: 'Emergency Medicine',
      createdAt: new Date().toISOString(),
      isOnDuty: true
    },
    {
      doctorId: 'DOC-2026-002',
      fullName: 'Dr. Rajesh Kumar, MD',
      email: 'rkumar@hospital.org',
      department: 'General Medicine',
      createdAt: new Date().toISOString(),
      isOnDuty: true
    }
  ];
};

export const registerDoctor = (account: Omit<DoctorAccount, 'doctorId' | 'createdAt'>): DoctorAccount => {
  const doctors = getRegisteredDoctors();
  
  if (doctors.some(doc => doc.email.toLowerCase() === account.email.toLowerCase())) {
    throw new Error('Email already exists.');
  }

  const seq = (doctors.length + 1).toString().padStart(3, '0');
  const doctorId = `DOC-2026-${seq}`;
  
  const newDoctor: DoctorAccount = {
    ...account,
    doctorId,
    createdAt: new Date().toISOString(),
    isOnDuty: true
  };

  doctors.push(newDoctor);
  localStorage.setItem(DOCTORS_KEY, JSON.stringify(doctors));
  
  return newDoctor;
};

export const toggleDoctorDutyStatus = (doctorId: string, isOnDuty: boolean): void => {
  const doctors = getRegisteredDoctors();
  const index = doctors.findIndex(d => d.doctorId === doctorId);
  if (index !== -1) {
    doctors[index].isOnDuty = isOnDuty;
    localStorage.setItem(DOCTORS_KEY, JSON.stringify(doctors));
  }
};

export const loginDoctor = (identifier: string, pin: string): StaffUser | null => {
  const doctors = getRegisteredDoctors();
  const lowerId = identifier.toLowerCase();
  
  const doctor = doctors.find(doc => 
    doc.doctorId.toLowerCase() === lowerId || doc.email.toLowerCase() === lowerId
  );

  if (doctor && doctor.password === pin) {
    const user: StaffUser = {
      doctorId: doctor.doctorId,
      fullName: doctor.fullName,
      email: doctor.email,
      department: doctor.department,
      isOnDuty: doctor.isOnDuty !== false // defaults to true if undefined
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
