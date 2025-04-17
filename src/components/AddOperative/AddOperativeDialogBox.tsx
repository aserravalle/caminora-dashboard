import { AddChildDialogBox } from '../abstract/AddChildDialogBox';
import { AddOperativeForm } from './AddOperativeForm';
import { AddOperativeUpload } from './AddOperativeUpload';

interface AddOperativeDialogBoxProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (operatives: any[]) => void;
  organisationId: string;
}

export function AddOperativeDialogBox({
  open,
  onClose,
  onSuccess,
  organisationId,
}: AddOperativeDialogBoxProps) {
  return (
    <AddChildDialogBox
      open={open}
      onClose={onClose}
      onSuccess={onSuccess}
      title="Add New Operative"
      FormComponent={AddOperativeForm}
      UploadComponent={AddOperativeUpload}
      formProps={{ organisationId }}
    />
  );
}