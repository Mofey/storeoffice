import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const HIDE_DELAY_MS = 3000;

const ScrollToTop: React.FC = () => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const hideTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (hideTimeoutRef.current !== null) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    setIsVisible(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const clearHideTimeout = () => {
      if (hideTimeoutRef.current !== null) {
        window.clearTimeout(hideTimeoutRef.current);
      }
    };

    const scheduleHide = () => {
      clearHideTimeout();
      hideTimeoutRef.current = window.setTimeout(() => {
        setIsVisible(false);
      }, HIDE_DELAY_MS);
    };

    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
        scheduleHide();
      } else {
        clearHideTimeout();
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => {
      clearHideTimeout();
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return isVisible ? (
    <button
      type="button"
      onClick={scrollToTop}
      className="glass-panel fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-[22px] border border-white/60 text-slate-900 transition duration-300 hover:-translate-y-1 hover:border-cyan-300 hover:text-cyan-600 dark:border-white/10 dark:text-slate-100 dark:hover:border-cyan-500 dark:hover:text-cyan-300"
      aria-label="Scroll to top"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  ) : null;
};

export default ScrollToTop;
