import { useState } from 'react';
import { X } from 'lucide-react';
import { Input } from './ui/input';
import { LocationSelect } from './ui/location-select';
import { OperativeTypeSelect } from './ui/operative-type-select';
import { DaySelector } from './ui/day-selector';
import { TimeInput } from './ui/time-input';
import { supabase } from '@/lib/supabase';

interface CreateOperativeDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (operative: any) => void;
  organisationId: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  defaultStartTime?: string;
  defaultEndTime?: string;
  location?: string;
  operativeType?: string;
}

export function CreateOperativeDialog({
  open,
  onClose,
  onSuccess,
  organisationId,
}: CreateOperativeDialogProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [newLocation, setNewLocation] = useState<{ id: string; name: string } | null>(null);
  const [newOperativeType, setNewOperativeType] = useState<{ id: string; name: string } | null>(null);
  const [defaultDaysAvailable, setDefaultDaysAvailable] = useState('1111100'); // Mon-Fri by default
  const [defaultStartTime, setDefaultStartTime] = useState('09:00');
  const [defaultEndTime, setDefaultEndTime] = useState('17:00');

  if (!open) return null;

  const validateForm = (formData: FormData): FormErrors => {
    const errors: FormErrors = {};

    // Required field validation
    if (!formData.get('firstName')) {
      errors.firstName = 'First name is required';
    }

    // Email validation if provided
    const email = formData.get('email') as string;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Phone validation if provided
    const phone = formData.get('phone') as string;
    if (phone && !/^\+?[\d\s-()]+$/.test(phone)) {
      errors.phone = 'Please enter a valid phone number';
    }

    // Time validation
    const startTime = defaultStartTime;
    const endTime = defaultEndTime;
    if (!startTime) {
      errors.defaultStartTime = 'Start time is required';
    }
    if (!endTime) {
      errors.defaultEndTime = 'End time is required';
    }
    if (startTime && endTime) {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      if (start >= end) {
        errors.defaultStartTime = 'Start time must be before end time';
        errors.defaultEndTime = 'End time must be after start time';
      }
    }

    // Location and Operative Type validation
    if (!newLocation?.id && !newLocation?.name) {
      errors.location = 'Location is required';
    }
    if (!newOperativeType?.id && !newOperativeType?.name) {
      errors.operativeType = 'Operative type is required';
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Validate form
    const validationErrors = validateForm(formData);
    setFormErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Handle new location creation if needed
      let locationId = '';
      if (newLocation && !newLocation.id && newLocation.name.trim()) {
        const { data: locationData, error: locationError } = await supabase
          .from('locations')
          .insert({
            name: newLocation.name.trim(),
            organisation_id: organisationId
          })
          .select('id')
          .single();

        if (locationError) {
          if (locationError.code === '23505') {
            throw new Error('A location with this name already exists in your organization');
          }
          throw locationError;
        }
        if (locationData) {
          locationId = locationData.id;
        }
      } else if (newLocation?.id) {
        locationId = newLocation.id;
      }

      // Handle new operative type creation if needed
      let operativeTypeId = '';
      if (newOperativeType && !newOperativeType.id && newOperativeType.name.trim()) {
        const { data: typeData, error: typeError } = await supabase
          .from('operative_types')
          .insert({
            name: newOperativeType.name.trim(),
            organisation_id: organisationId
          })
          .select('id')
          .single();

        if (typeError) {
          if (typeError.code === '23505') {
            throw new Error('An operative type with this name already exists in your organization');
          }
          throw typeError;
        }
        if (typeData) {
          operativeTypeId = typeData.id;
        }
      } else if (newOperativeType?.id) {
        operativeTypeId = newOperativeType.id;
      }

      const operativeData = {
        organisation_id: organisationId,
        location_id: locationId,
        operative_type_id: operativeTypeId,
        first_name: formData.get('firstName') as string,
        last_name: (formData.get('lastName') as string) || null,
        email: (formData.get('email') as string) || null,
        phone: (formData.get('phone') as string) || null,
        default_start_time: defaultStartTime,
        default_end_time: defaultEndTime,
        default_days_available: defaultDaysAvailable,
      };

      const { data: operative, error: createError } = await supabase
        .from('operatives')
        .insert(operativeData)
        .select(`
          *,
          location:locations(name),
          operative_type:operative_types(name)
        `)
        .single();

      if (createError) throw createError;
      if (!operative) throw new Error('Failed to create operative');

      onSuccess(operative);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        setError(String(err.message));
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          <div className="absolute right-0 top-0 pr-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
              <h3 className="text-lg font-semibold leading-6 text-gray-900">
                Add New Operative
              </h3>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {error && (
                  <div className="rounded-md bg-red-50 p-4">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    name="firstName"
                    type="text"
                    required
                    error={formErrors.firstName}
                  />

                  <Input
                    label="Last Name"
                    name="lastName"
                    type="text"
                    error={formErrors.lastName}
                  />
                </div>

                <Input
                  label="Email"
                  name="email"
                  type="email"
                  error={formErrors.email}
                />

                <Input
                  label="Phone"
                  name="phone"
                  type="tel"
                  error={formErrors.phone}
                />

                <DaySelector
                  value={defaultDaysAvailable}
                  onChange={setDefaultDaysAvailable}
                />

                <div className="grid grid-cols-2 gap-4">
                  <TimeInput
                    label="Default Start Time"
                    name="defaultStartTime"
                    value={defaultStartTime}
                    onChange={setDefaultStartTime}
                    required
                    error={formErrors.defaultStartTime}
                  />

                  <TimeInput
                    label="Default End Time"
                    name="defaultEndTime"
                    value={defaultEndTime}
                    onChange={setDefaultEndTime}
                    required
                    error={formErrors.defaultEndTime}
                  />
                </div>

                <LocationSelect
                  value=""
                  organisationId={organisationId}
                  onChange={(id, name) => setNewLocation({ id, name })}
                  error={formErrors.location}
                />

                <OperativeTypeSelect
                  value=""
                  organisationId={organisationId}
                  onChange={(id, name) => setNewOperativeType({ id, name })}
                  error={formErrors.operativeType}
                />

                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Creating...' : 'Create Operative'}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}