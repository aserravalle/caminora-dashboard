export interface ColumnMatch {
  key: string;
  variations: string[];
}

export const operativeMatches: ColumnMatch[] = [
  {
    key: 'first_name',
    variations: ['first_name', 'first name', 'firstname', 'given_name', 'given name', 'givenname']
  },
  {
    key: 'last_name',
    variations: ['last_name', 'last name', 'lastname', 'surname', 'family_name', 'family name']
  },
  {
    key: 'email',
    variations: ['email', 'email_address', 'emailaddress', 'e-mail', 'e_mail']
  },
  {
    key: 'phone',
    variations: ['phone', 'phone_number', 'phonenumber', 'telephone', 'tel', 'mobile', 'contact']
  },
  {
    key: 'location',
    variations: ['location', 'site', 'workplace', 'work_location', 'branch', 'office','address']
  },
  {
    key: 'operative_type',
    variations: ['operative_type', 'operative type', 'type', 'role', 'job_type', 'job type', 'position']
  },
  {
    key: 'default_start_time',
    variations: ['default_start_time', 'start time', 'starttime', 'start', 'work_start']
  },
  {
    key: 'default_end_time',
    variations: ['default_end_time', 'end time', 'endtime', 'end', 'work_end']
  },
  {
    key: 'default_days_available',
    variations: ['default_days_available', 'days available', 'working_days', 'availability', 'work_days']
  }
];

export const jobMatches: ColumnMatch[] = [
  {
    key: 'entry_time',
    variations: ['entry_time', 'entry time', 'start_time', 'start time', 'starttime', 'begin']
  },
  {
    key: 'exit_time',
    variations: ['exit_time', 'exit time', 'end_time', 'end time', 'endtime', 'finish']
  },
  {
    key: 'duration_min',
    variations: ['duration_min', 'duration', 'minutes', 'length', 'time_required', 'job_duration']
  },
  {
    key: 'location',
    variations: ['location', 'site', 'workplace', 'work_location', 'branch', 'office', 'job_location','address']
  },
  {
    key: 'operative_type',
    variations: ['operative_type', 'operative type', 'type', 'role', 'job_type', 'job type', 'worker_type']
  },
  {
    key: 'client',
    variations: ['client', 'customer', 'account', 'client_name', 'customer_name']
  },
  {
    key: 'operative',
    variations: ['operative', 'worker', 'employee', 'staff', 'assigned_to', 'assignee']
  },
  {
    key: 'start_time',
    variations: ['start_time', 'scheduled_start', 'actual_start', 'worker_start']
  }
];

export function findBestMatch(header: string, matches: ColumnMatch[]): string | null {
  // Normalize the header
  const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // First try exact matches
  for (const match of matches) {
    const normalizedVariations = match.variations.map(v => 
      v.toLowerCase().replace(/[^a-z0-9]/g, '')
    );
    
    if (normalizedVariations.includes(normalizedHeader)) {
      return match.key;
    }
  }
  
  // Then try partial matches
  for (const match of matches) {
    const normalizedVariations = match.variations.map(v => 
      v.toLowerCase().replace(/[^a-z0-9]/g, '')
    );
    
    for (const variation of normalizedVariations) {
      if (normalizedHeader.includes(variation) || variation.includes(normalizedHeader)) {
        return match.key;
      }
    }
  }
  
  return null;
}

export function generateInitialMapping(headers: string[], dataType: 'operative' | 'job' | 'client'): Record<string, string> {
  const matches = dataType === 'operative' ? operativeMatches : jobMatches;
  const mapping: Record<string, string> = {};
  const usedFields = new Set<string>();

  // First pass: look for exact matches
  headers.forEach(header => {
    const match = findBestMatch(header, matches);
    if (match && !usedFields.has(match)) {
      mapping[match] = header;
      usedFields.add(match);
    }
  });

  return mapping;
}