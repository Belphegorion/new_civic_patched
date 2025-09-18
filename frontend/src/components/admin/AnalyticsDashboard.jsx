import React, { useState, useEffect } from 'react';
import { ChartBarIcon, ClockIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import apiService from '../../services/apiService';

const MetricCard = ({ title, value, subtitle, icon: Icon, color = 'blue' }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className={`text-3xl font-bold text-${color}-600`}>{value}</p>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <Icon className={`h-12 w-12 text-${color}-500`} />
    </div>
  </div>
);

const AnalyticsDashboard = () => {
  const [metrics, setMetrics] = useState({
    effectiveness: {},
    departments: [],
    trends: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [effectiveness, departments, trends] = await Promise.all([
        apiService.get('/analytics/effectiveness'),
        apiService.get('/analytics/departments'),
        apiService.get('/analytics/trends?timeframe=30d')
      ]);

      setMetrics({
        effectiveness: effectiveness.data.effectiveness,
        departments: departments.data.metrics,
        trends: trends.data.trends
      });
    } catch (error) {
      console.error('Analytics fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const { effectiveness, departments } = metrics;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Reports"
          value={effectiveness.totalReports || 0}
          icon={ChartBarIcon}
          color="blue"
        />
        <MetricCard
          title="Resolution Rate"
          value={`${effectiveness.resolutionRate || 0}%`}
          subtitle={`${effectiveness.resolvedReports || 0} resolved`}
          icon={CheckCircleIcon}
          color="green"
        />
        <MetricCard
          title="Avg Resolution Time"
          value={`${Math.round((effectiveness.avgResolutionTime || 0) / (1000 * 60 * 60))}h`}
          subtitle="Hours to resolve"
          icon={ClockIcon}
          color="yellow"
        />
        <MetricCard
          title="Active Departments"
          value={departments.length}
          subtitle="Processing reports"
          icon={ExclamationTriangleIcon}
          color="purple"
        />
      </div>

      {/* Department Performance */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Reports
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resolved
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resolution Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {departments.map((dept, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {dept._id || 'Unassigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dept.totalReports}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dept.resolved}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {((dept.resolved / dept.totalReports) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;