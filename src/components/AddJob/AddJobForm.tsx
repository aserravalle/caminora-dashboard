import { useState, useEffect } from 'react';
import { Clock, Building2, Users } from 'lucide-react';
import { Input } from '../ui/input';
import { LocationSelect } from '../ui/location-select';
import { OperativeTypeSelect } from '../ui/operative-type-select';
import { ClientSelect } from '../ui/client-select';
import { OperativeSelect } from '../ui/operative-select';
import { DateTimeInput } from '../ui/date-time-input';
import { CollapsibleSection } from '../ui/collapsible-section';
import { AddClientForm } from '../AddClient/AddClientForm';

interface AddJobFormProps {
  organisationId: string;
  onSubmit: (jobs: any[]) => void;
  disabled?: boolean;
  defaultLocation?: { id: string; name: string } | null;
}

interface FormErrors {
  entry_time?: string;
  exit_time?: string;
  duration_min?: string;
  location?: string;
  client?: string;
  start_time?: string;
}

interface ValidationState {
  message: string;
  type: 'error' | 'warning' | 'success';
}

export function AddJobForm({
  organisationId,
  onSubmit,
  disabled,
  defaultLocation
}: AddJobFormProps) {
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [newLocation, setNewLocation] = useState<{ id: string; name: string } | null>(defaultLocation || null);
  const [newOperativeType, setNewOperativeType] = useState<{ id: string; name: string } | null>(null);
  const [newClient, setNewClient] = useState<{ id: string; name: string } | null>(null);
  const [newOperative, setNewOperative] = useState<{ id: string; name: string } | null>(null);
  const [entryTime, setEntryTime] = useState<string>('');
  const [exitTime, setExitTime] = useState<string>('');
  const [duration, setDuration] = useState<number>(0);
  const [startTime, setStartTime] = useState<string>('');
  const [durationValidation, setDurationValidation] = useState<ValidationState | null>(null);
  const [isAddingClient, setIsAddingClient] = useState(false);

  useEffect(() => {
    validateTimeAndDuration();
  }, [entryTime, exitTime, duration]);

  const validateTimeAndDuration = () => {
    const errors: FormErrors = {};
    let validationState: ValidationState | null = null;

    if (entryTime && exitTime) {
      const entry = new Date(entryTime);
      const exit = new Date(exitTime);
      const availabilityMin = (exit.getTime() - entry.getTime()) / (1000 * 60);

      if (availabilityMin <= 0) {
        errors.exit_time = 'Exit time must be after entry time';
      } else {
        const durationMin = duration * 60;

        if (durationMin > availabilityMin) {
          validationState = {
            message: 'Estimated duration exceeds available time window',
            type: 'error'
          };
        } else if (durationMin * 1.25 > availabilityMin) {
          validationState = {
            message: 'Limited availability for this duration',
            type: 'warning'
          };
        } else {
          validationState = {
            message: 'Duration fits comfortably within the time window',
            type: 'success'
          };
        }

        if (startTime) {
          const start = new Date(startTime);
          if (start < entry || start > exit) {
            errors.start_time = 'Start time must be between entry and exit time';
          }
        }
      }
    }

    setFormErrors(errors);
    setDurationValidation(validationState);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors: FormErrors = {};

    if (!entryTime) errors.entry_time = 'Entry time is required';
    if (!exitTime) errors.exit_time = 'Exit time is required';
    if (!duration) errors.duration_min = 'Duration is required';
    if (!newLocation?.id && !newLocation?.name) errors.location = 'Location is required';
    if (!newClient?.id && !newClient?.name) errors.client = 'Client is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const durationMin = Math.round(duration * 60);

    const jobData = {
      organisation_id: organisationId,
      entry_time: entryTime,
      exit_time: exitTime,
      duration_min: durationMin,
      start_time: startTime || null,
      location_id: newLocation?.id,
      location: newLocation?.name,
      operative_type_id: newOperativeType?.id,
      operative_type: newOperativeType?.name,
      client_id: newClient?.id,
      client: newClient?.name,
      operative_id: newOperative?.id,
      operative: newOperative ? `${newOperative.name}` : null,
    };

    onSubmit([jobData]);
  };

  const handleClientCreated = (clients: any[]) => {
    if (clients.length > 0) {
      const client = clients[0];
      setNewClient({ id: client.id, name: client.name });
      setIsAddingClient(false);
    }
  };

  return (
    <form id="add-child-form" onSubmit={handleSubmit} className="space-y-6">
      <CollapsibleSection 
        title="Job Details" 
        icon={<Clock className="h-6 w-6 text-gray-400" />}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <DateTimeInput
              label="Entry Time"
              value={entryTime}
              onChange={setEntryTime}
              required
              error={formErrors.entry_time}
              help="The earliest time the client is available for service"
            />

            <DateTimeInput
              label="Exit Time"
              value={exitTime}
              onChange={setExitTime}
              required
              error={formErrors.exit_time}
              help="The latest time by which the job must be completed"
            />
          </div>

          {entryTime && exitTime && (
            <div className="text-sm text-gray-500">
              Time window: {calculateTimeWindow(entryTime, exitTime)}
            </div>
          )}

          <Input
            type="number"
            label="Estimated Duration (hours)"
            value={duration || ''}
            onChange={(e) => setDuration(parseFloat(e.target.value))}
            required
            min={0}
            step={0.5}
            error={formErrors.duration_min}
            help="How long the job is expected to take"
          />

          {durationValidation && (
            <div className={`text-sm ${getDurationValidationColor(durationValidation.type)}`}>
              {durationValidation.message}
            </div>
          )}

          <LocationSelect
            value={newLocation?.id || ''}
            organisationId={organisationId}
            onChange={(id, name) => setNewLocation({ id, name })}
            error={formErrors.location}
          />

          <OperativeTypeSelect
            value={newOperativeType?.id || ''}
            organisationId={organisationId}
            onChange={(id, name) => setNewOperativeType({ id, name })}
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection 
        title="Client Information" 
        icon={<Building2 className="h-6 w-6 text-gray-400" />}
      >
        {!isAddingClient ? (
          <div className="space-y-4">
            <ClientSelect
              value={newClient?.id || ''}
              organisationId={organisationId}
              onChange={(id, name) => setNewClient({ id, name })}
              error={formErrors.client}
            />
            
            <button
              type="button"
              onClick={() => setIsAddingClient(true)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              + Add New Client
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <AddClientForm
              organisationId={organisationId}
              onSubmit={handleClientCreated}
              disabled={disabled}
            />
            
            <button
              type="button"
              onClick={() => setIsAddingClient(false)}
              className="text-gray-600 hover:text-gray-700 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection 
        title="Assignment" 
        icon={<Users className="h-6 w-6 text-gray-400" />}
        defaultOpen={false}
      >
        <div className="space-y-4">
          <OperativeSelect
            value={newOperative?.id || ''}
            organisationId={organisationId}
            operativeTypeId={newOperativeType?.id}
            onChange={(id, name) => setNewOperative({ id, name })}
          />

          {newOperative && (
            <DateTimeInput
              label="Operative Start Time"
              value={startTime}
              onChange={setStartTime}
              min={entryTime}
              max={exitTime}
              error={formErrors.start_time}
            />
          )}
        </div>
      </CollapsibleSection>
    <br/>
    <br/>
    <br/>
    <br/>
    <br/>
    <br/>
    <br/>
    <br/>
    <br/>
    <br/>
    <br/>
    <br/>
    </form>
  );
}

function calculateTimeWindow(entry: string, exit: string): string {
  const entryDate = new Date(entry);
  const exitDate = new Date(exit);
  const diffMinutes = Math.round((exitDate.getTime() - entryDate.getTime()) / (1000 * 60));
  
  if (diffMinutes < 60) {
    return `${diffMinutes} minutes`;
  }
  
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return `${hours} hour${hours !== 1 ? 's' : ''}${minutes ? ` ${minutes} minutes` : ''}`;
}

function getDurationValidationColor(type: 'error' | 'warning' | 'success'): string {
  switch (type) {
    case 'error':
      return 'text-red-600';
    case 'warning':
      return 'text-orange-600';
    case 'success':
      return 'text-green-600';
  }
}