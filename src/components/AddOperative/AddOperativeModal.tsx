import { useState } from 'react';
import { X } from 'lucide-react';
import { AddOperativeForm } from './AddOperativeForm';
import { AddOperativeUpload } from './AddOperativeUpload';
import { supabase } from '@/lib/supabase';

interface AddOperativeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (operatives: any[]) => void;
  organisationId: string;
}

type UploadMethod = 'form' | 'upload';

export function AddOperativeModal({
  open,
  onClose,
  onSuccess,
  organisationId,
}: AddOperativeModalProps) {
  const [method, setMethod] = useState<UploadMethod>('form');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (operatives: any[]) => {
    try {
      setSaving(true);
      setError(null);

      const createdOperatives = [];

      for (const operative of operatives) {
        // Handle location
        let locationId = operative.location_id;
        if (!locationId && operative.location) {
          // First try to find existing location
          const { data: existingLocation } = await supabase
            .from('locations')
            .select('id')
            .eq('name', operative.location)
            .eq('organisation_id', organisationId)
            .single();

          if (existingLocation) {
            locationId = existingLocation.id;
          } else {
            // Create new location if it doesn't exist
            const { data: newLocation, error: locationError } = await supabase
              .from('locations')
              .insert({
                name: operative.location,
                organisation_id: organisationId
              })
              .select('id')
              .single();

            if (locationError) throw locationError;
            if (newLocation) locationId = newLocation.id;
          }
        }

        // Handle operative type
        let operativeTypeId = operative.operative_type_id;
        if (!operativeTypeId && operative.operative_type) {
          // First try to find existing operative type
          const { data: existingType } = await supabase
            .from('operative_types')
            .select('id')
            .eq('name', operative.operative_type)
            .eq('organisation_id', organisationId)
            .single();

          if (existingType) {
            operativeTypeId = existingType.id;
          } else {
            // Create new operative type if it doesn't exist
            const { data: newType, error: typeError } = await supabase
              .from('operative_types')
              .insert({
                name: operative.operative_type,
                organisation_id: organisationId
              })
              .select('id')
              .single();

            if (typeError) throw typeError;
            if (newType) operativeTypeId = newType.id;
          }
        }

        // Create the operative
        const { data: newOperative, error: createError } = await supabase
          .from('operatives')
          .insert({
            organisation_id: organisationId,
            location_id: locationId,
            operative_type_id: operativeTypeId,
            first_name: operative.first_name,
            last_name: operative.last_name || null,
            email: operative.email || null,
            phone: operative.phone || null,
            default_start_time: operative.default_start_time || '09:00',
            default_end_time: operative.default_end_time || '17:00',
            default_days_available: operative.default_days_available || '1111100',
          })
          .select(`
            *,
            location:locations(name),
            operative_type:operative_types(name)
          `)
          .single();

        if (createError) throw createError;
        if (newOperative) {
          createdOperatives.push(newOperative);
        }
      }

      onSuccess(createdOperatives);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create operative');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-[800px] h-[700px] bg-white rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex-none flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">Add New Operative</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex-none border-b border-gray-200">
          <nav className="flex px-6" aria-label="Tabs">
            <button
              onClick={() => setMethod('form')}
              className={`whitespace-nowrap border-b-2 py-4 px-4 text-sm font-medium ${
                method === 'form'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Manual Entry
            </button>
            <button
              onClick={() => setMethod('upload')}
              className={`whitespace-nowrap border-b-2 py-4 px-4 text-sm font-medium ${
                method === 'upload'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              File Upload
            </button>
          </nav>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="min-h-[450px]">
            {method === 'form' ? (
              <AddOperativeForm
                organisationId={organisationId}
                onSubmit={handleSubmit}
                disabled={saving}
              />
            ) : (
              <AddOperativeUpload
                organisationId={organisationId}
                onSubmit={handleSubmit}
                disabled={saving}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-none flex justify-end gap-3 border-t border-gray-200 px-6 py-4 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            form={method === 'form' ? 'add-operative-form' : 'add-operative-upload'}
            disabled={saving}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Adding...' : 'Add Operative'}
          </button>
        </div>
      </div>
    </div>
  );
}