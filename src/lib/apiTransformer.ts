import { RosterRequest, RosterResponse } from '@/services/api';

interface LegacyJob {
  job_id: string;
  client_name: string;
  date: string;
  location: {
    address: string;
  };
  duration_mins: number;
  entry_time: string;
  exit_time: string;
}

interface LegacySalesman {
  salesman_id: string;
  salesman_name: string;
  location: {
    address: string;
  };
  start_time: string;
  end_time: string;
}

interface LegacyRequest {
  jobs: LegacyJob[];
  salesmen: LegacySalesman[];
}

interface LegacyResponse {
  jobs: {
    [key: string]: {
      job_id: string;
      client_name: string;
      date: string;
      location: {
        latitude: number;
        longitude: number;
        address: string;
      };
      duration_mins: number;
      entry_time: string;
      exit_time: string;
      salesman_id: string;
      salesman_name: string;
      start_time: string;
      cluster: number;
    }[];
  };
  unassigned_jobs: string[];
  message: string;
}

export function transformRequest(request: RosterRequest): LegacyRequest {
  // Transform jobs
  let jobIdCounter = 0;
  function getJobId(): string {
    ++jobIdCounter
    return (jobIdCounter).toString();
  }
  
  // Transform jobs
  let operativeIdCounter = 0;
  function getOperativeId(): string {
    ++operativeIdCounter;
    return (100 + operativeIdCounter).toString();
  }

  function convertDateTimeToDateTimeString(datetimeString: string): string {
    // Convert to Date object
    const date = new Date(datetimeString);

    // Format components with padding
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mi = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');

    // Format final string
    const formatted = `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
    return formatted;
  }

  function convertTimeToDateTime(date: Date, time: string): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const dd = String(date.getDate()).padStart(2, '0');
    const dateString = `${yyyy}-${mm}-${dd}`;
    
    // Combine date and time
    const result = `${dateString} ${time}`;
    return result
  }

  const jobs = request.jobs.map((job) => ({
    job_id: getJobId(),
    client_name: job.client || '',
    date: convertDateTimeToDateTimeString(job.entry_time),
    location: {
      address: job.location || '',
    },
    duration_mins: job.duration_min,
    entry_time: convertDateTimeToDateTimeString(job.entry_time),
    exit_time: convertDateTimeToDateTimeString(job.exit_time),
  }));

  const date = new Date(jobs[0].entry_time);

  // Transform operatives to salesmen
  const salesmen = request.operatives.map((operative) => ({
    salesman_id: getOperativeId(),
    salesman_name: `${operative.first_name} ${operative.last_name || ''}`.trim(),
    location: {
      address: operative.location || '',
    },
    start_time: convertTimeToDateTime(date, operative.default_start_time || '09:00:00'),
    end_time: convertTimeToDateTime(date, operative.default_end_time || '17:00:00'),
  }));

  return { jobs, salesmen };
}

export function transformResponse(response: LegacyResponse): RosterResponse {
  const jobs: RosterResponse['jobs'] = [];

  // Process assigned jobs
  Object.entries(response.jobs).forEach(([salesmanId, assignedJobs]) => {
    assignedJobs.forEach((job) => {
      jobs.push({
        id: job.job_id,
        entry_time: job.entry_time,
        exit_time: job.exit_time,
        duration_min: job.duration_mins,
        location: {
          name: job.location.address,
          latitude: job.location.latitude,
          longitude: job.location.longitude,
          address: job.location.address,
        },
        client: job.client_name,
        operative_name: job.salesman_name,
        start_time: job.start_time,
      });
    });
  });

  // Process unassigned jobs if any
  response.unassigned_jobs.forEach((jobId) => {
    const matchingJob = jobs.find(j => j.id === jobId);
    if (matchingJob) {
      matchingJob.operative_name = undefined;
      matchingJob.start_time = undefined;
    }
  });

  return {
    jobs,
    message: response.message,
  };
}