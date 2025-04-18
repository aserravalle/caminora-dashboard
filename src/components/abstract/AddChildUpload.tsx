import { useState, useRef, useCallback } from 'react';
import { Upload } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface AddChildUploadProps {
  organisationId: string;
  onSubmit: (data: any[]) => void;
  disabled?: boolean;
  ColumnMapper: React.ComponentType<{
    headers: string[];
    onMappingSubmit: (mapping: Record<string, string>) => void;
    onNext: () => void;
    isLastFile?: boolean;
  }>;
  rowParser: any;
}

export function AddChildUpload({
  organisationId,
  onSubmit,
  disabled,
  ColumnMapper,
  rowParser
}: AddChildUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [parsedData, setParsedData] = useState<any[]>([]);
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

  const handleCsvTextParse = () => {
    try {
      const result = Papa.parse(csvText, { skipEmptyLines: true });
      if (result.data.length < 2) {
        throw new Error('CSV must contain at least a header row and one data row.');
      }

      setHeaders(result.data[0].map(h => h.toString().trim()));
      setStep('map');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV text');
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

  const handleColumnMap = async (mapping: Record<string, string>) => {
    setColumnMapping(mapping);
    try {
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

      const parser = new rowParser(mapping, organisationId);
      const parsed = [];

      for (let i = 0; i < data.length; i++) {
        try {
          const row = await parser.parseRow(data[i]);
          parsed.push(row);
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

  return (
    <form id="add-child-upload" onSubmit={(e) => {
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
                <label className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500">
                  <span>Upload a file</span>
                  <input
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
            <div className="space-y-4">
              <textarea
                className="w-full h-32 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                placeholder="first_name,last_name,email,..."
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                disabled={disabled}
              />
              <button
                type="button"
                onClick={handleCsvTextParse}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={!csvText.trim() || disabled}
              >
                Parse CSV Data
              </button>
            </div>
          </div>
        </>
      )}

      {step === 'map' && headers.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Map Columns</h3>
          
          <ColumnMapper
            headers={headers}
            onMappingSubmit={handleColumnMap}
            onNext={() => setStep('preview')}
          />
        </div>
      )}

      {step === 'preview' && parsedData.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Preview Data</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  {Object.keys(parsedData[0]).map((key) => (
                    <th
                      key={key}
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {parsedData.map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((value: any, i) => (
                      <td
                        key={i}
                        className="whitespace-nowrap px-3 py-4 text-sm text-gray-500"
                      >
                        {value || '-'}
                      </td>
                    ))}
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
            Back to column mapping
          </button>
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add Data
          </button>
        </div>
      )}
    </form>
  );
}