import { useState } from 'react';
import { RosterMap } from '@/components/roster/RosterMap';
import { Download } from 'lucide-react';

interface AssignmentResultsProps {
  rosterResponse: any;
}

export function AssignmentResults({ rosterResponse }: AssignmentResultsProps) {
  const [selectedOperative, setSelectedOperative] = useState<string | null>(null);

  if (!rosterResponse) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No assignment results available. Please upload and process files first.</p>
      </div>
    );
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleExport = () => {
    // TODO: Implement CSV export
    console.log('Export to CSV');
  };

  // Get unique operatives for filter
  const operatives = Array.from(new Set(
    rosterResponse.jobs
      .filter((job: any) => job.operative_name)
      .map((job: any) => job.operative_name)
  )).sort();

  // Filter jobs based on selected operative
  const filteredJobs = selectedOperative
    ? rosterResponse.jobs.filter((job: any) => job.operative_name === selectedOperative)
    : rosterResponse.jobs;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 flex-1 mr-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                {rosterResponse.message}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Trip Visualization
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Visual representation of delivery routes and locations
          </p>
        </div>
        <div className="border-t border-gray-200">
          <RosterMap jobs={rosterResponse.jobs} selectedOperative={selectedOperative} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Roster
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Showing {filteredJobs.length} assignments - Filter, sort, and export the results
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="operative-filter" className="text-sm font-medium text-gray-700">
              Filter by Operative:
            </label>
            <select
              id="operative-filter"
              value={selectedOperative || ''}
              onChange={(e) => setSelectedOperative(e.target.value || null)}
              className="rounded-md border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Operatives</option>
              <option value="">Unassigned</option>
              {operatives.map((operative) => (
                <option key={operative} value={operative}>
                  {operative}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="border-t border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                    #
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Client
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Location
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Start Time
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Duration
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Operative
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredJobs.map((job: any, index: number) => (
                  <tr key={job.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm ${
                        job.operative_name ? 'bg-blue-500' : 'bg-red-500'
                      }`}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      {job.client || '-'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {job.location.name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {job.start_time ? formatTime(job.start_time) : formatTime(job.entry_time)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {job.duration_min} mins
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        job.operative_name ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {job.operative_name ? 'Assigned' : 'Unassigned'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {job.operative_name || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}