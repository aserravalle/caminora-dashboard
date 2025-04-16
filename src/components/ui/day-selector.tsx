import { cn } from '@/lib/utils';

interface DaySelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const DAYS = [
  { label: 'Mon', index: 0 },
  { label: 'Tue', index: 1 },
  { label: 'Wed', index: 2 },
  { label: 'Thu', index: 3 },
  { label: 'Fri', index: 4 },
  { label: 'Sat', index: 5 },
  { label: 'Sun', index: 6 },
];

export function DaySelector({ value, onChange, className }: DaySelectorProps) {
  const toggleDay = (index: number) => {
    const newValue = value.split('');
    newValue[index] = newValue[index] === '1' ? '0' : '1';
    onChange(newValue.join(''));
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Working Days
      </label>
      <div className="flex gap-3 justify-between">
        {DAYS.map((day) => (
          <button
            key={day.label}
            type="button"
            onClick={() => toggleDay(day.index)}
            className={cn(
              'flex items-center justify-center w-12 h-12 rounded-md text-sm font-medium transition-colors',
              value[day.index] === '1'
                ? 'bg-blue-600 text-white hover:bg-blue-500'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            )}
          >
            {day.label}
          </button>
        ))}
      </div>
    </div>
  );
}