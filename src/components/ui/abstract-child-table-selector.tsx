import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';

interface ChildTableRecord {
  id: string;
  name: string;
}

interface AbstractChildTableSelectorProps {
  value: string;
  organisationId: string;
  onChange: (id: string, name: string) => void;
  className?: string;
  error?: string;
  tableName: string;
  label: string;
  placeholder: string;
}

export function AbstractChildTableSelector({
  value,
  organisationId,
  onChange,
  className,
  error,
  tableName,
  label,
  placeholder
}: AbstractChildTableSelectorProps) {
  const [open, setOpen] = useState(false);
  const [records, setRecords] = useState<ChildTableRecord[]>([]);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedRecord, setSelectedRecord] = useState<ChildTableRecord | null>(null);

  useEffect(() => {
    async function loadRecords() {
      try {
        const { data } = await supabase
          .from(tableName)
          .select('id, name')
          .eq('organisation_id', organisationId)
          .order('name');

        if (data) {
          setRecords(data);
          const selected = data.find(record => record.id === value);
          if (selected) {
            setSelectedRecord(selected);
            setInputValue(selected.name);
          }
        }
      } catch (error) {
        console.error(`Error loading ${tableName}:`, error);
      }
    }

    if (organisationId) {
      loadRecords();
    }
  }, [organisationId, value, tableName]);

  const filteredRecords = records.filter(record =>
    record.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setOpen(true);
    
    if (selectedRecord && newValue !== selectedRecord.name) {
      setSelectedRecord(null);
      // When user starts typing a new value, pass empty ID and current input
      onChange('', newValue);
    }
  };

  const handleSelectRecord = (record: ChildTableRecord) => {
    setSelectedRecord(record);
    setInputValue(record.name);
    onChange(record.id, record.name);
    setOpen(false);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setOpen(false);
      // When input loses focus, if there's no selected record but there is input,
      // treat it as a new item
      if (!selectedRecord && inputValue.trim()) {
        onChange('', inputValue.trim());
      }
    }, 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !selectedRecord && inputValue.trim()) {
      e.preventDefault();
      onChange('', inputValue.trim());
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            'flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-red-300' : 'border-gray-200',
            className
          )}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-600"
        >
          <ChevronsUpDown className="h-4 w-4" />
        </button>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {open && filteredRecords.length > 0 && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {filteredRecords.map((record) => (
            <button
              key={record.id}
              onClick={() => handleSelectRecord(record)}
              className={cn(
                'relative w-full cursor-pointer select-none py-2 pl-3 pr-9 text-left hover:bg-gray-50',
                selectedRecord?.id === record.id ? 'bg-blue-50' : ''
              )}
            >
              <span className="block truncate">{record.name}</span>
              {selectedRecord?.id === record.id && (
                <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                  <Check className="h-4 w-4 text-blue-600" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}