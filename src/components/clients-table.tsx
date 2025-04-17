import { useEffect, useState } from 'react';
import { Input } from './ui/input';
import { Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AddClientDialogBox } from './AddClient/AddClientDialogBox';

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  location: { name: string } | null;
  created_at: string;
}

export function ClientsTable() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [organisationId, setOrganisationId] = useState<string | null>(null);

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
    async function loadClients() {
      if (!organisationId) return;
      
      try {
        const { data, error: fetchError } = await supabase
          .from('clients')
          .select(`
            *,
            location:locations(name)
          `)
          .eq('organisation_id', organisationId)
          .order('name');

        if (fetchError) throw fetchError;
        setClients(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load clients');
      } finally {
        setLoading(false);
      }
    }

    loadClients();
  }, [organisationId]);

  const handleAddSuccess = async (newClients: any[]) => {
    try {
      const createdClients = [];

      for (const client of newClients) {
        // Handle location if provided
        let locationId = client.location_id;
        if (!locationId && client.location) {
          // First try to find existing location
          const { data: existingLocation } = await supabase
            .from('locations')
            .select('id')
            .eq('name', client.location)
            .eq('organisation_id', organisationId)
            .single();

          if (existingLocation) {
            locationId = existingLocation.id;
          } else {
            // Create new location
            const { data: newLocation, error: locationError } = await supabase
              .from('locations')
              .insert({
                name: client.location,
                organisation_id: organisationId
              })
              .select('id')
              .single();

            if (locationError) throw locationError;
            if (newLocation) locationId = newLocation.id;
          }
        }

        // Create the client
        const { data: newClient, error: createError } = await supabase
          .from('clients')
          .insert({
            organisation_id: organisationId,
            location_id: locationId,
            name: client.name,
            email: client.email || null,
            phone: client.phone || null,
          })
          .select(`
            *,
            location:locations(name)
          `)
          .single();

        if (createError) throw create

Error;
        if (newClient) {
          createdClients.push(newClient);
        }
      }

      setClients(prev => [...prev, ...createdClients]);
      setIsAddDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create client');
    }
  };

  const filteredClients = clients.filter(client => {
    const searchString = searchTerm.toLowerCase();
    return (
      client.name.toLowerCase().includes(searchString) ||
      (client.email?.toLowerCase() || '').includes(searchString) ||
      (client.phone?.toLowerCase() || '').includes(searchString) ||
      (client.location?.name.toLowerCase() || '').includes(searchString)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading clients...</div>
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
            Clients
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all clients in your organisation
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setIsAddDialogOpen(true)}
            className="flex items-center gap-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <Plus className="h-4 w-4" />
            Add Client
          </button>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="mb-4">
          <Input
            type="search"
            placeholder="Search clients..."
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
                    NAME
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    EMAIL
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    PHONE
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    LOCATION
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    CREATED
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 lg:pl-8">
                      {client.name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {client.email}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {client.phone}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {client.location?.name || '-'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {new Date(client.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {organisationId && (
        <AddClientDialogBox
          open={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onSuccess={handleAddSuccess}
          organisationId={organisationId}
        />
      )}
    </div>
  );
}