import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, User, Building2 } from 'lucide-react';
import { UserProfileForm } from './user-profile-form';
import { OrganizationProfileForm } from './organization-profile-form';
import { supabase } from '@/lib/supabase';

interface ProfileData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  location_id: string;
  organisation_id: string;
  is_admin: boolean;
  organisation: { id: string; name: string };
}

export function ProfilePage() {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfileData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user found');

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select(`
            *,
            organisation:organisations(id, name)
          `)
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        setProfileData(profile);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    loadProfileData();
  }, []);

  const handleProfileUpdate = (updates: Partial<ProfileData>) => {
    if (profileData) {
      setProfileData({ ...profileData, ...updates });
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Profile Settings</h1>

      <div className="space-y-4 bg-white rounded-lg shadow divide-y">
        {/* User Profile Section */}
        <div>
          <button
            onClick={() => setOpenSection(openSection === 'user' ? null : 'user')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-blue-600" />
              <div className="text-left">
                <h3 className="text-lg font-medium text-gray-900">Manage User Profile</h3>
                <p className="text-sm text-gray-500">Update your personal information</p>
              </div>
            </div>
            {openSection === 'user' ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>
          {openSection === 'user' && profileData && (
            <div className="p-4 bg-white">
              <UserProfileForm
                profile={profileData}
                onUpdate={handleProfileUpdate}
              />
            </div>
          )}
        </div>

        {/* Organization Profile Section */}
        <div>
          <button
            onClick={() => setOpenSection(openSection === 'org' ? null : 'org')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-blue-600" />
              <div className="text-left">
                <h3 className="text-lg font-medium text-gray-900">Manage Organisation Profile</h3>
                <p className="text-sm text-gray-500">Update your organisation details</p>
              </div>
            </div>
            {openSection === 'org' ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>
          {openSection === 'org' && profileData && (
            <div className="p-4 bg-white">
              <OrganizationProfileForm
                organisation={profileData.organisation}
                isAdmin={profileData.is_admin}
                onUpdate={handleProfileUpdate}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}