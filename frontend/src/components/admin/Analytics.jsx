import React, { useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { useReports } from '../../contexts/ReportsContext.jsx';
import LoadingSpinner from '../shared/LoadingSpinner.jsx';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Analytics = () => {
    const { reports, loading } = useReports();

    const stats = useMemo(() => {
        if (!reports || reports.length === 0) return { byStatus: {}, byCategory: {} };
        const byStatus = reports.reduce((acc, r) => ({...acc, [r.status]: (acc[r.status] || 0) + 1}), {});
        const byCategory = reports.reduce((acc, r) => ({...acc, [r.category]: (acc[r.category] || 0) + 1}), {});
        return { byStatus, byCategory };
    }, [reports]);

    if (loading) return <div className="flex justify-center"><LoadingSpinner /></div>;

    const statusData = {
        labels: Object.keys(stats.byStatus),
        datasets: [{ label: '# Reports', data: Object.values(stats.byStatus), backgroundColor: '#3B82F6' }],
    };
    
    const categoryData = {
        labels: Object.keys(stats.byCategory),
        datasets: [{ data: Object.values(stats.byCategory), backgroundColor: ['#EF4444', '#F97316', '#8B5CF6', '#EC4899', '#10B981'] }]
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Reports by Status</h3>
                <Bar data={statusData} options={{ responsive: true, plugins: { legend: { display: false }}}} />
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Reports by Category</h3>
                {reports.length > 0 ? (
                    <Pie data={categoryData} options={{ responsive: true, plugins: { legend: { position: 'top' }}}} />
                ) : <p className="text-gray-500">No data to display.</p>}
            </div>
        </div>
    );
};
export default Analytics;