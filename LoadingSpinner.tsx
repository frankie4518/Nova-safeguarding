"use client";

import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ size = 20 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center p-4">
      <Loader2 className="animate-spin text-stone-500" size={size} />
    </div>
  );
}
