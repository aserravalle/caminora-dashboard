import { AbstractColumnMapper, type ExpectedField } from './AbstractColumnMapper';

const EXPECTED_FIELDS: ExpectedField[] = [
  { key: 'entry_time', label: 'Entry Time', required: true },
  { key: 'exit_time', label: 'Exit Time', required: true },
  { key: 'duration_min', label: 'Duration (minutes)', required: true },
  { key: 'location', label: 'Location', required: true },
  { key: 'operative_type', label: 'Operative Type' },
  { key: 'client', label: 'Client', required: true },
  { key: 'operative', label: 'Operative' },
  { key: 'start_time', label: 'Start Time' },
];

interface JobColumnMapperProps {
  headers: string[];
  onMappingSubmit: (mapping: Record<string, string>) => void;
  onNext: () => void;
  className?: string;
}

export function JobColumnMapper(props: JobColumnMapperProps) {
  return (
    <AbstractColumnMapper
      {...props}
      expectedFields={EXPECTED_FIELDS}
      dataType="job"
    />
  );
}