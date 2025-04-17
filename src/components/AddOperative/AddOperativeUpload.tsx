import { AddChildUpload } from '../abstract/AddChildUpload';
import { OperativeRowParser } from '@/lib/operativeRowParser';
import { OperativeColumnMapper } from '@/components/ui/column-mapper';

interface AddOperativeUploadProps {
  organisationId: string;
  onSubmit: (operatives: any[]) => void;
  disabled?: boolean;
}

export function AddOperativeUpload(props: AddOperativeUploadProps) {
  return (
    <AddChildUpload
      {...props}
      ColumnMapper={OperativeColumnMapper}
      rowParser={OperativeRowParser}
    />
  );
}