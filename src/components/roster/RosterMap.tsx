import { useEffect, useMemo, useState } from 'react';
import Map, { Marker, NavigationControl, Popup, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Location {
  name: string;
  latitude: number;
  longitude: number;
  address: string;
}

interface Job {
  id: string;
  entry_time: string;
  exit_time: string;
  duration_min: number;
  operative_type?: string;
  location: Location;
  client?: string;
  operative_name?: string;
  start_time?: string;
}

interface RosterMapProps {
  jobs: Job[];
  selectedOperative?: string | null;
}

export function RosterMap({ jobs, selectedOperative }: RosterMapProps) {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [viewport, setViewport] = useState({
    latitude: 0,
    longitude: 0,
    zoom: 13
  });

  // Calculate initial viewport based on job locations
  useEffect(() => {
    if (jobs.length > 0) {
      const lats = jobs.map(job => job.location.latitude);
      const lngs = jobs.map(job => job.location.longitude);
      
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      
      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;
      
      // Calculate zoom level based on bounds
      const latDiff = maxLat - minLat;
      const lngDiff = maxLng - minLng;
      const maxDiff = Math.max(latDiff, lngDiff);
      const zoom = Math.floor(Math.log2(360 / maxDiff)) + 1;

      setViewport({
        latitude: centerLat,
        longitude: centerLng,
        zoom: Math.min(Math.max(zoom, 10), 15) // Clamp zoom between 10 and 15
      });
    }
  }, [jobs]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Generate route lines for the selected operative
  const routeLines = useMemo(() => {
    if (!selectedOperative) return null;

    const operativeJobs = jobs
      .filter(job => job.operative_name === selectedOperative)
      .sort((a, b) => new Date(a.start_time || a.entry_time).getTime() - new Date(b.start_time || b.entry_time).getTime());

    if (operativeJobs.length < 2) return null;

    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: operativeJobs.map(job => [
          job.location.longitude,
          job.location.latitude
        ])
      }
    };
  }, [jobs, selectedOperative]);

  const filteredJobs = selectedOperative 
    ? jobs.filter(job => job.operative_name === selectedOperative)
    : jobs;

  return (
    <div className="h-[600px] w-full rounded-lg overflow-hidden">
      <Map
        {...viewport}
        onMove={evt => setViewport(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}
      >
        <NavigationControl />
        
        {/* Route lines */}
        {routeLines && (
          <Source type="geojson" data={routeLines as any}>
            <Layer
              id="route"
              type="line"
              paint={{
                'line-color': '#3b82f6',
                'line-width': 2,
                'line-dasharray': [2, 2]
              }}
            />
          </Source>
        )}

        {/* Job markers */}
        {filteredJobs.map((job, index) => (
          <Marker
            key={job.id}
            latitude={job.location.latitude}
            longitude={job.location.longitude}
            anchor="center"
            onClick={e => {
              e.originalEvent.stopPropagation();
              setSelectedJob(job);
            }}
          >
            <div 
              className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-medium cursor-pointer ${
                job.operative_name 
                  ? 'bg-blue-500 hover:bg-blue-600' 
                  : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {index + 1}
            </div>
          </Marker>
        ))}

        {selectedJob && (
          <Popup
            latitude={selectedJob.location.latitude}
            longitude={selectedJob.location.longitude}
            anchor="bottom"
            onClose={() => setSelectedJob(null)}
            closeButton={true}
            closeOnClick={false}
          >
            <div className="p-2">
              <h3 className="font-semibold text-sm mb-1">
                {selectedJob.client || 'Unnamed Client'}
              </h3>
              <p className="text-xs text-gray-600 mb-2">
                {selectedJob.location.address}
              </p>
              <div className="space-y-1 text-xs">
                <p>
                  <span className="font-medium">Duration:</span>{' '}
                  {selectedJob.duration_min} mins
                </p>
                <p>
                  <span className="font-medium">Window:</span>{' '}
                  {formatTime(selectedJob.entry_time)} - {formatTime(selectedJob.exit_time)}
                </p>
                {selectedJob.operative_name && (
                  <>
                    <p>
                      <span className="font-medium">Assigned to:</span>{' '}
                      {selectedJob.operative_name}
                    </p>
                    {selectedJob.start_time && (
                      <p>
                        <span className="font-medium">Start time:</span>{' '}
                        {formatTime(selectedJob.start_time)}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}