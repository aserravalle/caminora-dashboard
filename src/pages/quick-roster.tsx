import { useState } from 'react';
import { Upload, ArrowLeft } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { OperativeRowParser } from '@/lib/operativeRowParser';
import { JobRowParser } from '@/lib/jobRowParser';
import { JobColumnMapper, OperativeColumnMapper } from '@/components/ui/column-mapper';

interface UploadedFile {
  file: File;
  dataType: 'operative' | 'job';
  headers: string[];
  columnMapping: Record<string, string>;
  data: any[];
}

interface Operative {
  id?: string;
  first_name: string;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string;
  operative_type?: string;
  default_start_time?: string;
  default_end_time?: string;
  default_days_available?: string;
}

interface Job {
  id?: string;
  entry_time: string;
  exit_time: string;
  duration_min: number;
  client?: string;
  location?: string;
  operative_type?: string;
  operative_id?: string | null;
  start_time?: string | null;
}

interface RosterRequest {
  operatives: Operative[];
  jobs: Job[];
}

interface RosterResponse {
  message: string;
  jobs: Job[];
}

const ColumnMapper: React.FC<{
  file: UploadedFile;
  onMappingSubmit: (mapping: Record<string, string>) => void;
  onNext: () => void;
  isLastFile: boolean;
}> = ({ file, onMappingSubmit, onNext, isLastFile }) => {
  if (file.dataType === 'job') {
    return (
      <JobColumnMapper
        headers={file.headers}
        onMappingSubmit={onMappingSubmit}
        onNext={onNext}
        isLastFile={isLastFile}
      />
    );
  }
  return (
    <OperativeColumnMapper
      headers={file.headers}
      onMappingSubmit={onMappingSubmit}
      onNext={onNext}
      isLastFile={isLastFile}
    />
  );
};

