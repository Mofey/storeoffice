import React, { useEffect, useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isProcessing?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isProcessing = false,
  onConfirm,
  onClose,
}) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const timeoutId = window.setTimeout(() => {
        setIsVisible(true);
      }, 20);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }

    setIsVisible(false);
    const timeoutId = window.setTimeout(() => {
      setShouldRender(false);
    }, 220);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isOpen]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 transition-all duration-300"
      style={{
        backgroundColor: isVisible ? 'rgba(15, 23, 42, 0.55)' : 'rgba(15, 23, 42, 0)',
        backdropFilter: isVisible ? 'blur(6px)' : 'blur(0px)',
      }}
    >
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        disabled={isProcessing}
        className="absolute inset-0"
      />
      <div
        className="glass-panel relative w-full max-w-md rounded-[28px] p-6 shadow-[0_28px_80px_-32px_rgba(15,23,42,0.65)]"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0px) scale(1)' : 'translateY(18px) scale(0.94)',
          transition: 'opacity 280ms ease, transform 340ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-950 dark:text-slate-50">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="secondary-button disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={isProcessing}
            className="inline-flex items-center justify-center rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-rose-500 dark:hover:bg-rose-400"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isProcessing ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
