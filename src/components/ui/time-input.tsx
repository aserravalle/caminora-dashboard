import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface TimeInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
  error?: string;
}

export function TimeInput({
  label,
  name,
  value,
  onChange,
  className,
  required,
  error
}: TimeInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const selectedOptionRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll to selected time when dropdown opens
  useEffect(() => {
    if (isOpen && selectedOptionRef.current) {
      selectedOptionRef.current.scrollIntoView({
        block: 'center',
        behavior: 'auto'
      });
    }
  }, [isOpen]);

  // Convert 24h time to 12h format for display
  const formatTimeForDisplay = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Generate time options in 30-minute intervals
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(timeString);
      }
    }
    return options;
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          type="time"
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="hidden"
        />
        <button
          ref={buttonRef}
          type="button"
          className={cn(
            "relative w-full rounded-md border bg-white px-3 py-2 text-left text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600",
            error ? "border-red-300" : "border-gray-200"
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="flex items-center">
            <Clock className="mr-2 h-4 w-4 text-gray-400" />
            {formatTimeForDisplay(value) || 'Select time'}
          </span>
        </button>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
          >
            {generateTimeOptions().map((timeOption) => (
              <button
                key={timeOption}
                ref={timeOption === value ? selectedOptionRef : null}
                type="button"
                className={cn(
                  'relative w-full cursor-pointer select-none py-2 pl-3 pr-9 text-left hover:bg-gray-50',
                  timeOption === value ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                )}
                onClick={() => {
                  onChange(timeOption);
                  setIsOpen(false);
                }}
              >
                {formatTimeForDisplay(timeOption)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}