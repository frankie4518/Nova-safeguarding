import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import type { FirebaseError } from 'firebase/app';

export function isFirebasePermissionError(err: unknown) {
  if (!err) return false;
  const e = err as FirebaseError | { code?: string; message?: string };
  return e?.code === 'permission-denied' || (e?.message || '').toLowerCase().includes('permission');
}

export function formatFirebaseError(err: unknown) {
  if (!err) return 'Unknown error';
  const e = err as FirebaseError | { code?: string; message?: string };
  if (isFirebasePermissionError(e)) return 'Permission denied. You do not have access to perform this action.';
  if (e?.code) return `${e.code}: ${e.message || 'An error occurred'}`;
  return (e?.message as string) || String(e);
}
