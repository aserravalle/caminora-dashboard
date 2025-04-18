import { RosterRequest, RosterResponse, Location } from "@/types";

const VITE_API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || "http://localhost:8000";

export const generateRoster = async (rosterRequest: RosterRequest): Promise<RosterResponse> => {
  try {
    const response = await fetch(`${VITE_API_ENDPOINT}/generate_roster`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rosterRequest),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(errorText);
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } 
  catch (error) {
    console.error('Error assigning jobs:', error);
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
        location: {
          name: "New York 3",
          latitude: 40.711,
          longitude: -74.009,
          address: "789 Wall St, New York, NY 10001, USA",
        },
        duration_min: 45,
        entry_time: "2025-02-05T14:00:00",
        exit_time: "2025-02-05T16:30:00",
        client: "Airbnb 3"
      }
    ],
    message: "Roster completed with some jobs unassigned"
  };
};