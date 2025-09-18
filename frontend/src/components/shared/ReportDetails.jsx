import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useReports } from '../../contexts/ReportsContext.jsx';
import LoadingSpinner from './LoadingSpinner.jsx';
import StatusBadge from './StatusBadge.jsx';
import { format } from 'date-fns';
// --- LEAFLET IMPORTS ---
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
// -----------------------

const ReportDetails = () => {
  const { id } = useParams();
  const { report, loading, error, fetchReportById } = useReports();

  useEffect(() => {
    if (id) {
      fetchReportById(id);
    }
  }, [id, fetchReportById]);

  // Use a simple loading state; no need to check isLoaded for the map script anymore.
  if (loading) return <LoadingSpinner />;
  if (error) return <p className="text-red-500 text-center">Failed to load report details.</p>;
  if (!report) return <p className="text-center">Report not found.</p>;

  // Leaflet uses [Latitude, Longitude] format.
  const position = [
    report.location.coordinates[1], // Latitude
    report.location.coordinates[0], // Longitude
  ];

  // Add a useEffect to prevent iOS zoom on input focus
  useEffect(() => {
    const metaViewport = document.querySelector('meta[name=viewport]');
    if (metaViewport) {
      metaViewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1');
    }
    return () => {
      if (metaViewport) {
        metaViewport.setAttribute('content', 'width=device-width, initial-scale=1');
      }
    };
  }, []);

  return (
    <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">{report.title}</h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
          <StatusBadge status={report.status} />
          <p className="text-xs sm:text-sm text-gray-500">
            Reported on: {format(new Date(report.createdAt), 'MMM d, yyyy')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <img 
          src={report.photoUrl} 
          alt={report.title} 
          className="w-full h-auto rounded-lg shadow-md object-cover max-h-[300px] md:max-h-none" 
        />
        <div className="h-64 md:h-full rounded-lg overflow-hidden border">
          {/* --- REWRITTEN MAP COMPONENT --- */}
          <MapContainer center={position} zoom={16} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://door.popzoo.xyz:443/https/www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://door.popzoo.xyz:443/https/{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={position}>
              <Popup>
                <span className="text-sm">The reported issue is here.</span>
              </Popup>
            </Marker>
          </MapContainer>
          {/* ------------------------------- */}
        </div>
      </div>

      {report.aiTags?.length > 0 && (
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">AI Analysis</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            {report.aiTags.map((tag, i) => (
              <span key={i} className="px-2 sm:px-3 py-1 bg-indigo-100 text-indigo-800 text-xs sm:text-sm font-medium rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {report.audioUrl && (
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Voice Note</h2>
          <audio controls src={report.audioUrl} className="w-full mt-2" />
        </div>
      )}

      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Description</h2>
        <p className="text-gray-600 mt-2 whitespace-pre-wrap text-sm sm:text-base">{report.description}</p>
      </div>
    </div>
  );
};

export default ReportDetails;