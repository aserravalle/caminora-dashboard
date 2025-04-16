import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { OperativeProfile } from './OperativeProfile';
import { OperativeSchedule } from './OperativeSchedule';
import { OperativeJobs } from './OperativeJobs';

interface Operative {
  id: string;
  operative_number: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  location: { name: string };
  operative_type: { name: string };
  default_start_time: string;
  default_end_time: string;
  default_days_available: string;
}

type TabType = 'profile' | 'schedule' | 'jobs';

export function ManageOperativePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [operative, setOperative] = useState<Operative | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  useEffect(() => {
    async function loadOperative() {
      try {
        const { data, error: fetchError } = await supabase
          .from('operatives')
          .select(`
            *,
            location:locations(name),
            operative_type:operative_types(name)
          `)
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error('Operative not found');
        
        setOperative(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load operative');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadOperative();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading operative details...</div>
      </div>
    );
  }

  if (error || !operative) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-700">{error || 'Operative not found'}</p>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'jobs', label: 'Jobs' },
  ] as const;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header Section */}
      <div className="bg-white">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <nav className="flex" aria-label="Breadcrumb">
              <ol role="list" className="flex items-center space-x-2">
                <li>
                  <Link to="/operatives" className="text-sm font-medium text-gray-500 hover:text-gray-700">
                    Operatives
                  </Link>
                </li>
                <li>
                  <div className="flex items-center">
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                    <span className="ml-2 text-sm font-medium text-gray-900">
                      {operative.first_name} {operative.last_name}
                    </span>
                  </div>
                </li>
              </ol>
            </nav>
            <h1 className="mt-2 text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Manage Operative
            </h1>
          </div>

          {/* Tabs */}
          <div className="mt-4 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 bg-gray-50">
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          {activeTab === 'profile' && (
            <OperativeProfile operative={operative} onUpdate={setOperative} />
          )}
          {activeTab === 'schedule' && (
            <OperativeSchedule operative={operative} />
          )}
          {activeTab === 'jobs' && (
            <OperativeJobs operative={operative} />
          )}
        </div>
      </div>
    </div>
  );
}