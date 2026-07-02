export type Curriculum = 'IB' | 'NEB' | 'CBSE';
export type UserRole = 'admin' | 'teacher' | 'student' | 'parent';

export interface School {
  id: string;
  name: string;
  primaryHex: string;
  secondaryHex: string;
  logoUrl: string;
  curriculum: Curriculum;
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  schoolId: string;
}

export interface PeriodSchedule {
  periodNumber: number;
  name: string;
  startTime: string;
  endTime: string;
}
