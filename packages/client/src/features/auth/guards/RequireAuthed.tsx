import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RequireAuthed({ children }: { children: ReactNode }) {
  const { isConfigured, session, loading } = useAuth();
  if (loading) return null;
  if (!isConfigured) return <Navigate to="/library" replace />;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
