'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  duration?: number;
  onDismiss: () => void;
}

export default function Toast({ message, duration = 4000, onDismiss }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const showTimeout = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    // Set up auto-dismiss
    const dismissTimeout = setTimeout(() => {
      setIsVisible(false);
      // Wait for exit animation before calling onDismiss
      setTimeout(onDismiss, 300);
    }, duration);

    return () => {
      clearTimeout(showTimeout);
      clearTimeout(dismissTimeout);
    };
  }, [duration, onDismiss]);

  return (
    <div
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-4'
      }`}
    >
      <div className="bg-slate-800 text-white px-6 py-3 rounded-lg shadow-lg max-w-md text-center">
        {message}
      </div>
    </div>
  );
}