import { transformRequest, transformResponse } from '@/lib/apiTransformer';

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT_PRODUCTION || "https://travelling-salesman-backend-production.up.railway.app/assign_jobs";

export interface RosterRequest {
  jobs: Job[];
  operatives: Operative[];
}

export interface RosterResponse {
  jobs: Job[];
  message: string;
}

interface Job {
  id: string;
  entry_time: string;
  exit_time: string;
  duration_min: number;
  operative_type?: string;
  location: {
    name: string;
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  client?: string;
  operative_name?: string;
  start_time?: string;
}

interface Operative {
  id?: string;
  first_name: string;
  last_name?: string;
  location?: string;
  default_start_time?: string;
  default_end_time?: string;
}

export const generateRoster = async (rosterRequest: RosterRequest): Promise<RosterResponse> => {
  try {
    // Transform the request to legacy format
    const legacyRequest = transformRequest(rosterRequest);

    // Make the API call
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(legacyRequest),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    // Transform the response back to our format
    const legacyResponse = await response.json();
    return transformResponse(legacyResponse);
  } 
  catch (error) {
    console.error('Error generating roster:', error);
    return mockRosterResponse();
  }
};

const mockRosterResponse = (): RosterResponse => {
  return {
    jobs: [
      {
        id: "1",
        entry_time: "2025-02-05T09:00:00",
        exit_time: "2025-02-05T12:00:00",
        duration_min: 60,
        operative_type: "Cleaner",
        location: {
          name: "New York 1",
          latitude: 40.7128,
          longitude: -74.006,
          address: "123 Main St, New York, NY 10001, USA",
        },
        client: "Airbnb 1",
        operative_name: "Ann",
        start_time: "2025-02-05T09:30:00"
      },
      {
        id: "2",
        entry_time: "2025-02-05T11:30:00",
        exit_time: "2025-02-05T13:00:00",
        duration_min: 30,
        operative_type: "Cleaner",
        location: {
          name: "New York 2",
          latitude: 40.714,
          longitude: -74.005,
          address: "456 Madison Avenue, New York, NY 10001, USA",
        },
        client: "Airbnb 2",
        operative_name: "Bob",
        start_time: "2025-02-05T11:30:00"
      },
      {
        id: "3",
        entry_time: "2025-02-05T14:00:00",
        exit_time: "2025-02-05T16:30:00",
        duration_min: 45,
        location: {
          name: "New York 3",
          latitude: 40.711,
          longitude: -74.009,
          address: "789 Wall St, New York, NY 10001, USA",
        },
        client: "Airbnb 3"
      },
      {
        id: "4",
        entry_time: "2025-02-05T09:00:00",
        exit_time: "2025-02-05T12:00:00",
        duration_min: 60,
        operative_type: "Cleaner",
        location: {
          name: "New York 4",
          latitude: 40.719,
          longitude: -74.008,
          address: "123 Main St, New York, NY 10001, USA",
        },
        client: "Airbnb 4",
        operative_name: "Ann",
        start_time: "2025-02-05T09:30:00"
      },
      {
        id: "5",
        entry_time: "2025-02-05T11:30:00",
        exit_time: "2025-02-05T13:00:00",
        duration_min: 30,
        operative_type: "Cleaner",
        location: {
          name: "New York 5",
          latitude: 40.713,
          longitude: -74.015,
          address: "456 Madison Avenue, New York, NY 10001, USA",
        },
        client: "Airbnb 5",
        operative_name: "Ann",
        start_time: "2025-02-05T11:30:00"
      },
      {
        id: "6",
        entry_time: "2025-02-05T14:00:00",
        exit_time: "2025-02-05T16:30:00",
        duration_min: 45,
        location: {
          name: "New York 6",
          latitude: 40.712,
          longitude: -74.01,
          address: "789 Wall St, New York, NY 10001, USA",
        },
        client: "Airbnb 6"
      }
    ],
    message: "Roster completed with some jobs unassigned"
  };
};