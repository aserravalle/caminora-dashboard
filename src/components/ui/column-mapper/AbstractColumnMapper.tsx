import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateInitialMapping } from '@/lib/columnMatcher';

export interface ColumnMapping {
  [key: string]: string;
}

export interface ExpectedField {
  key: string;
  label: string;
  required?: boolean;
}

interface AbstractColumnMapperProps {
  headers: string[];
  expectedFields: ExpectedField[];
  onMappingSubmit: (mapping: ColumnMapping) => void;
  onNext: () => void;
  isLastFile?: boolean;
  className?: string;
  dataType: 'operative' | 'job';
}

export function AbstractColumnMapper({
  headers,
  expectedFields,
  onMappingSubmit,
  onNext,
  isLastFile = true,
  className,
  dataType
}: AbstractColumnMapperProps) {
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Generate initial mapping when headers change
    const initialMapping = generateInitialMapping(headers, dataType);
    setColumnMapping(initialMapping);
  }, [headers, dataType]);

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

  const handleSubmit = () => {
    // Validate required fields
    const missingFields = expectedFields
      .filter(field => field.required && !Object.keys(columnMapping).includes(field.key))
      .map(field => field.label);

    if (missingFields.length > 0) {
      setError(`Required fields not mapped: ${missingFields.join(', ')}`);
      return;
    }

    setError(null);
    onMappingSubmit(columnMapping);
    onNext();
  };

  return (
    <div className={cn("space-y-6", className)}>
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
                    <div className="relative">
                      <select
                        className="rounded-md border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500 w-full"
                        value={mappedField || ''}
                        onChange={(e) => handleColumnMap(header, e.target.value || null)}
                      >
                        <option value="">Don't import</option>
                        {expectedFields.map(({ key, label, required }) => (
                          <option
                            key={key}
                            value={key}
                            disabled={key in columnMapping && columnMapping[key] !== header}
                          >
                            {label}{required ? ' *' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
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

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {isLastFile ? 'Submit Mapping' : 'Next File'}
        </button>
      </div>
    </div>
  );
}