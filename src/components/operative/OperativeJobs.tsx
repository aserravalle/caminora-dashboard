import { Briefcase } from 'lucide-react';

interface Operative {
  id: string;
  first_name: string;
  last_name: string | null;
}

interface OperativeJobsProps {
  operative: Operative;
}

export function OperativeJobs({ operative }: OperativeJobsProps) {
  return (
    <div className="flex flex-col items-center justify-center h-96 text-gray-500">
      <Briefcase className="h-12 w-12 mb-4" />
      <p>Jobs management coming soon</p>
    </div>
  );
}