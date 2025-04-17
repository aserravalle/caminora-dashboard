import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';

interface OperativeSelectProps {
  value: string;
  organisationId: string;
  operativeTypeId?: string;
  onChange: (operativeId: string, operativeName: string) => void;
  className?: string;
  error?: string;
}

interface Operative {
  id: string;
  first_name: string;
  last_name: string | null;
}

export function OperativeSelect({
  value,
  organisationId,
  operativeTypeId,
  onChange,
  className,
  error
}: OperativeSelectProps) {
  const [open, setOpen] = useState(false);
  const [operatives, setOperatives] = useState<Operative[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedOperative, setSelectedOperative] = useState<Operative | null>(null);

  useEffect(() => {
    async function loadOperatives() {
      try {
        const query = supabase
          .from('operatives')
          .select('id, first_name, last_name')
          .eq('organisation_id', organisationId)
          .order('first_name');

        if (operativeTypeId) {
          query.eq('operative_type_id', operativeTypeId);
        }

        const { data } = await query;

        if (data) {
          setOperatives(data);
          if (value) {
            const selected = data.find(op => op.id === value);
            if (selected) {
              setSelectedOperative(selected);
              setInputValue(`${selected.first_name} ${selected.last_name || ''}`);
            }
          }
        }
      } catch (error) {
        console.error('Error loading operatives:', error);
      }
    }

    if (organisationId) {
      loadOperatives();
    }
  }, [organisationId, operativeTypeId, value]);

  const getOperativeName = (operative: Operative) => {
    return `${operative.first_name} ${operative.last_name || ''}`.trim();
  };

  const filteredOperatives = operatives.filter(operative =>
    getOperativeName(operative).toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setOpen(true);
    
    if (selectedOperative && newValue !== getOperativeName(selectedOperative)) {
      setSelectedOperative(null);
      onChange('', newValue);
    }
  };

  const handleSelectOperative = (operative: Operative) => {
    setSelectedOperative(operative);
    setInputValue(getOperativeName(operative));
    onChange(operative.id, getOperativeName(operative));
    setOpen(false);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setOpen(false);
    }, 200);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Operative
      </label>
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          onBlur={handleBlur}
          className={cn(
            'flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-red-300' : 'border-gray-200',
            className
          )}
          placeholder="Start typing to search operatives..."
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
      {open && filteredOperatives.length > 0 && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {filteredOperatives.map((operative) => (
            <button
              key={operative.id}
              onClick={() => handleSelectOperative(operative)}
              className={cn(
                'relative w-full cursor-pointer select-none py-2 pl-3 pr-9 text-left hover:bg-gray-50',
                selectedOperative?.id === operative.id ? 'bg-blue-50' : ''
              )}
            >
              <span className="block truncate">{getOperativeName(operative)}</span>
              {selectedOperative?.id === operative.id && (
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