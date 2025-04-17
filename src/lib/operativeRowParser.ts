import { supabase } from './supabase';

export interface ColumnMapping {
  [key: string]: string;
}

export interface ParsedOperative {
  first_name: string;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string;
  location_id?: string;
  operative_type?: string;
  default_start_time?: string;
  default_end_time?: string;
  default_days_available?: string;
}

export class OperativeRowParser {
  private columnMapping: ColumnMapping;
  private defaultLocation?: { id: string; name: string };

  constructor(columnMapping: ColumnMapping, defaultLocation?: { id: string; name: string }) {
    this.columnMapping = columnMapping;
    this.defaultLocation = defaultLocation;
  }

  public async parseRow(dataRow: Record<string, any>): Promise<ParsedOperative> {
    // First name is required
    const firstName = this.getFieldValue(dataRow, 'first_name')?.toString().trim();
    if (!firstName) {
      throw new Error('First name is required');
    }

    const operative: ParsedOperative = {
      first_name: firstName,
    };

    // Optional fields
    const lastName = this.getFieldValue(dataRow, 'last_name')?.toString().trim();
    if (lastName) {
      operative.last_name = lastName;
    }

    const email = this.getFieldValue(dataRow, 'email')?.toString().trim();
    if (email) {
      if (!this.isValidEmail(email)) {
        throw new Error(`Invalid email format: ${email}`);
      }
      operative.email = email;
    }

    const phone = this.getFieldValue(dataRow, 'phone')?.toString().trim();
    if (phone) {
      operative.phone = phone;
    }

    // Location handling
    const location = this.getFieldValue(dataRow, 'location')?.toString().trim();
    if (location) {
      operative.location = location;
    } else if (this.defaultLocation) {
      operative.location_id = this.defaultLocation.id;
      operative.location = this.defaultLocation.name;
    }

    const operativeType = this.getFieldValue(dataRow, 'operative_type')?.toString().trim();
    if (operativeType) {
      operative.operative_type = operativeType;
    }

    // Time handling
    const startTime = this.getFieldValue(dataRow, 'default_start_time');
    if (startTime) {
      const parsedStartTime = this.parseTimeValue(startTime);
      if (parsedStartTime) {
        operative.default_start_time = parsedStartTime;
      }
    }

    const endTime = this.getFieldValue(dataRow, 'default_end_time');
    if (endTime) {
      const parsedEndTime = this.parseTimeValue(endTime);
      if (parsedEndTime) {
        operative.default_end_time = parsedEndTime;
      }
    }

    const daysAvailable = this.getFieldValue(dataRow, 'default_days_available')?.toString().trim();
    if (daysAvailable && !this.isValidDaysAvailable(daysAvailable)) {
      throw new Error(`Invalid days available format: ${daysAvailable}`);
    } else if (daysAvailable) {
      operative.default_days_available = daysAvailable;
    }

    return operative;
  }

  private getFieldValue(row: Record<string, any>, field: string): any {
    const mappedColumn = this.columnMapping[field];
    return mappedColumn ? row[mappedColumn] : undefined;
  }

  private parseTimeValue(value: any): string | undefined {
    if (!value) return undefined;

    const timeStr = value.toString().trim();

    // Try parsing various formats
    const formats = [
      // HH:mm or H:mm
      /^(\d{1,2}):(\d{2})$/,
      // HH:mm:ss or H:mm:ss
      /^(\d{1,2}):(\d{2}):\d{2}$/,
      // DD-MM-YYYY HH:mm or variations
      /^.*?(\d{1,2}):(\d{2})(?::\d{2})?$/,
      // Just hours (8, 09, etc)
      /^(\d{1,2})$/
    ];

    for (const format of formats) {
      const match = timeStr.match(format);
      if (match) {
        const hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2] || '0', 10);

        if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
      }
    }

    // Try parsing as a date
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      }
    } catch {
      // Ignore parsing errors
    }

    return undefined;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private isValidDaysAvailable(days: string): boolean {
    return /^[01]{7}$/.test(days);
  }
}