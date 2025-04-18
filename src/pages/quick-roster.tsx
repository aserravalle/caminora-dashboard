import { useState } from 'react';
import { cn } from '@/lib/utils';
import { FileUpload } from '@/components/quick-roster/FileUpload';
import { AssignmentResults } from '@/components/quick-roster/AssignmentResults';

interface TabProps {
  id: string;
  label: string;
  count?: number;
}

const tabs: TabProps[] = [
  { id: 'upload', label: 'Upload Files' },
  { id: 'results', label: 'Assignment Results' }
];

export function QuickRosterPage() {
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [rosterResponse, setRosterResponse] = useState<any>(null);

  return (
    <div className="space-y-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">
            Quick Roster
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Upload your operatives and jobs files to quickly generate a roster
          </p>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium',
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'ml-3 hidden rounded-full py-0.5 px-2.5 text-xs font-medium md:inline-block',
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-900'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'upload' ? (
        <FileUpload 
          onAssignmentComplete={(response) => {
            setRosterResponse(response);
            setActiveTab('results');
          }}
        />
      ) : (
        <AssignmentResults rosterResponse={rosterResponse} />
      )}
    </div>
  );
}