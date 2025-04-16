import { AbstractChildTableSelector } from './abstract-child-table-selector';

interface OperativeTypeSelectProps {
  value: string;
  organisationId: string;
  onChange: (typeId: string, typeName: string) => void;
  className?: string;
  error?: string;
}

export function OperativeTypeSelect({
  value,
  organisationId,
  onChange,
  className,
  error
}: OperativeTypeSelectProps) {
  return (
    <AbstractChildTableSelector
      value={value}
      organisationId={organisationId}
      onChange={onChange}
      className={className}
      error={error}
      tableName="operative_types"
      label="Operative Type"
      placeholder="Start typing to search operative types..."
    />
  );
}