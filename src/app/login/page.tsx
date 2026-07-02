'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAppContext } from '@/context/AppContext';

type InstitutionOption = {
  id: string;
  name: string;
};

const INSTITUTIONS: InstitutionOption[] = [
  { id: 'northbridge-academy', name: 'Northbridge Academy' },
  { id: 'summit-international', name: 'Summit International School' },
  { id: 'evergreen-collegiate', name: 'Evergreen Collegiate Institute' },
  { id: 'astral-public-school', name: 'Astral Public School' },
  { id: 'regent-ib-campus', name: 'Regent IB Campus' },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const { userProfile, loading, redirectToRoleDashboard } = useAppContext();

  const [institutionQuery, setInstitutionQuery] = useState('');
  const [selectedInstitution, setSelectedInstitution] = useState<InstitutionOption | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const filteredInstitutions = useMemo(() => {
    const q = institutionQuery.trim().toLowerCase();
    if (!q) return INSTITUTIONS;
    return INSTITUTIONS.filter((s) => s.name.toLowerCase().includes(q));
  }, [institutionQuery]);

  useEffect(() => {
    if (!loading && userProfile?.role) {
      redirectToRoleDashboard(userProfile.role);
    }
  }, [loading, userProfile, redirectToRoleDashboard]);

  const validate = () => {
    if (!selectedInstitution) return 'Please select your institution.';
    if (!EMAIL_REGEX.test(email.trim())) return 'Please enter a valid email address.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    return '';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const validationError = validate();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setSubmitting(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to sign in. Please try again.';
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-10">
        <div className="grid w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl md:grid-cols-2">
          <div className="hidden bg-gradient-to-br from-slate-900 to-slate-700 p-10 text-white md:block">
            <p className="mb-4 text-sm uppercase tracking-widest text-slate-300">Edusync</p>
            <h1 className="text-3xl font-bold leading-tight">Institutional Access Gateway</h1>
            <p className="mt-5 text-slate-200">
              Secure, white-label, multi-tenant education operations platform for premium schools.
            </p>
          </div>

          <div className="p-6 sm:p-10">
            <h2 className="text-2xl font-semibold text-slate-900">Sign in to your workspace</h2>
            <p className="mt-2 text-sm text-slate-600">
              Select institution and continue with your official credentials.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Institution Search</label>
                <input
                  type="text"
                  value={institutionQuery}
                  onChange={(e) => setInstitutionQuery(e.target.value)}
                  placeholder="Search institution..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none ring-0 transition focus:border-[var(--primary-color)] focus:shadow-sm"
                />
                <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-slate-200">
                  {filteredInstitutions.map((institution) => (
                    <button
                      key={institution.id}
                      type="button"
                      onClick={() => setSelectedInstitution(institution)}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                        selectedInstitution?.id === institution.id ? 'bg-slate-100 font-medium' : ''
                      }`}
                    >
                      <span>{institution.name}</span>
                      {selectedInstitution?.id === institution.id && (
                        <span className="text-xs text-slate-500">Selected</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                  Official Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@institution.edu"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[var(--primary-color)]"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[var(--primary-color)]"
                  required
                />
              </div>

              {errorMessage && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: 'var(--primary-color, #0f172a)' }}
              >
                {submitting ? 'Signing in...' : 'Secure Sign In'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
