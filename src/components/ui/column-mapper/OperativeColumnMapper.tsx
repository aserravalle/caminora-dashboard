import { AbstractColumnMapper, type ExpectedField } from './AbstractColumnMapper';

const EXPECTED_FIELDS: ExpectedField[] = [
  { key: 'first_name', label: 'First Name', required: true },
  { key: 'last_name', label: 'Last Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'location', label: 'Location' },
  { key: 'operative_type', label: 'Operative Type' },
  { key: 'default_start_time', label: 'Start Time' },
  { key: 'default_end_time', label: 'End Time' },
  { key: 'default_days_available', label: 'Working Days' },
];

interface OperativeColumnMapperProps {
  headers: string[];
  onMappingSubmit: (mapping: Record<string, string>) => void;
  onNext: () => void;
  className?: string;
}

export function OperativeColumnMapper(props: OperativeColumnMapperProps) {
  return (
    <AbstractColumnMapper
      {...props}
      expectedFields={EXPECTED_FIELDS}
      dataType="operative"
    />
  );
}