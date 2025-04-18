import { supabase } from './supabase';

export interface ColumnMapping {
  [key: string]: string;
}

export interface ParsedJob {
  entry_time: string;
  exit_time: string;
  duration_min?: number;
  start_time?: string;
  operative_type?: string;
  client?: string;
  location?: string;
  operative?: string;
}

export class JobRowParser {
  private columnMapping: ColumnMapping;
  private organisationId: string;

  constructor(columnMapping: ColumnMapping, organisationId: string) {
    this.columnMapping = columnMapping;
    this.organisationId = organisationId;
  }

  public async parseRow(dataRow: Record<string, any>): Promise<ParsedJob> {
    // Get the raw values
    const entryTime = this.getFieldValue(dataRow, 'entry_time')?.toString().trim();
    const exitTime = this.getFieldValue(dataRow, 'exit_time')?.toString().trim();
    const durationMin = this.getFieldValue(dataRow, 'duration_min');

    if (!entryTime || !exitTime) {
      throw new Error('Entry time and exit time are required');
    }

    // Parse the dates
    const parsedEntryTime = this.parseDateTime(entryTime);
    const parsedExitTime = this.parseDateTime(exitTime);

    if (!parsedEntryTime || !parsedExitTime) {
      throw new Error('Invalid date/time format');
    }

    if (parsedEntryTime >= parsedExitTime) {
      throw new Error('Entry time must be before exit time');
    }

    // Calculate duration if not provided
    let duration = typeof durationMin === 'number' ? durationMin : 
                  typeof durationMin === 'string' ? parseInt(durationMin, 10) : 
                  Math.round((parsedExitTime.getTime() - parsedEntryTime.getTime()) / (1000 * 60));

    const job: ParsedJob = {
      entry_time: parsedEntryTime.toISOString(),
      exit_time: parsedExitTime.toISOString(),
      duration_min: duration,
    };

    // Optional fields
    const startTime = this.getFieldValue(dataRow, 'start_time')?.toString().trim();
    if (startTime) {
      const parsedStartTime = this.parseDateTime(startTime);
      if (parsedStartTime) {
        if (parsedStartTime < parsedEntryTime || parsedStartTime > parsedExitTime) {
          throw new Error('Start time must be between entry and exit time');
        }
        job.start_time = parsedStartTime.toISOString();
      }
    }

    const operativeType = this.getFieldValue(dataRow, 'operative_type')?.toString().trim();
    if (operativeType) {
      job.operative_type = operativeType;
    }

    const client = this.getFieldValue(dataRow, 'client')?.toString().trim();
    if (client) {
      job.client = client;
    }

    const location = this.getFieldValue(dataRow, 'location')?.toString().trim();
    if (location) {
      job.location = location;
    }

    const operative = this.getFieldValue(dataRow, 'operative')?.toString().trim();
    if (operative) {
      job.operative = operative;
    }

    return job;
  }

  private getFieldValue(row: Record<string, any>, field: string): any {
    const mappedColumn = this.columnMapping[field];
    return mappedColumn ? row[mappedColumn] : undefined;
  }

  private parseDateTime(value: string): Date | null {
    // First try direct Date parsing (handles ISO format)
    let date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date;
    }

    // Try parsing various date formats
    const formats = [
      // DD-M-YYYY HH:mm or DD/M/YYYY HH:mm
      /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})\s+(\d{1,2}):(\d{2})$/,
      // YYYY-MM-DD HH:mm
      /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})\s+(\d{1,2}):(\d{2})$/,
      // DD-MM-YYYY HH:mm
      /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})\s+(\d{1,2}):(\d{2})$/,
      // Just date (YYYY-MM-DD or DD-MM-YYYY)
      /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/,
      /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/
    ];

    for (const format of formats) {
      const match = value.match(format);
      if (match) {
        const parts = match.slice(1).map(Number);
        
        // Check if first number is year (4 digits) or day
        if (parts[0] > 1900) {
          // YYYY-MM-DD format
          date = new Date(parts[0], parts[1] - 1, parts[2]);
          if (parts[3] !== undefined) {
            date.setHours(parts[3], parts[4] || 0);
          }
        } else {
          // DD-MM-YYYY format
          date = new Date(parts[2], parts[1] - 1, parts[0]);
          if (parts[3] !== undefined) {
            date.setHours(parts[3], parts[4] || 0);
          }
        }

        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }

    // Try parsing time-only format (assumes today's date)
    const timeMatch = value.match(/^(\d{1,2}):(\d{2})$/);
    if (timeMatch) {
      date = new Date();
      date.setHours(parseInt(timeMatch[1], 10), parseInt(timeMatch[2], 10));
      return date;
    }

    return null;
  }
}