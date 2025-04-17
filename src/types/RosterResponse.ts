import { AssignedJob } from "./AssignedJob";
import { Job } from "./Job";


export interface RosterResponse {
    jobs: Record<string, AssignedJob[]>;
    unassigned_jobs: Job[];
    message: string;
  }