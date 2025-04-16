import { useState } from 'react';
import { Input } from '../ui/input';
import { LocationSelect } from '../ui/location-select';
import { OperativeTypeSelect } from '../ui/operative-type-select';
import { DaySelector } from '../ui/day-selector';
import { TimeInput } from '../ui/time-input';

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

interface AddOperativeFormProps {
  organisationId: string;
  onSubmit: (operatives: any[]) => void;
  disabled?: boolean;
}

export function AddOperativeForm({
  organisationId,
  onSubmit,
  disabled
}: AddOperativeFormProps) {
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [defaultDaysAvailable, setDefaultDaysAvailable] = useState('1111100'); // Mon-Fri by default
  const [defaultStartTime, setDefaultStartTime] = useState('09:00');
  const [defaultEndTime, setDefaultEndTime] = useState('17:00');
  const [newLocation, setNewLocation] = useState<{ id: string; name: string } | null>(null);
  const [newOperativeType, setNewOperativeType] = useState<{ id: string; name: string } | null>(null);

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

    const operative = {
      organisation_id: organisationId,
      location_id: newLocation?.id,
      operative_type_id: newOperativeType?.id,
      first_name: formData.get('firstName') as string,
      last_name: (formData.get('lastName') as string) || null,
      email: (formData.get('email') as string) || null,
      phone: (formData.get('phone') as string) || null,
      default_start_time: defaultStartTime,
      default_end_time: defaultEndTime,
      default_days_available: defaultDaysAvailable,
      // These will be created if they don't exist
      location: newLocation?.name,
      operative_type: newOperativeType?.name,
    };

    onSubmit([operative]);
  };

  return (
    <form id="add-operative-form" onSubmit={handleSubmit} className="space-y-6">
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
    </form>
  );
}