import React from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';

const SessionRestoreSplash: React.FC = () => (
  <div className="section-shell flex min-h-screen items-center justify-center py-10">
    <div className="glass-panel w-full max-w-xl rounded-[36px] px-8 py-12 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-950 text-white dark:bg-cyan-400 dark:text-slate-950">
        <ShieldCheck className="h-8 w-8" />
      </div>
      <h1 className="mt-6 text-3xl font-bold text-slate-950 dark:text-slate-50">Restoring your admin session</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-600 dark:text-slate-400">
        We&apos;re checking your secure session so the workspace opens in the right state.
      </p>
      <div className="mt-8 inline-flex items-center gap-3 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
        <Loader2 className="h-4 w-4 animate-spin text-cyan-500" />
        One moment...
      </div>
    </div>
  </div>
);

export default SessionRestoreSplash;
