import React, { useState, useRef, useEffect, useCallback } from 'react';
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
}

const RoundedSelect: React.FC<RoundedSelectProps> = ({
  value,
  onChange,
  options,
  className = '',
  placeholder = 'Select...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown when clicking outside (but not on portal content)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is inside the portal container (the dropdown list)
      const portalEl = document.querySelector('.rounded-select-portal');
      if (portalEl && portalEl.contains(event.target as Node)) {
        return; // Don't close if clicking inside the portal
      }

      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate dropdown position
  const updatePosition = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    setPosition({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  // Update position when opened
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

  const handleToggle = () => {
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen((prev) => !prev);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all"
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen &&
        position &&
        createPortal(
          <div
            className="fixed z-[9999] bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto overflow-x-hidden whitespace-nowrap rounded-select-portal"
            style={{
              top: position.top,
              left: position.left,
              width: position.width,
              minWidth: '120px',
            }}
          >
            {options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-400">
                No options available
              </div>
            ) : (
              options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent outside-click from closing
                    e.stopPropagation(); // Stop event from bubbling
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`block w-full text-left px-3 py-2 text-sm transition-colors hover:bg-blue-50 ${
                    opt.value === value
                      ? 'bg-blue-100 text-blue-600 font-semibold'
                      : 'text-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>,
          document.body
        )}
    </div>
  );
};

export default RoundedSelect;