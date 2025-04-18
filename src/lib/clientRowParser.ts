export interface ColumnMapping {
  [key: string]: string;
}

export interface ParsedClient {
  name: string;
  email?: string | null;
  phone?: string | null;
  location?: string;
}

export class ClientRowParser {
  private columnMapping: ColumnMapping;
  private organisationId: string;
  private defaultLocation?: string;

  constructor(columnMapping: ColumnMapping, organisationId: string, defaultLocation?: string) {
    this.columnMapping = columnMapping;
    this.organisationId = organisationId;
    this.defaultLocation = defaultLocation;
  }

  public async parseRow(dataRow: Record<string, any>): Promise<ParsedClient> {
    // Name is required
    const name = this.getFieldValue(dataRow, 'name')?.toString().trim();
    if (!name) {
      throw new Error('Name is required');
    }

    const client: ParsedClient = {
      name,
    };

    // Optional fields
    const email = this.getFieldValue(dataRow, 'email')?.toString().trim();
    if (email) {
      if (!this.isValidEmail(email)) {
        throw new Error(`Invalid email format: ${email}`);
      }
      client.email = email;
    }

    const phone = this.getFieldValue(dataRow, 'phone')?.toString().trim();
    if (phone) {
      client.phone = phone;
    }

    // Location handling
    const location = this.getFieldValue(dataRow, 'location')?.toString().trim();
    if (location) {
      client.location = location;
    } else if (this.defaultLocation) {
      client.location = this.defaultLocation;
    }

    return client;
  }

  private getFieldValue(row: Record<string, any>, field: string): any {
    const mappedColumn = this.columnMapping[field];
    return mappedColumn ? row[mappedColumn] : undefined;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}