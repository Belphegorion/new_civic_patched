import React, { useEffect, useState } from 'react';
import { useReports } from '../../contexts/ReportsContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import LoadingSpinner from '../shared/LoadingSpinner.jsx';
import StatusBadge from '../shared/StatusBadge.jsx';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { EyeIcon } from '@heroicons/react/24/outline';

const MyReports = () => {
  // Ensure 'reports' defaults to an empty array to prevent render errors.
  const { reports = [], loading, fetchReports } = useReports();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user, fetchReports]);

  if (loading) return <LoadingSpinner />;

  // No longer needed to check if 'user' exists here because the filter on an empty array is safe.
  const myReports = reports.filter(r => r.citizen === user.id);

  if (myReports.length === 0) {
    return <p className="text-gray-500 italic p-4 text-center">You have not submitted any reports yet.</p>;
  }
  return (
    <div>
      {/* Desktop view - Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {myReports.map((report) => (
              <tr key={report._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{report.title}</td>
                <td className="px-6 py-4 text-gray-500">{format(new Date(report.createdAt), 'PP')}</td>
                <td className="px-6 py-4"><StatusBadge status={report.status} /></td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                  <Link to={`/report/${report._id}`} className="text-primary hover:underline">View Details</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Mobile view - Cards */}
      <div className="md:hidden space-y-3">
        {myReports.map((report) => (
          <div key={report._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-900 truncate pr-2">{report.title}</h3>
                <StatusBadge status={report.status} />
              </div>
              <p className="text-sm text-gray-500 mb-3">{format(new Date(report.createdAt), 'PP')}</p>
              <Link 
                to={`/report/${report._id}`} 
                className="flex items-center justify-center w-full py-2 px-3 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium"
              >
                <EyeIcon className="h-4 w-4 mr-1.5" />
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default MyReports;