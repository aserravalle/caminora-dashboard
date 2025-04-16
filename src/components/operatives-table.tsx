import { useEffect, useState } from 'react';
import { Input } from './ui/input';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { AddOperativeModal } from './AddOperative/AddOperativeModal';

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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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

  const handleAddSuccess = async (newOperatives: Operative[]) => {
    try {
      // Create locations if needed
      for (const operative of newOperatives) {
        if (!operative.location_id && operative.location) {
          const { data: locationData, error: locationError } = await supabase
            .from('locations')
            .insert({
              name: operative.location,
              organisation_id: organisationId
            })
            .select('id')
            .single();

          if (locationError && locationError.code !== '23505') throw locationError;
          if (locationData) {
            operative.location_id = locationData.id;
          } else {
            // If location already exists, fetch its ID
            const { data: existingLocation } = await supabase
              .from('locations')
              .select('id')
              .eq('name', operative.location)
              .eq('organisation_id', organisationId)
              .single();
            
            if (existingLocation) {
              operative.location_id = existingLocation.id;
            }
          }
        }

        // Create operative types if needed
        if (!operative.operative_type_id && operative.operative_type) {
          const { data: typeData, error: typeError } = await supabase
            .from('operative_types')
            .insert({
              name: operative.operative_type,
              organisation_id: organisationId
            })
            .select('id')
            .single();

          if (typeError && typeError.code !== '23505') throw typeError;
          if (typeData) {
            operative.operative_type_id = typeData.id;
          } else {
            // If type already exists, fetch its ID
            const { data: existingType } = await supabase
              .from('operative_types')
              .select('id')
              .eq('name', operative.operative_type)
              .eq('organisation_id', organisationId)
              .single();
            
            if (existingType) {
              operative.operative_type_id = existingType.id;
            }
          }
        }

        // Create the operative
        const { data: newOperative, error: createError } = await supabase
          .from('operatives')
          .insert({
            organisation_id: organisationId,
            location_id: operative.location_id,
            operative_type_id: operative.operative_type_id,
            first_name: operative.first_name,
            last_name: operative.last_name,
            email: operative.email,
            phone: operative.phone,
            default_start_time: operative.default_start_time,
            default_end_time: operative.default_end_time,
            default_days_available: operative.default_days_available,
          })
          .select(`
            *,
            location:locations(name),
            operative_type:operative_types(name)
          `)
          .single();

        if (createError) throw createError;
        if (newOperative) {
          setOperatives(prev => [...prev, newOperative]);
        }
      }

      setIsAddModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create operative');
    }
  };

  const handleRowClick = (operative: Operative) => {
    navigate(`/operatives/${operative.id}`);
  };

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
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
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
        <AddOperativeModal
          open={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleAddSuccess}
          organisationId={organisationId}
        />
      )}
    </div>
  );
}