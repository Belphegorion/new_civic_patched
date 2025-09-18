import React, { useState, useEffect } from 'react';
import Modal from '../shared/Modal.jsx';
import { useReports } from '../../contexts/ReportsContext.jsx';
import { adminService } from '../../services/adminService.js';
import StatusBadge from '../shared/StatusBadge.jsx';
import { Link } from 'react-router-dom';

const ManageReportModal = ({ report, isOpen, onClose }) => {
    const { updateReport, loading } = useReports();
    const [status, setStatus] = useState(report.status);
    const [departmentId, setDepartmentId] = useState(report.assignedDepartment?._id || 'dept_4');
    const [departments, setDepartments] = useState([]);
    
    useEffect(() => {
        adminService.getDepartments().then(setDepartments);
        setStatus(report.status);
        setDepartmentId(report.assignedDepartment?._id || 'dept_4');
    }, [report]);

    const handleSave = async () => {
        await updateReport(report._id, { status, assignedDepartment: departmentId });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Manage: ${report.title}`}>
            <div className="space-y-4">
                <div className="p-4 bg-light-gray rounded-lg">
                    <p className="font-semibold">Current Status: <StatusBadge status={report.status} /></p>
                    <Link to={`/report/${report._id}`} className="text-sm text-primary hover:underline mt-2 block">View Full Report Details →</Link>
                </div>
                <div>
                    <label className="block text-sm font-medium">Update Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 w-full rounded-md border-gray-300">
                        <option>Submitted</option><option>Acknowledged</option><option>In Progress</option><option>Resolved</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium">Assign Department</label>
                    <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="mt-1 w-full rounded-md border-gray-300">
                        {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                </div>
                <div className="flex justify-end pt-4 space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                    <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-primary text-white rounded-md disabled:opacity-50">{loading ? 'Saving...' : 'Save'}</button>
                </div>
            </div>
        </Modal>
    );
};
export default ManageReportModal;