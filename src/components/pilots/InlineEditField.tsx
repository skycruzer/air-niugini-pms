'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface InlineEditFieldProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  onCancel?: () => void;
  type?: 'text' | 'email' | 'date' | 'select';
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  validate?: (value: string) => string | null; // Returns error message or null
  className?: string;
  editClassName?: string;
  displayClassName?: string;
  debounceMs?: number;
  allowEmpty?: boolean;
}

export function InlineEditField({
  value: initialValue,
  onSave,
  onCancel,
  type = 'text',
  options = [],
  placeholder = 'Click to edit',
  required = false,
  maxLength,
  minLength,
  pattern,
  validate,
  className = '',
  editClassName = '',
  displayClassName = '',
  debounceMs = 500,
  allowEmpty = false,
}: InlineEditFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showUndo, setShowUndo] = useState(false);
  const [previousValue, setPreviousValue] = useState(initialValue);

  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const undoTimeoutRef = useRef<NodeJS.Timeout>();

  // Update value when prop changes
  useEffect(() => {
    setValue(initialValue);
    setPreviousValue(initialValue);
  }, [initialValue]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEditing) return;

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        handleCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, value]);

  const validateValue = (val: string): string | null => {
    if (required && !val && !allowEmpty) {
      return 'This field is required';
    }

    if (minLength && val.length < minLength) {
      return `Minimum ${minLength} characters required`;
    }

    if (maxLength && val.length > maxLength) {
      return `Maximum ${maxLength} characters allowed`;
    }

    if (pattern && !new RegExp(pattern).test(val)) {
      return 'Invalid format';
    }

    if (validate) {
      return validate(val);
    }

    return null;
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setValue(previousValue);
    setError(null);
    setIsEditing(false);
    onCancel?.();
  };

  const handleSave = async () => {
    const trimmedValue = value.trim();

    // Validation
    const validationError = validateValue(trimmedValue);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Skip save if value hasn't changed
    if (trimmedValue === previousValue) {
      setIsEditing(false);
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      await onSave(trimmedValue);

      // Success - update previous value and exit edit mode
      setPreviousValue(trimmedValue);
      setIsEditing(false);

      // Show undo option
      setShowUndo(true);
      undoTimeoutRef.current = setTimeout(() => {
        setShowUndo(false);
      }, 5000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUndo = async () => {
    try {
      setIsSaving(true);
      await onSave(previousValue);
      setValue(previousValue);
      setShowUndo(false);
    } catch (err) {
      console.error('Failed to undo:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save with debounce
  const handleChange = (newValue: string) => {
    setValue(newValue);
    setError(null);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Optional: Auto-save after debounce period
    if (debounceMs > 0) {
      saveTimeoutRef.current = setTimeout(() => {
        handleSave();
      }, debounceMs);
    }
  };

  const displayValue = value || placeholder;

  return (
    <div className={`relative inline-block w-full ${className}`}>
      {!isEditing ? (
        // Display Mode
        <button
          onClick={handleStartEdit}
          className={`
            w-full text-left px-3 py-2 rounded-lg border border-transparent
            hover:border-gray-300 hover:bg-gray-50 transition-colors
            ${!value ? 'text-gray-400 italic' : 'text-gray-900'}
            ${displayClassName}
          `}
          title="Click to edit"
        >
          {displayValue}
        </button>
      ) : (
        // Edit Mode
        <div className="relative">
          {type === 'select' ? (
            <select
              ref={inputRef as React.RefObject<HTMLSelectElement>}
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              className={`
                w-full px-3 py-2 border rounded-lg
                focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B]
                ${error ? 'border-red-500' : 'border-gray-300'}
                ${editClassName}
              `}
              disabled={isSaving}
            >
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type={type}
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={handleSave}
              placeholder={placeholder}
              maxLength={maxLength}
              className={`
                w-full px-3 py-2 border rounded-lg
                focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B]
                ${error ? 'border-red-500' : 'border-gray-300'}
                ${editClassName}
              `}
              disabled={isSaving}
            />
          )}

          {/* Action Buttons */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-[#E4002B] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                  title="Save (Enter)"
                  disabled={isSaving}
                >
                  <span className="text-lg">✓</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Cancel (Esc)"
                  disabled={isSaving}
                >
                  <span className="text-lg">✕</span>
                </button>
              </>
            )}
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute left-0 top-full mt-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Undo Toast */}
      <AnimatePresence>
        {showUndo && !isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute left-0 top-full mt-2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg flex items-center space-x-2 z-10"
          >
            <span>✓ Saved</span>
            <button
              onClick={handleUndo}
              className="px-2 py-1 bg-white bg-opacity-20 rounded hover:bg-opacity-30 transition-colors"
              disabled={isSaving}
            >
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Specialized variants for common use cases

export function InlineEditText(props: Omit<InlineEditFieldProps, 'type'>) {
  return <InlineEditField {...props} type="text" />;
}

export function InlineEditEmail(props: Omit<InlineEditFieldProps, 'type' | 'pattern'>) {
  return (
    <InlineEditField
      {...props}
      type="email"
      pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
      validate={(value) => {
        if (value && !value.includes('@')) {
          return 'Please enter a valid email address';
        }
        return null;
      }}
    />
  );
}

export function InlineEditDate(props: Omit<InlineEditFieldProps, 'type'>) {
  return <InlineEditField {...props} type="date" />;
}

export function InlineEditSelect(
  props: Omit<InlineEditFieldProps, 'type'> & { options: Array<{ value: string; label: string }> }
) {
  return <InlineEditField {...props} type="select" />;
}
