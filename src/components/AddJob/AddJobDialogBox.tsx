import { AddChildDialogBox } from '../abstract/AddChildDialogBox';
import { AddJobForm } from './AddJobForm';
import { AddJobUpload } from './AddJobUpload';

interface AddJobDialogBoxProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (jobs: any[]) => void;
  organisationId: string;
}

export function AddJobDialogBox({
  open,
  onClose,
  onSuccess,
  organisationId,
}: AddJobDialogBoxProps) {
  return (
    <AddChildDialogBox
      open={open}
      onClose={onClose}
      onSuccess={onSuccess}
      title="Add New Job"
      FormComponent={AddJobForm}
      UploadComponent={AddJobUpload}
      formProps={{ organisationId }}
    />
  );
}