import { useEffect, useState } from 'react';
import { Input } from './ui/input';
import { Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AddJobDialogBox } from './AddJob/AddJobDialogBox';

interface Job {
  id: string;
  entry_time: string;
  exit_time: string;
  duration_min: number;
  start_time: string | null;
  operative_type: { name: string } | null;
  client: { name: string } | null;
  location: { name: string } | null;
  operative: { first_name: string; last_name: string } | null;
  created_at: string;
}

export function JobsTable() {
  const [jobs, setJobs] = useState<Job[]>([]);
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
    async function loadJobs() {
      if (!organisationId) return;
      
      try {
        const { data, error: fetchError } = await supabase
          .from('jobs')
          .select(`
            *,
            operative_type:operative_types(name),
            client:clients(name),
            location:locations(name),
            operative:operatives(first_name, last_name)
          `)
          .eq('organisation_id', organisationId)
          .order('entry_time', { ascending: false });

        if (fetchError) throw fetchError;
        setJobs(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load jobs');
      } finally {
        setLoading(false);
      }
    }

    loadJobs();
  }, [organisationId]);

  const handleAddSuccess = async (newJobs: any[]) => {
    try {
      const createdJobs = [];

      for (const job of newJobs) {
        // Handle location if provided
        let locationId = job.location_id;
        if (!locationId && job.location) {
          const { data: existingLocation } = await supabase
            .from('locations')
            .select('id')
            .eq('name', job.location)
            .eq('organisation_id', organisationId)
            .single();

          if (existingLocation) {
            locationId = existingLocation.id;
          } else {
            const { data: newLocation, error: locationError } = await supabase
              .from('locations')
              .insert({
                name: job.location,
                organisation_id: organisationId
              })
              .select('id')
              .single();

            if (locationError) throw locationError;
            if (newLocation) locationId = newLocation.id;
          }
        }

        // Handle operative type if provided
        let operativeTypeId = job.operative_type_id;
        if (!operativeTypeId && job.operative_type) {
          const { data: existingType } = await supabase
            .from('operative_types')
            .select('id')
            .eq('name', job.operative_type)
            .eq('organisation_id', organisationId)
            .single();

          if (existingType) {
            operativeTypeId = existingType.id;
          } else {
            const { data: newType, error: typeError } = await supabase
              .from('operative_types')
              .insert({
                name: job.operative_type,
                organisation_id: organisationId
              })
              .select('id')
              .single();

            if (typeError) throw typeError;
            if (newType) operativeTypeId = newType.id;
          }
        }

        // Handle client if provided
        let clientId = job.client_id;
        if (!clientId && job.client) {
          const { data: existingClient } = await supabase
            .from('clients')
            .select('id')
            .eq('name', job.client)
            .eq('organisation_id', organisationId)
            .single();

          if (existingClient) {
            clientId = existingClient.id;
          } else {
            const { data: newClient, error: clientError } = await supabase
              .from('clients')
              .insert({
                name: job.client,
                organisation_id: organisationId
              })
              .select('id')
              .single();

            if (clientError) throw clientError;
            if (newClient) clientId = newClient.id;
          }
        }

        // Create the job
        const { data: newJob, error: createError } = await supabase
          .from('jobs')
          .insert({
            organisation_id: organisationId,
            location_id: locationId,
            operative_type_id: operativeTypeId,
            client_id: clientId,
            operative_id: job.operative_id,
            entry_time: job.entry_time,
            exit_time: job.exit_time,
            duration_min: job.duration_min,
            start_time: job.start_time || null,
          })
          .select(`
            *,
            operative_type:operative_types(name),
            client:clients(name),
            location:locations(name),
            operative:operatives(first_name, last_name)
          `)
          .single();

        if (createError) throw createError;
        if (newJob) {
          createdJobs.push(newJob);
        }
      }

      setJobs(prev => [...createdJobs, ...prev]);
      setIsAddDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job');
    }
  };

  const filteredJobs = jobs.filter(job => {
    const searchString = searchTerm.toLowerCase();
    return (
      (job.client?.name?.toLowerCase() || '').includes(searchString) ||
      (job.location?.name?.toLowerCase() || '').includes(searchString) ||
      (job.operative_type?.name?.toLowerCase() || '').includes(searchString) ||
      (job.operative ? `${job.operative.first_name} ${job.operative.last_name}`.toLowerCase() : '').includes(searchString)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading jobs...</div>
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

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString();
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">
            Jobs
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all jobs in your organisation
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setIsAddDialogOpen(true)}
            className="flex items-center gap-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <Plus className="h-4 w-4" />
            Add Job
          </button>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="mb-4">
          <Input
            type="search"
            placeholder="Search jobs..."
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
                    CLIENT
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    LOCATION
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    TYPE
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    OPERATIVE
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    ENTRY TIME
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    EXIT TIME
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    START TIME
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    DURATION
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    CREATED
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 lg:pl-8">
                      {job.client?.name || '-'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {job.location?.name || '-'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {job.operative_type?.name || '-'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {job.operative ? `${job.operative.first_name} ${job.operative.last_name}` : '-'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {formatDateTime(job.entry_time)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {formatDateTime(job.exit_time)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {job.start_time ? formatDateTime(job.start_time) : '-'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {formatDuration(job.duration_min)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {formatDateTime(job.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {organisationId && (
        <AddJobDialogBox
          open={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onSuccess={handleAddSuccess}
          organisationId={organisationId}
        />
      )}
    </div>
  );
}