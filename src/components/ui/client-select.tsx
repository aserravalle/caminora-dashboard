import { AbstractChildTableSelector } from './abstract-child-table-selector';

interface ClientSelectProps {
  value: string;
  organisationId: string;
  onChange: (clientId: string, clientName: string) => void;
  className?: string;
  error?: string;
}

export function ClientSelect({
  value,
  organisationId,
  onChange,
  className,
  error
}: ClientSelectProps) {
  return (
    <AbstractChildTableSelector
      value={value}
      organisationId={organisationId}
      onChange={onChange}
      className={className}
      error={error}
      tableName="clients"
      label="Client"
      placeholder="Start typing to search clients..."
    />
  );
}