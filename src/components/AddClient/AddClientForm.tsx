import { AddChildForm } from '../abstract/AddChildForm';

interface AddClientFormProps {
  organisationId: string;
  onSubmit: (clients: any[]) => void;
  disabled?: boolean;
}

const FIELDS = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    required: true,
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

export function AddClientForm(props: AddClientFormProps) {
  const validateForm = (formData: FormData) => {
    const errors: Record<string, string> = {};

    const name = formData.get('name') as string;
    if (!name?.trim()) {
      errors.name = 'Name is required';
    }

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

  return (
    <AddChildForm
      {...props}
      fields={FIELDS}
      validateForm={validateForm}
    />
  );
}