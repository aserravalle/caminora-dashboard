import { AddChildDialogBox } from '../abstract/AddChildDialogBox';
import { AddClientForm } from './AddClientForm';
import { AddClientUpload } from './AddClientUpload';

interface AddClientDialogBoxProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (clients: any[]) => void;
  organisationId: string;
}

export function AddClientDialogBox({
  open,
  onClose,
  onSuccess,
  organisationId,
}: AddClientDialogBoxProps) {
  return (
    <AddChildDialogBox
      open={open}
      onClose={onClose}
      onSuccess={onSuccess}
      title="Add New Client"
      FormComponent={AddClientForm}
      UploadComponent={AddClientUpload}
      formProps={{ organisationId }}
    />
  );
}