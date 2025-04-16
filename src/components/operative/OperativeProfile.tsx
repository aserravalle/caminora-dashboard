import { useState } from 'react';
import { EditOperativeDialog } from './EditOperativeDialog';

interface Operative {
  id: string;
  organisation_id: string;
  operative_number: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  location: { name: string } | null;
  operative_type: { name: string } | null;
  default_start_time: string;
  default_end_time: string;
  default_days_available: string;
}

interface OperativeProfileProps {
  operative: Operative;
  onUpdate: (operative: Operative) => void;
}

export function OperativeProfile({ operative, onUpdate }: OperativeProfileProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Convert 24h time to 12h format for display
  const formatTimeForDisplay = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Convert binary string to day names
  const formatDaysAvailable = (days: string) => {
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days
      .split('')
      .map((day, index) => (day === '1' ? dayNames[index] : null))
      .filter(Boolean)
      .join(', ');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsEditDialogOpen(true)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Edit Profile
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">First Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{operative.first_name}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Last Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{operative.last_name || '-'}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{operative.email || '-'}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="mt-1 text-sm text-gray-900">{operative.phone || '-'}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Location</dt>
              <dd className="mt-1 text-sm text-gray-900">{operative.location?.name || '-'}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Operative Type</dt>
              <dd className="mt-1 text-sm text-gray-900">{operative.operative_type?.name || '-'}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Working Days</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatDaysAvailable(operative.default_days_available)}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Working Hours</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatTimeForDisplay(operative.default_start_time)} - {formatTimeForDisplay(operative.default_end_time)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <EditOperativeDialog
        operative={operative}
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onUpdate={onUpdate}
      />
    </div>
  );
}