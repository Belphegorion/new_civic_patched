import React, { useEffect, useRef } from 'react';
import { useReports } from '../../../contexts/ReportsContext.jsx';
import LoadingSpinner from '../LoadingSpinner.jsx';

// L is now a global variable because we included it in index.html,
// but we add this comment to make ESLint happy.
/* global L */

const InteractiveMap = () => {
  const { reports, loading } = useReports();
  
  // Create a ref for the map container div
  const mapContainerRef = useRef(null);
  // Create a ref to hold the map instance itself
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    // This effect runs only once when the component mounts.
    // The code inside here will only run on the client side.

    // 1. Check if the map container exists and if a map hasn't been created yet.
    if (mapContainerRef.current && !mapInstanceRef.current) {
      // 2. Create a new map instance
      const map = L.map(mapContainerRef.current).setView([40.7128, -74.0060], 12); // Set initial view

      // 3. Add the tile layer (the map images)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      
      // 4. Store the map instance in our ref so it persists between renders
      mapInstanceRef.current = map;
    }

    // This cleanup function will be called when the component is unmounted
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // The empty dependency array ensures this effect runs only once.


  // This second effect runs whenever the 'reports' data changes.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && Array.isArray(reports)) {
      // Clear existing markers first (optional, but good practice)
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          map.removeLayer(layer);
        }
      });
      
      // Add a new marker for each report
      reports.forEach(report => {
        if (report?.location?.coordinates) {
          const lat = report.location.coordinates[1];
          const lng = report.location.coordinates[0];
          L.marker([lat, lng]).addTo(map)
            .bindPopup(`<strong>${report.title}</strong>`);
        }
      });
    }
  }, [reports]); // This effect depends on the reports data

  if (loading && (!reports || reports.length === 0)) {
    return <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>;
  }

  // Render a simple div. The useEffect hook will populate it with the map.
  return (
    <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }}>
      {/* The map will be created here by Leaflet */}
    </div>
  );
};

export default InteractiveMap;
