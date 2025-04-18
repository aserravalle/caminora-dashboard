export type Location = 
  | { name: string, latitude: number; longitude: number; address?: string } // both lat & long required, address optional
  | { name: string, address: string; latitude?: never; longitude?: never } // only address, no lat/long
