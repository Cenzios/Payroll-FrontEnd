import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string | number;
  label: string;
}

interface RoundedSelectProps {
  value: string | number;
  onChange: (value: any) => void;
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
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recalculate position when dropdown opens or window resizes/scrolls
  useEffect(() => {
    if (!isOpen) {
      setPosition(null);
      return;
    }
    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (rect) {
        setPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all"
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown List – rendered via portal to avoid clipping */}
      {isOpen && position && createPortal(
        <div
          className="fixed z-[999] bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto overflow-x-hidden whitespace-nowrap"
          style={{
            top: position.top,
            left: position.left,
            width: position.width,
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent outside-click from closing before selection
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors ${
                opt.value === value ? 'bg-blue-100 text-blue-600 font-semibold' : 'text-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

export default RoundedSelect;