import { AbstractChildTableSelector } from './abstract-child-table-selector';

interface LocationSelectProps {
  value: string;
  organisationId: string;
  onChange: (locationId: string, locationName: string) => void;
  className?: string;
  error?: string;
}

export function LocationSelect({
  value,
  organisationId,
  onChange,
  className,
  error
}: LocationSelectProps) {
  return (
    <AbstractChildTableSelector
      value={value}
      organisationId={organisationId}
      onChange={onChange}
      className={className}
      error={error}
      tableName="locations"
      label="Location"
      placeholder="Start typing to search locations..."
    />
  );
}