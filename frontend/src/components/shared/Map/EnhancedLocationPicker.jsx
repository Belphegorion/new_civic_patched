import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Search } from 'lucide-react';

const EnhancedLocationPicker = ({ onLocationChange, initialLocation }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [position, setPosition] = useState(initialLocation || null);
  const [address, setAddress] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!mapInstanceRef.current && mapRef.current) {
      const L = window.L;
      
      const initialLat = initialLocation?.lat || 40.7128;
      const initialLng = initialLocation?.lng || -74.0060;
      mapInstanceRef.current = L.map(mapRef.current).setView([initialLat, initialLng], 15);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);

      // Custom marker icon
      const customIcon = L.divIcon({
        html: '<div class="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center"><div class="w-2 h-2 bg-white rounded-full"></div></div>',
        className: 'custom-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      if (initialLocation) {
        markerRef.current = L.marker([initialLocation.lat, initialLocation.lng], { icon: customIcon })
          .addTo(mapInstanceRef.current);
        reverseGeocode(initialLocation.lat, initialLocation.lng);
      }

      mapInstanceRef.current.on('click', function(e) {
        const { lat, lng } = e.latlng;
        updateLocation(lat, lng, customIcon);
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

  const updateLocation = (lat, lng, icon) => {
    if (markerRef.current) {
      mapInstanceRef.current.removeLayer(markerRef.current);
    }
    
    const L = window.L;
    markerRef.current = L.marker([lat, lng], { icon })
      .addTo(mapInstanceRef.current);
    
    const newPosition = { lat, lng };
    setPosition(newPosition);
    onLocationChange(newPosition);
    reverseGeocode(lat, lng);
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      setAddress(data.display_name || 'Unknown location');
    } catch (error) {
      setAddress('Unable to get address');
    }
  };

  const handleLocateClick = () => {
    setIsLocating(true);
    if (mapInstanceRef.current) {
      const L = window.L;
      
      mapInstanceRef.current.locate({ setView: true, maxZoom: 16 });
      
      mapInstanceRef.current.once('locationfound', function(e) {
        const { lat, lng } = e.latlng;
        const customIcon = L.divIcon({
          html: '<div class="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center"><div class="w-2 h-2 bg-white rounded-full"></div></div>',
          className: 'custom-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        
        updateLocation(lat, lng, customIcon);
        setIsLocating(false);
      });
      
      mapInstanceRef.current.once('locationerror', function() {
        alert("Location access denied or unavailable.");
        setIsLocating(false);
      });
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        
        mapInstanceRef.current.setView([lat, lng], 15);
        
        const L = window.L;
        const customIcon = L.divIcon({
          html: '<div class="w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center"><div class="w-2 h-2 bg-white rounded-full"></div></div>',
          className: 'custom-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        
        updateLocation(lat, lng, customIcon);
      }
    } catch (error) {
      alert('Search failed. Please try again.');
    }
  };

  return (
    <div className="relative h-full w-full bg-gray-100 rounded-lg overflow-hidden">
      {/* Search Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex gap-2">
        <div className="flex-1 flex bg-white rounded-lg shadow-md">
          <input
            type="text"
            placeholder="Search for a location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 px-4 py-2 border-none rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-indigo-500 text-white rounded-r-lg hover:bg-indigo-600 transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapRef} className="h-full w-full" />

      {/* Controls */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={handleLocateClick}
          disabled={isLocating}
          className="p-3 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          title="Use my location"
        >
          {isLocating ? (
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Navigation className="w-5 h-5 text-indigo-500" />
          )}
        </button>
      </div>

      {/* Address Display */}
      {address && (
        <div className="absolute bottom-4 left-4 right-20 z-10 bg-white rounded-lg shadow-md p-3">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700 leading-tight">{address}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedLocationPicker;