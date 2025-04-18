import { Operative } from "./Operative";
import { Job } from "./Job";


export interface RosterRequest {
    operatives: Operative[];
    jobs: Job[];
}