import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';

interface Organization {
  id: string;
  name: string;
}

interface OrganizationProfileFormProps {
  organisation: Organization;
  isAdmin: boolean;
  onUpdate: (updates: { organisation: Organization }) => void;
}

export function OrganizationProfileForm({
  organisation,
  isAdmin,
  onUpdate,
}: OrganizationProfileFormProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAdmin) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData(e.currentTarget);
      const updates = {
        name: formData.get('name') as string,
      };

      const { error: updateError } = await supabase
        .from('organisations')
        .update(updates)
        .eq('id', organisation.id);

      if (updateError) throw updateError;

      onUpdate({
        organisation: { ...organisation, ...updates },
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update organization');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-sm text-gray-500">
        You need administrator privileges to manage organization settings.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-700">Organization updated successfully</p>
        </div>
      )}

      <Input
        label="Organisation Name"
        name="name"
        type="text"
        defaultValue={organisation.name}
        required
      />

      <button
        type="submit"
        disabled={saving}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}