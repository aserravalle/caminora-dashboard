import { Operative } from "./Operative";
import { Job } from "./Job";

export interface RosterRequest {
    jobs: Job[];
    salesmen: Operative[];
  }