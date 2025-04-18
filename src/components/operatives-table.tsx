import { useEffect, useState } from 'react';
import { Input } from './ui/input';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { AddOperativeDialogBox } from './AddOperative/AddOperativeDialogBox';

interface Operative {
  id: string;
  operative_number: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  location: { name: string } | null;
  operative_type: { name: string } | null;
  default_start_time: string;
  default_end_time: string;
  default_days_available: string;
}

export function OperativesTable() {
  const [operatives, setOperatives] = useState<Operative[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [organisationId, setOrganisationId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadOrganisationId() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('No authenticated user found');
          setLoading(false);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('organisation_id')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profileError) {
          throw profileError;
        }

        if (!profile?.organisation_id) {
          setError('No organisation found for user');
          setLoading(false);
          return;
        }

        setOrganisationId(profile.organisation_id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user profile');
        setLoading(false);
      }
    }
    loadOrganisationId();
  }, []);

  useEffect(() => {
    async function loadOperatives() {
      if (!organisationId) return;
      
      try {
        const { data, error: fetchError } = await supabase
          .from('operatives')
          .select(`
            *,
            location:locations(name),
            operative_type:operative_types(name)
          `)
          .eq('organisation_id', organisationId)
          .order('operative_number');

        if (fetchError) throw fetchError;
        setOperatives(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load operatives');
      } finally {
        setLoading(false);
      }
    }

    loadOperatives();
  }, [organisationId]);

  const handleAddSuccess = async (newOperatives: any[]) => {
    try {
      const createdOperatives = [];

      for (const operative of newOperatives) {
        // Handle location if provided
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
            // Create new location
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

        // Handle operative type if provided
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
            // Create new operative type
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

      setOperatives(prev => [...prev, ...createdOperatives]);
      setIsAddDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create operative');
    }
  };

  const handleRowClick = (operative: Operative) => {
    navigate(`/operatives/${operative.id}`);
  };

  const filteredOperatives = operatives.filter(operative => {
    const searchString = searchTerm.toLowerCase();
    return (
      operative.operative_number.toLowerCase().includes(searchString) ||
      operative.first_name.toLowerCase().includes(searchString) ||
      (operative.last_name?.toLowerCase() || '').includes(searchString) ||
      (operative.email?.toLowerCase() || '').includes(searchString) ||
      (operative.phone?.toLowerCase() || '').includes(searchString) ||
      (operative.location?.name.toLowerCase() || '').includes(searchString) ||
      (operative.operative_type?.name.toLowerCase() || '').includes(searchString)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading operatives...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">
            Operatives
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all operatives in your organisation
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setIsAddDialogOpen(true)}
            className="flex items-center gap-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <Plus className="h-4 w-4" />
            Add Operative
          </button>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="mb-4">
          <Input
            type="search"
            placeholder="Search operatives..."
            className="max-w-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 lg:pl-8">
                    ID
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    NAME
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    TYPE
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    LOCATION
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    EMAIL
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    PHONE
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    AVAILABILITY
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredOperatives.map((operative) => (
                  <tr 
                    key={operative.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleRowClick(operative)}
                  >
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 lg:pl-8">
                      {operative.operative_number}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {operative.first_name} {operative.last_name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {operative.operative_type?.name || 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {operative.location?.name || 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {operative.email}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {operative.phone}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {operative.default_start_time.slice(0, 5)} - {operative.default_end_time.slice(0, 5)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {organisationId && (
        <AddOperativeDialogBox
          open={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onSuccess={handleAddSuccess}
          organisationId={organisationId}
        />
      )}
    </div>
  );
}