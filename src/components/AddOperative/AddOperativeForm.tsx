import { useState } from 'react';
import { DaySelector } from '../ui/day-selector';
import { TimeInput } from '../ui/time-input';
import { OperativeTypeSelect } from '../ui/operative-type-select';
import { AddChildForm } from '../abstract/AddChildForm';

interface AddOperativeFormProps {
  organisationId: string;
  onSubmit: (operatives: any[]) => void;
  disabled?: boolean;
}

const FIELDS = [
  {
    name: 'first_name',
    label: 'First Name',
    type: 'text',
    required: true,
    gridColumn: true,
  },
  {
    name: 'last_name',
    label: 'Last Name',
    type: 'text',
    gridColumn: true,
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
  },
  {
    name: 'phone',
    label: 'Phone',
    type: 'tel',
  },
];

export function AddOperativeForm({
  organisationId,
  onSubmit,
  disabled,
}: AddOperativeFormProps) {
  const [defaultDaysAvailable, setDefaultDaysAvailable] = useState('1111100'); // Mon-Fri by default
  const [defaultStartTime, setDefaultStartTime] = useState('09:00');
  const [defaultEndTime, setDefaultEndTime] = useState('17:00');
  const [newOperativeType, setNewOperativeType] = useState<{ id: string; name: string } | null>(null);

  const validateForm = (formData: FormData) => {
    const errors: Record<string, string> = {};

    // Required field validation
    const firstName = formData.get('first_name') as string;
    if (!firstName?.trim()) {
      errors.first_name = 'First name is required';
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
    if (!defaultStartTime) {
      errors.defaultStartTime = 'Start time is required';
    }
    if (!defaultEndTime) {
      errors.defaultEndTime = 'End time is required';
    }
    if (defaultStartTime && defaultEndTime) {
      const start = new Date(`2000-01-01T${defaultStartTime}`);
      const end = new Date(`2000-01-01T${defaultEndTime}`);
      if (start >= end) {
        errors.defaultStartTime = 'Start time must be before end time';
        errors.defaultEndTime = 'End time must be after start time';
      }
    }

    // Operative Type validation
    if (!newOperativeType?.id && !newOperativeType?.name) {
      errors.operativeType = 'Operative type is required';
    }

    return errors;
  };

  const handleSubmit = (data: any[]) => {
    const operative = data[0];
    operative.default_start_time = defaultStartTime;
    operative.default_end_time = defaultEndTime;
    operative.default_days_available = defaultDaysAvailable;
    operative.operative_type_id = newOperativeType?.id;
    operative.operative_type = newOperativeType?.name;

    onSubmit([operative]);
  };

  return (
    <div className="space-y-6">
      <AddChildForm
        organisationId={organisationId}
        onSubmit={handleSubmit}
        disabled={disabled}
        fields={FIELDS}
        validateForm={validateForm}
      />

      <OperativeTypeSelect
        value=""
        organisationId={organisationId}
        onChange={(id, name) => setNewOperativeType({ id, name })}
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
        />

        <TimeInput
          label="Default End Time"
          name="defaultEndTime"
          value={defaultEndTime}
          onChange={setDefaultEndTime}
          required
        />
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
      </div>
    </div>
  );
}