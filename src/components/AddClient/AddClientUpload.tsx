import { AddChildUpload } from '../abstract/AddChildUpload';
import { ClientRowParser } from '@/lib/clientRowParser';
import { ClientColumnMapper } from '@/components/ui/column-mapper';

interface AddClientUploadProps {
  organisationId: string;
  onSubmit: (clients: any[]) => void;
  disabled?: boolean;
}

export function AddClientUpload(props: AddClientUploadProps) {
  return (
    <AddChildUpload
      {...props}
      ColumnMapper={ClientColumnMapper}
      rowParser={ClientRowParser}
    />
  );
}