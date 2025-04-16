import { useState, useRef, useCallback } from 'react';
import { Upload, X } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { OperativeRowParser, type ColumnMapping, type ParsedOperative } from '@/lib/operativeRowParser';

interface AddOperativeUploadProps {
  organisationId: string;
  onSubmit: (operatives: any[]) => void;
  disabled?: boolean;
}

const EXPECTED_FIELDS = {
  first_name: 'First Name',
  last_name: 'Last Name',
  email: 'Email',
  phone: 'Phone',
  location: 'Location',
  operative_type: 'Operative Type',
  default_start_time: 'Start Time',
  default_end_time: 'End Time',
  default_days_available: 'Working Days',
} as const;

export function AddOperativeUpload({
  organisationId,
  onSubmit,
  disabled
}: AddOperativeUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [parsedData, setParsedData] = useState<ParsedOperative[]>([]);
  const [step, setStep] = useState<'upload' | 'map' | 'preview'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    try {
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      let data: string[][] = [];

      if (fileExtension === 'csv') {
        const text = await selectedFile.text();
        const result = Papa.parse(text, { skipEmptyLines: true });
        data = result.data as string[][];
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      } else {
        throw new Error('Unsupported file type. Please upload a CSV or Excel file.');
      }

      if (data.length < 2) {
        throw new Error('File must contain at least a header row and one data row.');
      }

      setHeaders(data[0].map(h => h.toString().trim()));
      setFile(selectedFile);
      setStep('map');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    }
  };

  const handleCsvTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setCsvText(text);

    try {
      const result = Papa.parse(text, { skipEmptyLines: true });
      if (result.data.length < 2) {
        setError('CSV must contain at least a header row and one data row.');
        return;
      }

      setHeaders(result.data[0].map(h => h.toString().trim()));
      setStep('map');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV text');
    }
  };

  const handleColumnMap = (header: string, field: string | null) => {
    setColumnMapping(prev => {
      const newMapping = { ...prev };
      
      // Remove any existing mapping for this header
      Object.keys(newMapping).forEach(key => {
        if (newMapping[key] === header) {
          delete newMapping[key];
        }
      });

      // Add new mapping if field is selected
      if (field) {
        newMapping[field] = header;
      }

      return newMapping;
    });
  };

  const handlePreview = async () => {
    try {
      if (!columnMapping.first_name) {
        throw new Error('First name mapping is required');
      }

      let data: Record<string, any>[] = [];
      if (file) {
        if (file.name.endsWith('.csv')) {
          const text = await file.text();
          const result = Papa.parse(text, { header: true, skipEmptyLines: true });
          data = result.data;
        } else {
          const arrayBuffer = await file.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer);
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          data = XLSX.utils.sheet_to_json(worksheet);
        }
      } else {
        const result = Papa.parse(csvText, { header: true, skipEmptyLines: true });
        data = result.data;
      }

      const parser = new OperativeRowParser(columnMapping, organisationId);
      const parsed: ParsedOperative[] = [];

      for (let i = 0; i < data.length; i++) {
        try {
          const operative = await parser.parseRow(data[i]);
          parsed.push(operative);
        } catch (err) {
          throw new Error(`Row ${i + 2}: ${err instanceof Error ? err.message : 'Invalid data'}`);
        }
      }

      setParsedData(parsed);
      setStep('preview');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse data');
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(droppedFile);
        fileInputRef.current.files = dataTransfer.files;
        fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } else {
      setError('Please upload a CSV or Excel file');
    }
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <form id="add-operative-upload" onSubmit={(e) => {
      e.preventDefault();
      onSubmit(parsedData);
    }} className="space-y-6">
      {step === 'upload' && (
        <>
          <div
            className="flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-300" />
              <div className="mt-4 flex text-sm leading-6 text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500"
                >
                  <span>Upload a file</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="sr-only"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    disabled={disabled}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs leading-5 text-gray-600">CSV or Excel files</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Or paste CSV data directly:
            </label>
            <textarea
              className="w-full h-32 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              placeholder="first_name,last_name,email,..."
              value={csvText}
              onChange={handleCsvTextChange}
              disabled={disabled}
            />
          </div>
        </>
      )}

      {step === 'map' && headers.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Map Columns</h3>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Map your file's columns to the expected fields. Only First Name is required.
            </p>

            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Your Column
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Maps To
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {headers.map((header) => {
                    const mappedField = Object.entries(columnMapping).find(([_, value]) => value === header)?.[0];
                    
                    return (
                      <tr key={header}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {header}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <select
                            className="rounded-md border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500"
                            value={mappedField || ''}
                            onChange={(e) => handleColumnMap(header, e.target.value || null)}
                          >
                            <option value="">Don't import</option>
                            {Object.entries(EXPECTED_FIELDS).map(([field, label]) => (
                              <option
                                key={field}
                                value={field}
                                disabled={field in columnMapping && columnMapping[field] !== header}
                              >
                                {label}{field === 'first_name' ? ' *' : ''}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {mappedField && (
                            <button
                              type="button"
                              onClick={() => handleColumnMap(header, null)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePreview}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Preview Data
          </button>
        </div>
      )}

      {step === 'preview' && parsedData.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Preview Data</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                    First Name
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Last Name
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Email
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Phone
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Location
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Type
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {parsedData.map((operative, index) => (
                  <tr key={index}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                      {operative.first_name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {operative.last_name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {operative.email}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {operative.phone}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {operative.location}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {operative.operative_type}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {step === 'preview' && (
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setStep('map')}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Not what you expected? Go back to column mapping
          </button>
        </div>
      )}
    </form>
  );
}