import React, { useEffect, useState, useMemo } from 'react';
import { useReports } from '../../contexts/ReportsContext.jsx';
import LoadingSpinner from '../shared/LoadingSpinner.jsx';
import StatusBadge from '../shared/StatusBadge.jsx';
import { format } from 'date-fns';
import ManageReportModal from './ManageReportModal.jsx';

const ReportsTable = () => {
  const { reports, loading, fetchReports } = useReports();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => { fetchReports(); }, [fetchReports]);
  
  const filteredReports = useMemo(() => reports.filter(r => 
      r.title.toLowerCase().includes(searchTerm.toLowerCase())
  ), [reports, searchTerm]);

  if (loading && reports.length === 0) return <LoadingSpinner />;

  return (
    <div className="bg-white p-6 shadow-md rounded-lg">
      <input 
        type="text" 
        placeholder="Search by report title..." 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full md:w-1/3 mb-4 rounded-md border-gray-300 shadow-sm"
      />
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
             <tr>
               <th className="px-6 py-3 text-left text-xs font-medium uppercase">Title</th>
               <th className="px-6 py-3 text-left text-xs font-medium uppercase">Date</th>
               <th className="px-6 py-3 text-left text-xs font-medium uppercase">Status</th>
               <th className="px-6 py-3 text-left text-xs font-medium uppercase">Department</th>
               <th className="px-6 py-3"></th>
             </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredReports.map((report) => (
              <tr key={report._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{report.title}</td>
                <td className="px-6 py-4 text-sm">{format(new Date(report.createdAt), 'PP')}</td>
                <td className="px-6 py-4"><StatusBadge status={report.status} /></td>
                <td className="px-6 py-4 text-sm">{report.assignedDepartment?.name || 'Unassigned'}</td>
                <td className="px-6 py-4 text-right">
                   <button onClick={() => setSelectedReport(report)} className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700">Manage</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedReport && <ManageReportModal report={selectedReport} isOpen={!!selectedReport} onClose={() => setSelectedReport(null)} />}
    </div>
  );
};
export default ReportsTable;