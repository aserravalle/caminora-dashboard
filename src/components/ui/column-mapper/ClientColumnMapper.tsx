import { AbstractColumnMapper, type ExpectedField } from './AbstractColumnMapper';

const EXPECTED_FIELDS: ExpectedField[] = [
  { key: 'name', label: 'Name', required: true },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'location', label: 'Location' },
];

interface ClientColumnMapperProps {
  headers: string[];
  onSubmit: (mapping: Record<string, string>) => void;
  className?: string;
}

export function ClientColumnMapper(props: ClientColumnMapperProps) {
  return (
    <AbstractColumnMapper
      {...props}
      expectedFields={EXPECTED_FIELDS}
      dataType="operative"
    />
  );
}