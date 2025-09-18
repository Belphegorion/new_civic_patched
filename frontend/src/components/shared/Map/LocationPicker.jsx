import React, { useEffect, useRef, useState } from 'react';

const LocationPicker = ({ onLocationChange, initialLocation }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [position, setPosition] = useState(initialLocation || null);

  useEffect(() => {
    if (!mapInstanceRef.current && mapRef.current) {
      // Get Leaflet from global window
      const L = window.L;
      
      // Initialize map with initial location or default
      const initialLat = initialLocation?.lat || 40.7128;
      const initialLng = initialLocation?.lng || -74.0060;
      mapInstanceRef.current = L.map(mapRef.current).setView([initialLat, initialLng], 15);
      
      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);

      // Fix marker icons
      const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
      const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

      const DefaultIcon = L.icon({
        iconUrl: iconUrl,
        shadowUrl: shadowUrl,
        iconSize: [25, 41],
        iconAnchor: [12, 41]
      });

      L.Marker.prototype.options.icon = DefaultIcon;

      // Add initial marker if location provided
      if (initialLocation) {
        markerRef.current = L.marker([initialLocation.lat, initialLocation.lng])
          .addTo(mapInstanceRef.current)
          .bindPopup('Current Location')
          .openPopup();
      }

      // Add click event
      mapInstanceRef.current.on('click', function(e) {
        const { lat, lng } = e.latlng;
        
        // Remove existing marker
        if (markerRef.current) {
          mapInstanceRef.current.removeLayer(markerRef.current);
        }
        
        // Add new marker
        markerRef.current = L.marker([lat, lng])
          .addTo(mapInstanceRef.current)
          .bindPopup('Selected Location')
          .openPopup();
        
        // Update state and callback
        const newPosition = { lat, lng };
        setPosition(newPosition);
        onLocationChange(newPosition);
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [onLocationChange, initialLocation]);

  // Update map when initialLocation changes
  useEffect(() => {
    if (mapInstanceRef.current && initialLocation && !position) {
      mapInstanceRef.current.setView([initialLocation.lat, initialLocation.lng], 15);
      
      if (markerRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current);
      }
      
      const L = window.L;
      markerRef.current = L.marker([initialLocation.lat, initialLocation.lng])
        .addTo(mapInstanceRef.current)
        .bindPopup('Current Location')
        .openPopup();
      
      setPosition(initialLocation);
    }
  }, [initialLocation, position]);

  const handleLocateClick = () => {
    if (mapInstanceRef.current) {
      const L = window.L;
      
      mapInstanceRef.current.locate({ setView: true, maxZoom: 16 });
      
      mapInstanceRef.current.once('locationfound', function(e) {
        const { lat, lng } = e.latlng;
        
        // Remove existing marker
        if (markerRef.current) {
          mapInstanceRef.current.removeLayer(markerRef.current);
        }
        
        // Add new marker at user's location
        markerRef.current = L.marker([lat, lng])
          .addTo(mapInstanceRef.current)
          .bindPopup('Your Location')
          .openPopup();
        
        // Update state and callback
        const newPosition = { lat, lng };
        setPosition(newPosition);
        onLocationChange(newPosition);
      });
      
      mapInstanceRef.current.once('locationerror', function() {
        alert("Location access denied or unavailable.");
      });
    }
  };

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <div 
        ref={mapRef} 
        style={{ height: '100%', width: '100%' }}
      />
      <button 
        type="button" 
        onClick={handleLocateClick}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 1000,
          padding: '8px 12px',
          backgroundColor: 'white',
          border: '1px solid #ccc',
          borderRadius: '4px',
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
        className="leaflet-gps-button"
      >
        Use My Location
      </button>
    </div>
  );
};

export default LocationPicker;
