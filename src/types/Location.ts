export type Location = 
  | { latitude: number; longitude: number; address?: string } // both lat & long required, address optional
  | { address: string; latitude?: never; longitude?: never } // only address, no lat/long

