import { Job } from "./Job";


export interface AssignedJob extends Job {
    salesman_id: string | null;
    start_time: string | null;
  
    client_name?: string;
    salesman_name?: string;
  }