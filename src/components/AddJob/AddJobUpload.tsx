import { AddChildUpload } from '../abstract/AddChildUpload';
import { JobRowParser } from '@/lib/jobRowParser';
import { JobColumnMapper } from '@/components/ui/column-mapper';

interface AddJobUploadProps {
  organisationId: string;
  onSubmit: (jobs: any[]) => void;
  disabled?: boolean;
}

export function AddJobUpload(props: AddJobUploadProps) {
  return (
    <AddChildUpload
      {...props}
      ColumnMapper={JobColumnMapper}
      rowParser={JobRowParser}
    />
  );
}