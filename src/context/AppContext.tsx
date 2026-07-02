'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import type { School, UserProfile, UserRole } from '@/types';

interface AppContextValue {
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  school: School | null;
  loading: boolean;
  redirectToRoleDashboard: (role?: UserRole) => void;
  refreshProfileAndSchool: (uid: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

const ROLE_ROUTE_MAP: Record<UserRole, string> = {
  admin: '/dashboard/admin',
  teacher: '/dashboard/teacher',
  student: '/dashboard/student',
  parent: '/dashboard/parent',
};

function injectBrandVariables(primaryHex: string, secondaryHex: string) {
  const root = document.documentElement;
  root.style.setProperty('--primary-color', primaryHex);
  root.style.setProperty('--secondary-color', secondaryHex);
}

function resetBrandVariables() {
  const root = document.documentElement;
  root.style.removeProperty('--primary-color');
  root.style.removeProperty('--secondary-color');
}

export function AppProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);

  const redirectToRoleDashboard = useCallback(
    (role?: UserRole) => {
      if (!role) return;
      const route = ROLE_ROUTE_MAP[role];
      router.replace(route);
    },
    [router]
  );

  const refreshProfileAndSchool = useCallback(async (uid: string) => {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error('User profile not found in /users/{uid}.');
    }

    const profile = userSnap.data() as UserProfile;
    setUserProfile(profile);

    const schoolRef = doc(db, 'schools', profile.schoolId);
    const schoolSnap = await getDoc(schoolRef);

    if (!schoolSnap.exists()) {
      throw new Error(`School not found in /schools/${profile.schoolId}.`);
    }

    const schoolData = schoolSnap.data() as Omit<School, 'id'>;
    const resolvedSchool: School = {
      id: schoolSnap.id,
      ...schoolData,
    };

    setSchool(resolvedSchool);
    injectBrandVariables(resolvedSchool.primaryHex, resolvedSchool.secondaryHex);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      try {
        setFirebaseUser(user);

        if (!user) {
          setUserProfile(null);
          setSchool(null);
          resetBrandVariables();
          return;
        }

        await refreshProfileAndSchool(user.uid);
      } catch (error) {
        console.error('AppContext auth bootstrap error:', error);
        setUserProfile(null);
        setSchool(null);
        resetBrandVariables();
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [refreshProfileAndSchool]);

  const value = useMemo<AppContextValue>(
    () => ({
      firebaseUser,
      userProfile,
      school,
      loading,
      redirectToRoleDashboard,
      refreshProfileAndSchool,
    }),
    [firebaseUser, userProfile, school, loading, redirectToRoleDashboard, refreshProfileAndSchool]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider.');
  }
  return context;
}
