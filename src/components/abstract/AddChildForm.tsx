import { useState } from 'react';
import { Input } from '../ui/input';
import { LocationSelect } from '../ui/location-select';

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
}

interface AddChildFormProps {
  organisationId: string;
  onSubmit: (data: any[]) => void;
  disabled?: boolean;
  fields: {
    name: string;
    label: string;
    type: string;
    required?: boolean;
    gridColumn?: boolean;
  }[];
  validateForm?: (formData: FormData) => FormErrors;
}

export function AddChildForm({
  organisationId,
  onSubmit,
  disabled,
  fields,
  validateForm
}: AddChildFormProps) {
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [newLocation, setNewLocation] = useState<{ id: string; name: string } | null>(null);

  const defaultValidateForm = (formData: FormData): FormErrors => {
    const errors: FormErrors = {};

    // Basic validation for common fields
    const email = formData.get('email') as string;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    const phone = formData.get('phone') as string;
    if (phone && !/^\+?[\d\s-()]+$/.test(phone)) {
      errors.phone = 'Please enter a valid phone number';
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Validate form
    const validationErrors = validateForm ? validateForm(formData) : defaultValidateForm(formData);
    setFormErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const data = {
      organisation_id: organisationId,
      location_id: newLocation?.id,
    };

    fields.forEach(field => {
      const value = formData.get(field.name);
      data[field.name] = value || null;
    });

    if (newLocation?.name) {
      data.location = newLocation.name;
    }

    onSubmit([data]);
  };

  // Group fields that should be in the same row
  const groupedFields = fields.reduce((acc, field) => {
    if (field.gridColumn) {
      if (!acc.current) {
        acc.current = [field];
      } else {
        acc.current.push(field);
        acc.rows.push(acc.current);
        acc.current = null;
      }
    } else {
      if (acc.current) {
        acc.rows.push(acc.current);
      }
      acc.rows.push([field]);
      acc.current = null;
    }
    return acc;
  }, { rows: [], current: null } as { rows: any[], current: any[] | null });

  if (groupedFields.current) {
    groupedFields.rows.push(groupedFields.current);
  }

  return (
    <form id="add-child-form" onSubmit={handleSubmit} className="space-y-6">
      {groupedFields.rows.map((row, rowIndex) => (
        <div key={rowIndex} className={`grid grid-cols-${row.length} gap-4`}>
          {row.map(field => (
            <Input
              key={field.name}
              label={field.label}
              name={field.name}
              type={field.type}
              required={field.required}
              error={formErrors[field.name as keyof FormErrors]}
            />
          ))}
        </div>
      ))}

      <LocationSelect
        value=""
        organisationId={organisationId}
        onChange={(id, name) => setNewLocation({ id, name })}
        error={formErrors.location}
      />
    </form>
  );
}