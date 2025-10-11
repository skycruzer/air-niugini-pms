'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function ModalSheet({ isOpen, onClose, title, children, size = 'lg' }: ModalSheetProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div
        className={`
          bg-white rounded-2xl shadow-2xl w-full ${sizeClasses[size]}
          max-h-[90vh] overflow-hidden
          animate-in fade-in-0 zoom-in-95 duration-200
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-[#4F46E5] to-[#4338CA]">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <span className="text-2xl mr-3">📝</span>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">{children}</div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
