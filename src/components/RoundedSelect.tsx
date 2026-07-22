import React, { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string | number;
  label: string;
}

interface RoundedSelectProps {
  value: string | number;
  onChange: (value: string | number) => void;
  options: Option[];
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

const RoundedSelect: React.FC<RoundedSelectProps> = ({
  value,
  onChange,
  options,
  className = '',
  placeholder = 'Select...',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    width: number;
    flip: boolean;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const selectedIndex = options.findIndex((opt) => opt.value === value);

  // Only one updatePosition (with flip logic)
  const updatePosition = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const dropdownHeight = Math.min(options.length * 40 + 16, 200);
    const flip = spaceBelow < dropdownHeight && spaceAbove > dropdownHeight;

    setPosition({
      top: flip ? rect.top - dropdownHeight : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      flip,
    });
  }, [options.length]);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setFocusedIndex(-1);
  }, []);

  const selectOption = useCallback(
    (opt: Option) => {
      onChange(opt.value);
      closeDropdown();
      buttonRef.current?.focus();
    },
    [onChange, closeDropdown]
  );

  const toggleDropdown = useCallback(() => {
    if (disabled) return;
    if (isOpen) {
      closeDropdown();
    } else {
      updatePosition();
      setIsOpen(true);
      setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }
  }, [isOpen, closeDropdown, updatePosition, disabled, selectedIndex]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleDropdown();
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        if (isOpen) {
          closeDropdown();
          buttonRef.current?.focus();
        }
        return;
      }

      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % options.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + options.length) % options.length);
      } else if (e.key === 'Enter' && focusedIndex >= 0) {
        e.preventDefault();
        selectOption(options[focusedIndex]);
      }
    },
    [isOpen, toggleDropdown, closeDropdown, options, focusedIndex, selectOption, disabled]
  );

  // Only one outside‑click handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const portalEl = document.querySelector('.rounded-select-portal');
      if (portalEl?.contains(event.target as Node)) return;

      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeDropdown]);

  // Only one position‑update effect
  useEffect(() => {
    if (!isOpen) {
      setPosition(null);
      return;
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  // Reset focused index when options change
  useEffect(() => {
    if (isOpen) {
      setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }
  }, [isOpen, options, selectedIndex]);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-disabled={disabled}
        className={`
          w-full flex items-center justify-between px-4 py-2.5
          bg-white border border-gray-200 rounded-xl
          text-sm text-gray-900
          transition-all duration-200
          hover:border-blue-300 hover:shadow-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500
          disabled:opacity-60 disabled:cursor-not-allowed
          ${isOpen ? 'ring-2 ring-blue-500/40 border-blue-500' : ''}
        `}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          className={`
            w-4 h-4 text-gray-400 transition-transform duration-200
            ${isOpen ? 'rotate-180' : ''}
          `}
        />
      </button>

      {isOpen &&
        position &&
        createPortal(
          <div
            ref={listRef}
            className="fixed z-[9999] rounded-select-portal"
            style={{
              top: position.top,
              left: position.left,
              width: position.width,
              minWidth: '120px',
              maxHeight: '200px',
            }}
          >
            <div
              className={`
                bg-white border border-gray-200 rounded-xl shadow-lg
                overflow-y-auto overflow-x-hidden
                py-1
                ${position.flip ? 'shadow-[0_-4px_12px_rgba(0,0,0,0.1)]' : 'shadow-[0_4px_12px_rgba(0,0,0,0.1)]'}
              `}
              style={{ maxHeight: '200px' }}
            >
              {options.length === 0 ? (
                <div className="px-4 py-2.5 text-sm text-gray-400">No options</div>
              ) : (
                options.map((opt, index) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={opt.value === value}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={() => selectOption(opt)}
                    onMouseEnter={() => setFocusedIndex(index)}
                    className={`
                      block w-full text-left px-4 py-2.5 text-sm
                      transition-colors duration-150
                      hover:bg-blue-50
                      truncate
                      ${
                        opt.value === value
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'text-gray-700'
                      }
                      ${focusedIndex === index ? 'bg-blue-50/70' : ''}
                    `}
                  >
                    {opt.label}
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default RoundedSelect;