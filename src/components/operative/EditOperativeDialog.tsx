import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Input } from '../ui/input';
import { LocationSelect } from '../ui/location-select';
import { OperativeTypeSelect } from '../ui/operative-type-select';
import { DaySelector } from '../ui/day-selector';
import { TimeInput } from '../ui/time-input';
import { supabase } from '@/lib/supabase';

interface Operative {
  id: string;
  organisation_id: string;
  operative_number: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  location: { id: string; name: string } | null;
  operative_type: { id: string; name: string } | null;
  default_start_time: string;
  default_end_time: string;
  default_days_available: string;
}

interface EditOperativeDialogProps {
  operative: Operative;
  open: boolean;
  onClose: () => void;
  onUpdate: (operative: Operative) => void;
}

export function EditOperativeDialog({
  operative,
  open,
  onClose,
  onUpdate,
}: EditOperativeDialogProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newLocation, setNewLocation] = useState<{ id: string; name: string } | null>(null);
  const [newOperativeType, setNewOperativeType] = useState<{ id: string; name: string } | null>(null);
  const [defaultDaysAvailable, setDefaultDaysAvailable] = useState(operative.default_days_available);
  const [defaultStartTime, setDefaultStartTime] = useState(operative.default_start_time);
  const [defaultEndTime, setDefaultEndTime] = useState(operative.default_end_time);

  // Initialize location and operative type when dialog opens
  useEffect(() => {
    if (open) {
      setNewLocation(operative.location || null);
      setNewOperativeType(operative.operative_type || null);
      setDefaultDaysAvailable(operative.default_days_available);
      setDefaultStartTime(operative.default_start_time);
      setDefaultEndTime(operative.default_end_time);
    }
  }, [open, operative]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const updates: Partial<Operative> = {
        first_name: formData.get('firstName') as string,
        last_name: (formData.get('lastName') as string) || null,
        email: (formData.get('email') as string) || null,
        phone: (formData.get('phone') as string) || null,
        default_start_time: defaultStartTime,
        default_end_time: defaultEndTime,
        default_days_available: defaultDaysAvailable,
      };

      // Handle new location if changed
      if (newLocation && (!operative.location || newLocation.id !== operative.location.id)) {
        if (!newLocation.id) {
          const { data: locationData, error: locationError } = await supabase
            .from('locations')
            .insert({
              name: newLocation.name,
              organisation_id: operative.organisation_id
            })
            .select('id')
            .single();

          if (locationError) throw locationError;
          if (locationData) {
            updates.location_id = locationData.id;
          }
        } else {
          updates.location_id = newLocation.id;
        }
      }

      // Handle new operative type if changed
      if (newOperativeType && (!operative.operative_type || newOperativeType.id !== operative.operative_type.id)) {
        if (!newOperativeType.id) {
          const { data: typeData, error: typeError } = await supabase
            .from('operative_types')
            .insert({
              name: newOperativeType.name,
              organisation_id: operative.organisation_id
            })
            .select('id')
            .single();

          if (typeError) throw typeError;
          if (typeData) {
            updates.operative_type_id = typeData.id;
          }
        } else {
          updates.operative_type_id = newOperativeType.id;
        }
      }

      const { data: updatedOperative, error: updateError } = await supabase
        .from('operatives')
        .update(updates)
        .eq('id', operative.id)
        .select(`
          *,
          location:locations(id, name),
          operative_type:operative_types(id, name)
        `)
        .single();

      if (updateError) throw updateError;
      if (updatedOperative) {
        onUpdate(updatedOperative);
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update operative');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-[800px] h-[700px] bg-white rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">Edit Profile</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form id="edit-operative-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                name="firstName"
                type="text"
                defaultValue={operative.first_name}
                required
              />

              <Input
                label="Last Name"
                name="lastName"
                type="text"
                defaultValue={operative.last_name || ''}
              />
            </div>

            <Input
              label="Email"
              name="email"
              type="email"
              defaultValue={operative.email || ''}
            />

            <Input
              label="Phone"
              name="phone"
              type="tel"
              defaultValue={operative.phone || ''}
            />

            <DaySelector
              value={defaultDaysAvailable}
              onChange={setDefaultDaysAvailable}
            />

            <div className="grid grid-cols-2 gap-4">
              <TimeInput
                label="Default Start Time"
                name="defaultStartTime"
                value={defaultStartTime}
                onChange={setDefaultStartTime}
                required
              />

              <TimeInput
                label="Default End Time"
                name="defaultEndTime"
                value={defaultEndTime}
                onChange={setDefaultEndTime}
                required
              />
            </div>

            <LocationSelect
              value={operative.location?.id || ''}
              organisationId={operative.organisation_id}
              onChange={(id, name) => setNewLocation({ id, name })}
            />

            <OperativeTypeSelect
              value={operative.operative_type?.id || ''}
              organisationId={operative.organisation_id}
              onChange={(id, name) => setNewOperativeType({ id, name })}
            />
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-operative-form"
            disabled={saving}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}