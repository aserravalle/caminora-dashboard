import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AddChildDialogBoxProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (data: any[]) => void;
  title: string;
  FormComponent: React.ComponentType<any>;
  UploadComponent: React.ComponentType<any>;
  formProps: Record<string, any>;
}

type UploadMethod = 'form' | 'upload';

interface UserLocation {
  id: string;
  name: string;
}

export function AddChildDialogBox({
  open,
  onClose,
  onSuccess,
  title,
  FormComponent,
  UploadComponent,
  formProps,
}: AddChildDialogBoxProps) {
  const [method, setMethod] = useState<UploadMethod>('form');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  useEffect(() => {
    async function loadUserLocation() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('location_id')
          .eq('id', user.id)
          .single();

        if (profile?.location_id) {
          const { data: location } = await supabase
            .from('locations')
            .select('id, name')
            .eq('id', profile.location_id)
            .single();

          if (location) {
            setUserLocation(location);
          }
        }
      } catch (err) {
        console.error('Failed to load user location:', err);
      }
    }

    if (open) {
      loadUserLocation();
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (data: any[]) => {
    try {
      setSaving(true);
      setError(null);
      
      // Only use user's location as fallback if no location is specified
      const processedData = data.map(item => {
        if (!item.location_id && !item.location && userLocation) {
          return {
            ...item,
            location_id: userLocation.id,
            location: userLocation.name,
          };
        }
        return item;
      });
      
      await onSuccess(processedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-[800px] h-[700px] bg-white rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex-none flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
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
              <FormComponent
                onSubmit={handleSubmit}
                disabled={saving}
                defaultLocation={userLocation}
                {...formProps}
              />
            ) : (
              <UploadComponent
                onSubmit={handleSubmit}
                disabled={saving}
                defaultLocation={userLocation}
                {...formProps}
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
            form={method === 'form' ? 'add-child-form' : 'add-child-upload'}
            disabled={saving}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}