export function QuickRosterPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState<number | null>(null);
  const [parsedOperatives, setParsedOperatives] = useState<Operative[]>([]);
  const [parsedJobs, setParsedJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [showColumnMapper, setShowColumnMapper] = useState(false);

  const loadSampleData = async () => {
    try {
      const [jobsResponse, operativesResponse] = await Promise.all([
        fetch('/jobs_florence.csv'),
        fetch('/salesmen_florence.csv')
      ]);

      const [jobsCsv, operativesCsv] = await Promise.all([
        jobsResponse.text(),
        operativesResponse.text()
      ]);

      const jobsFile = new File([jobsCsv], 'jobs_florence.csv', { type: 'text/csv' });
      const operativesFile = new File([operativesCsv], 'salesmen_florence.csv', { type: 'text/csv' });

      const processedFiles = await Promise.all([
        processFile(jobsFile),
        processFile(operativesFile)
      ]);

      setFiles(processedFiles);
      setCurrentFileIndex(0);
      setParsedOperatives([]);
      setParsedJobs([]);
      setError(null);
      setShowColumnMapper(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sample data');
    }
  };

  // Get all mapped columns for operatives
  const getOperativeColumns = () => {
    const operativeFile = files.find(f => f.dataType === 'operative');
    if (!operativeFile) return [];
    return Object.entries(operativeFile.columnMapping).map(([key]) => key);
  };

  // Get all mapped columns for jobs
  const getJobColumns = () => {
    const jobFile = files.find(f => f.dataType === 'job');
    if (!jobFile) return [];
    return Object.entries(jobFile.columnMapping).map(([key]) => key);
  };

  const formatColumnHeader = (column: string) => {
    return column
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const parseData = async () => {
    setProcessing(true);
    setError(null);

    try {
      const newOperatives: Operative[] = [];
      const newJobs: Job[] = [];

      for (const file of files) {
        if (file.dataType === 'operative') {
          const parser = new OperativeRowParser(file.columnMapping, 'temp-org-id');
          for (const row of file.data) {
            try {
              const operative = await parser.parseRow(row);
              newOperatives.push(operative);
            } catch (err) {
              console.warn('Failed to parse operative row:', err);
            }
          }
        } else {
          const parser = new JobRowParser(file.columnMapping, 'temp-org-id');
          for (const row of file.data) {
            try {
              const job = await parser.parseRow(row);
              newJobs.push(job);
            } catch (err) {
              console.warn('Failed to parse job row:', err);
            }
          }
        }
      }

      setParsedOperatives(newOperatives);
      setParsedJobs(newJobs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process files');
    } finally {
      setProcessing(false);
    }
  };

  const handleAssignJobs = async () => {
    if (!parsedOperatives.length || !parsedJobs.length) {
      setError('Both operatives and jobs are required for assignment');
      return;
    }

    setAssigning(true);
    setError(null);

    try {
      const rosterRequest: RosterRequest = {
        operatives: parsedOperatives,
        jobs: parsedJobs,
      };

      console.log('RosterRequest payload:', JSON.stringify(rosterRequest, null, 2));

      const response = await fetch('http://localhost:3000/roster', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rosterRequest),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const rosterResponse: RosterResponse = await response.json();
      setParsedJobs(rosterResponse.jobs);
      console.log(rosterResponse.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign jobs');
    } finally {
      setAssigning(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    try {
      const processedFiles = await Promise.all(selectedFiles.map(processFile));
      setFiles(processedFiles);
      setCurrentFileIndex(0);
      setParsedOperatives([]);
      setParsedJobs([]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process files');
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    try {
      const processedFiles = await Promise.all(droppedFiles.map(processFile));
      setFiles(processedFiles);
      setCurrentFileIndex(0);
      setParsedOperatives([]);
      setParsedJobs([]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process files');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const processFile = async (file: File): Promise<UploadedFile> => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    let data: any[] = [];

    if (fileExtension === 'csv') {
      const text = await file.text();
      const result = Papa.parse(text, { header: true, skipEmptyLines: true });
      data = result.data;
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      data = XLSX.utils.sheet_to_json(worksheet);
    } else {
      throw new Error(`Unsupported file type: ${fileExtension}`);
    }

    const dataType = file.name.toLowerCase().includes('job') || file.name.toLowerCase().includes('services') 
      ? 'job' 
      : 'operative';
    const headers = Object.keys(data[0] || {});

    return {
      file,
      dataType,
      headers,
      columnMapping: {},
      data,
    };
  };

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

      <div className="grid grid-cols-2 gap-6">
        {/* File Upload Section */}
        <div className="col-span-1 bg-white rounded-lg shadow">
          <div className="p-6">
            {showColumnMapper && currentFileIndex !== null ? (
              <>
                <div className="flex items-center gap-2 mb-6">
                  <button
                    type="button"
                    onClick={() => setShowColumnMapper(false)}
                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to files
                  </button>
                  <h2 className="text-lg font-medium text-gray-900">
                    Match Columns - {files[currentFileIndex].file.name}
                  </h2>
                </div>
                <ColumnMapper
                  file={files[currentFileIndex]}
                  onMappingSubmit={(mapping) => {
                    const newFiles = [...files];
                    newFiles[currentFileIndex].columnMapping = mapping;
                    setFiles(newFiles);
                  }}
                  onNext={() => {
                    if (currentFileIndex < files.length - 1) {
                      setCurrentFileIndex(currentFileIndex + 1);
                    } else {
                      setShowColumnMapper(false);
                      setCurrentFileIndex(null);
                      parseData();
                    }
                  }}
                  isLastFile={currentFileIndex === files.length - 1}
                />
              </>
            ) : (
              <>
                <h2 className="text-lg font-medium text-gray-900">Smart Upload</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Upload your Jobs and Operatives files - our system will automatically detect which is which
                </p>

                <div className="mt-4 flex flex-col gap-4">
                  <button
                    type="button"
                    onClick={loadSampleData}
                    className="flex items-center justify-center gap-2 w-full py-4 px-6 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <FileText className="h-5 w-5" />
                    <span className="font-medium">Load Sample Data</span>
                  </button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">or</span>
                    </div>
                  </div>

                  <div
                    className="flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-300" />
                      <div className="mt-4 flex text-sm leading-6 text-gray-600">
                        <label className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500">
                          <span>Upload files</span>
                          <input
                            type="file"
                            multiple
                            accept=".csv,.xlsx,.xls"
                            className="sr-only"
                            onChange={handleFileChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs leading-5 text-gray-600">CSV or Excel files</p>
                    </div>
                  </div>
                </div>

                {files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-900">Selected files:</h3>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentFileIndex(0);
                          setShowColumnMapper(true);
                        }}
                        className="text-sm font-medium text-blue-600 hover:text-blue-500"
                      >
                        Match Columns
                      </button>
                    </div>
                    <ul className="divide-y divide-gray-100 rounded-md border border-gray-200">
                      {files.map((file, index) => (
                        <li key={index} className="flex items-center justify-between py-2 px-4 text-sm">
                          <span className="text-gray-700">{file.file.name}</span>
                          <div className="flex items-center gap-4">
                            <select
                              value={file.dataType}
                              onChange={(e) => {
                                const newFiles = [...files];
                                newFiles[index].dataType = e.target.value as 'operative' | 'job';
                                setFiles(newFiles);
                              }}
                              className="rounded-md border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="operative">Operative</option>
                              <option value="job">Job</option>
                            </select>
                            <span className="text-gray-500">{(file.file.size / 1024).toFixed(1)} KB</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {error && (
              <div className="mt-4 rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-1 bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900">Ready to Process?</h2>
            <p className="mt-1 text-sm text-gray-500">
              Upload your files to begin the assignment process
            </p>

            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`h-5 w-5 rounded-full ${parsedOperatives.length ? 'bg-green-500' : 'bg-gray-200'}`} />
                <span className="text-sm text-gray-700">
                  {parsedOperatives.length 
                    ? `${parsedOperatives.length} operatives detected`
                    : 'No operatives detected'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className={`h-5 w-5 rounded-full ${parsedJobs.length ? 'bg-green-500' : 'bg-gray-200'}`} />
                <span className="text-sm text-gray-700">
                  {parsedJobs.length
                    ? `${parsedJobs.length} jobs detected`
                    : 'No jobs detected'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleAssignJobs}
                disabled={!parsedOperatives.length || !parsedJobs.length || assigning}
                className="mt-4 w-full rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {assigning ? 'Assigning Jobs...' : 'Process and Assign Jobs'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {(parsedOperatives.length > 0 || parsedJobs.length > 0) && (
        <div className="space-y-8">
          {parsedOperatives.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Operatives Data Preview
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {parsedOperatives.length} operatives found
                </p>
              </div>
              <div className="border-t border-gray-200">
                <div className="max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        {getOperativeColumns().map((column) => (
                          <th
                            key={column}
                            scope="col"
                            className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900"
                          >
                            {formatColumnHeader(column)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {parsedOperatives.map((operative, i) => (
                        <tr key={i}>
                          {getOperativeColumns().map((column) => (
                            <td
                              key={column}
                              className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900"
                            >
                              {operative[column as keyof typeof operative] || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {parsedJobs.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Jobs Data Preview
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {parsedJobs.length} jobs found
                </p>
              </div>
              <div className="border-t border-gray-200">
                <div className="max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        {getJobColumns().map((column) => (
                          <th
                            key={column}
                            scope="col"
                            className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900"
                          >
                            {formatColumnHeader(column)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {parsedJobs.map((job, i) => (
                        <tr key={i}>
                          {getJobColumns().map((column) => (
                            <td
                              key={column}
                              className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900"
                            >
                              {column.includes('time')
                                ? new Date(job[column]).toLocaleString()
                                : job[column] || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}