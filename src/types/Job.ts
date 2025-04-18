import { Location } from "./Location";


export interface Job {
  // Job data
  id?: string;
  entry_time: string;
  exit_time: string;
  duration_min: number;
  operative_type?: string;
  location?: Location;

  // Client Data
  client?: string;

  // Operative Data
  operative_name?: string | null;
  start_time?: string | null;
}