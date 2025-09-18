import React, { createContext, useState, useCallback, useContext } from 'react';
import { reportsService } from '../services/reportsService.js';

const ReportsContext = createContext();

export const useReports = () => {
    const context = useContext(ReportsContext);
    if (context === undefined) {
        throw new Error('useReports must be used within a ReportsProvider');
    }
    return context;
};

export const ReportsProvider = ({ children }) => {
    // --- STATE CHANGES ---
    // 1. 'reports' is ALWAYS initialized as an empty array [] to prevent .filter crashes.
    const [reports, setReports] = useState([]);
    // 2. We add a new state to hold the pagination info sent from the backend.
    const [paginationInfo, setPaginationInfo] = useState({});
    
    const [report, setReport] = useState(null); // This is for the single report details page.
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- LOGIC UPDATE for fetchReports ---
    const fetchReports = useCallback(async (filters = {}) => {
        setLoading(true);
        setError(null);
        try {
            // The backend now sends an object: { reports: [], page: 1, ... }
            const data = await reportsService.getAllReports(filters);

            // We must check if the data and its 'reports' property exist and are an array.
            if (data && Array.isArray(data.reports)) {
                setReports(data.reports); // Update state with ONLY the array of reports.
                setPaginationInfo({ // Update the pagination state with the rest of the data.
                    page: data.page,
                    pages: data.pages,
                    total: data.total,
                });
            } else {
                // If the response is malformed, default to an empty state.
                setReports([]);
                setPaginationInfo({});
            }
        } catch (err) {
            console.error("Failed to fetch reports:", err);
            setError(err);
            setReports([]); // CRITICAL: On error, ensure reports is still an array.
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchReportById = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        try {
            const data = await reportsService.getReportById(id);
            setReport(data);
        } catch (err) { setError(err); } finally { setLoading(false); }
    }, []);

    const createReport = useCallback(async (reportData) => {
        const newReport = await reportsService.createReport(reportData);
        // Add the new report to the start of the existing reports array.
        setReports(prev => [newReport, ...prev]);
        return newReport;
    }, []);

    const updateReport = useCallback(async (id, data) => {
        const updatedReport = await reportsService.updateReport(id, data);
        setReports(prev => prev.map(r => r._id === id ? updatedReport : r));
        if (report?._id === id) setReport(updatedReport);
        return updatedReport;
    }, [report]);

    // Add paginationInfo to the provided context value.
    const value = { reports, report, paginationInfo, loading, error, fetchReports, fetchReportById, createReport, updateReport };

    return (
        <ReportsContext.Provider value={value}>
            {children}
        </ReportsContext.Provider>
    );
};