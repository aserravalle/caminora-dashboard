import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function CollapsibleSection({
  title,
  icon,
  defaultOpen = true,
  children,
  className
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100"
      >
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>
      
      {isOpen && (
        <div className="p-4 bg-white">
          {children}
        </div>
      )}
    </div>
  );
}