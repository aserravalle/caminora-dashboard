
export interface Job {
    job_id: string;
    date: string;
    location: Location;
    duration_mins: number;
    entry_time: string;
    exit_time: string;
  
    client_name?: string;
    description?: string;
  }