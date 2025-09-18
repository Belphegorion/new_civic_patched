import React, { useState } from 'react';
import ReportForm from './ReportForm.jsx';
import MyReports from './MyReports.jsx';
import InteractiveMap from '../shared/Map/InteractiveMap.jsx';

const CitizenDashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-md">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Citizen Dashboard</h1>
          <p className="text-gray-600 mt-1">Report & track community issues.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-6 py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition">Report Issue</button>
      </div>
      {isModalOpen && <ReportForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">Live Issue Map</h2>
        <div className="h-96 w-full rounded-lg overflow-hidden border"><InteractiveMap /></div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">My Reports</h2>
        <MyReports />
      </div>
    </div>
  );
};
export default CitizenDashboard;