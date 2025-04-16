import { CalendarDays } from 'lucide-react';

interface Operative {
  id: string;
  first_name: string;
  last_name: string | null;
}

interface OperativeScheduleProps {
  operative: Operative;
}

export function OperativeSchedule({ operative }: OperativeScheduleProps) {
  return (
    <div className="flex flex-col items-center justify-center h-96 text-gray-500">
      <CalendarDays className="h-12 w-12 mb-4" />
      <p>Schedule management coming soon</p>
    </div>
  );
}