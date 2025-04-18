import { Location } from "./Location";

export interface Operative {
  id?: string;

  first_name: string;
  
  location?: Location;
  
  operative_type?: string;
  default_start_time?: string;
  default_end_time?: string;
  default_days_available?: string;
}
