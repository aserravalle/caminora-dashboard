import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { LocationSelect } from '@/components/ui/location-select';
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  location_id: string;
  organisation_id: string;
}

interface UserProfileFormProps {
  profile: Profile;
  onUpdate: (updates: Partial<Profile>) => void;
}

export function UserProfileForm({ profile, onUpdate }: UserProfileFormProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newLocation, setNewLocation] = useState<{ id: string; name: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData(e.currentTarget);
      const updates: Partial<Profile> = {
        first_name: formData.get('firstName') as string,
        last_name: formData.get('lastName') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string || null,
      };

      // Handle new location creation if needed
      if (newLocation && !newLocation.id && newLocation.name.trim()) {
        const { data: locationData, error: locationError } = await supabase
          .from('locations')
          .insert({
            name: newLocation.name.trim(),
            organisation_id: profile.organisation_id
          })
          .select('id')
          .single();

        if (locationError) {
          // Check for unique constraint violation
          if (locationError.code === '23505') {
            throw new Error('A location with this name already exists in your organization. Select that location, or change the name if you want a new one.');
          }
          throw locationError;
        }
        if (locationData) {
          updates.location_id = locationData.id;
        }
      } else if (newLocation?.id) {
        updates.location_id = newLocation.id;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id);

      if (updateError) {
        if (updateError.code === '23505') {
          throw new Error('This update would create a duplicate entry');
        }
        throw updateError;
      }

      onUpdate(updates);
      setSuccess(true);
      setNewLocation(null);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        setError(String(err.message));
      } else {
        setError('An unexpected error occurred while updating the profile');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLocationChange = (locationId: string, locationName: string) => {
    setNewLocation({ id: locationId, name: locationName });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-700">Profile updated successfully</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First Name"
          name="firstName"
          type="text"
          defaultValue={profile.first_name}
          required
        />

        <Input
          label="Last Name"
          name="lastName"
          type="text"
          defaultValue={profile.last_name}
          required
        />
      </div>

      <Input
        label="Email"
        name="email"
        type="email"
        defaultValue={profile.email}
        required
      />

      <Input
        label="Phone (optional)"
        name="phone"
        type="tel"
        defaultValue={profile.phone || ''}
      />

      <LocationSelect
        value={profile.location_id}
        organisationId={profile.organisation_id}
        onChange={handleLocationChange}
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