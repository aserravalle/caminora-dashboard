import { useState, useRef, useEffect } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateTimeInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  help?: string;
  min?: string;
  max?: string;
  className?: string;
}

interface CalendarDate {
  date: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

export function DateTimeInput({
  label,
  value,
  onChange,
  required,
  error,
  help,
  min,
  max,
  className
}: DateTimeInputProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse the current value
  const selectedDate = value ? new Date(value) : null;
  const selectedTime = selectedDate 
    ? `${selectedDate.getHours().toString().padStart(2, '0')}:${selectedDate.getMinutes().toString().padStart(2, '0')}`
    : '00:00';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
        setIsTimeOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateCalendarDates = (): CalendarDate[] => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDayOfMonth = getFirstDayOfMonth(currentMonth);
    const dates: CalendarDate[] = [];

    // Previous month's days
    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
    const daysInPrevMonth = getDaysInMonth(prevMonth);
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      dates.push({
        date: daysInPrevMonth - i,
        month: prevMonth.getMonth(),
        year: prevMonth.getFullYear(),
        isCurrentMonth: false,
        isToday: false,
        isSelected: false
      });
    }

    // Current month's days
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
      dates.push({
        date: i,
        month: currentMonth.getMonth(),
        year: currentMonth.getFullYear(),
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString(),
        isSelected: selectedDate?.toDateString() === date.toDateString()
      });
    }

    // Next month's days
    const remainingDays = 42 - dates.length; // 6 rows * 7 days = 42
    for (let i = 1; i <= remainingDays; i++) {
      dates.push({
        date: i,
        month: (currentMonth.getMonth() + 1) % 12,
        year: currentMonth.getMonth() === 11 ? currentMonth.getFullYear() + 1 : currentMonth.getFullYear(),
        isCurrentMonth: false,
        isToday: false,
        isSelected: false
      });
    }

    return dates;
  };

  // Time helpers
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        options.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    }
    return options;
  };

  const formatTimeForDisplay = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleDateSelect = (date: CalendarDate) => {
    const newDate = new Date(date.year, date.month, date.date);
    if (selectedDate) {
      newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes());
    }
    onChange(newDate.toISOString());
    setIsCalendarOpen(false);
  };

  const handleTimeSelect = (time: string) => {
    const [hours, minutes] = time.split(':');
    const newDate = selectedDate || new Date();
    newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    onChange(newDate.toISOString());
    setIsTimeOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        <div className="grid grid-cols-2 gap-2">
          {/* Date Input */}
          <button
            type="button"
            onClick={() => {
              setIsCalendarOpen(!isCalendarOpen);
              setIsTimeOpen(false);
            }}
            className={cn(
              "flex items-center gap-2 px-3 py-2 border rounded-md text-left text-sm",
              error ? "border-red-300" : "border-gray-300",
              "focus:outline-none focus:ring-2 focus:ring-blue-500"
            )}
          >
            <Calendar className="h-4 w-4 text-gray-400" />
            <span>
              {selectedDate ? selectedDate.toLocaleDateString() : "Select date"}
            </span>
          </button>

          {/* Time Input */}
          <button
            type="button"
            onClick={() => {
              setIsTimeOpen(!isTimeOpen);
              setIsCalendarOpen(false);
            }}
            className={cn(
              "flex items-center gap-2 px-3 py-2 border rounded-md text-left text-sm",
              error ? "border-red-300" : "border-gray-300",
              "focus:outline-none focus:ring-2 focus:ring-blue-500"
            )}
          >
            <Clock className="h-4 w-4 text-gray-400" />
            <span>{selectedDate ? formatTimeForDisplay(selectedTime) : "Select time"}</span>
          </button>
        </div>

        {/* Calendar Dropdown */}
        {isCalendarOpen && (
          <div className="absolute z-10 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="p-2">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="font-semibold">
                  {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className="text-xs font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {generateCalendarDates().map((date, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleDateSelect(date)}
                    className={cn(
                      "h-8 w-8 rounded-full text-sm flex items-center justify-center",
                      date.isCurrentMonth ? "hover:bg-gray-100" : "text-gray-400",
                      date.isSelected && "bg-blue-600 text-white hover:bg-blue-700",
                      date.isToday && !date.isSelected && "border border-blue-600"
                    )}
                  >
                    {date.date}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Time Dropdown */}
        {isTimeOpen && (
          <div className="absolute z-10 mt-1 w-40 max-h-60 overflow-auto bg-white rounded-lg shadow-lg border border-gray-200">
            {generateTimeOptions().map(time => (
              <button
                key={time}
                type="button"
                onClick={() => handleTimeSelect(time)}
                className={cn(
                  "w-full px-4 py-2 text-left text-sm hover:bg-gray-100",
                  time === selectedTime && "bg-blue-600 text-white hover:bg-blue-700"
                )}
              >
                {formatTimeForDisplay(time)}
              </button>
            ))}
          </div>
        )}
      </div>

      {help && !error && (
        <p className="mt-1 text-sm text-gray-500">{help}</p>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}