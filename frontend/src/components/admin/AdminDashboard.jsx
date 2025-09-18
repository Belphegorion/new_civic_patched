import React, { useState, useEffect, useRef } from 'react';
import { useReports } from '../../contexts/ReportsContext.jsx';
import InteractiveMap from '../shared/Map/InteractiveMap.jsx';
import { 
  ChartBarIcon, 
  MapIcon, 
  DocumentTextIcon, 
  UsersIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  XMarkIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement);

const AdminDashboard = () => {
  const { reports, loading, fetchReports } = useReports();
  const [activeView, setActiveView] = useState('overview');
  const [isClient, setIsClient] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);

  useEffect(() => {
    setIsClient(true);
    fetchReports();
  }, [fetchReports]);
  
  // Close sidebar when clicking outside of it
  useEffect(() => {
    function handleClickOutside(event) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) && sidebarOpen) {
        setSidebarOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarOpen]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    if (!reports || reports.length === 0) {
      return {
        total: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0,
        byCategory: {},
        recentReports: [],
        monthlyData: []
      };
    }

    const pending = reports.filter(r => r.status === 'pending').length;
    const inProgress = reports.filter(r => r.status === 'in-progress').length;
    const resolved = reports.filter(r => r.status === 'resolved').length;
    
    const byCategory = reports.reduce((acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + 1;
      return acc;
    }, {});

    const recentReports = reports
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    // Mock monthly data for demo
    const monthlyData = [
      { month: 'Jan', reports: 45 },
      { month: 'Feb', reports: 52 },
      { month: 'Mar', reports: 48 },
      { month: 'Apr', reports: 61 },
      { month: 'May', reports: 55 },
      { month: 'Jun', reports: 67 }
    ];

    return {
      total: reports.length,
      pending,
      inProgress,
      resolved,
      byCategory,
      recentReports,
      monthlyData
    };
  }, [reports]);

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-card-bg rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-card hover:shadow-card-hover transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-text-secondary text-xs sm:text-sm font-medium truncate">{title}</p>
          <p className="text-lg sm:text-2xl font-bold text-text-primary mt-1">{value}</p>
          {trend && (
            <p className="text-xs text-secondary mt-1">+{trend}% from last month</p>
          )}
        </div>
        <div className={`p-2 sm:p-3 rounded-xl ${color}`}>
          <Icon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const NavButton = ({ id, label, icon: Icon, isActive, onClick, showLabel = true }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center ${showLabel ? 'space-x-2 sm:space-x-3' : 'justify-center'} px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-200 ${
        isActive 
          ? 'bg-primary text-white shadow-lg' 
          : 'text-text-secondary hover:bg-light-gray hover:text-text-primary'
      }`}
    >
      <Icon className="h-5 w-5" />
      {showLabel && <span className="text-sm sm:text-base font-medium">{label}</span>}
    </button>
  );
  
  const MobileNavButton = ({ id, label, icon: Icon, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex flex-col items-center justify-center px-2 py-1 ${isActive ? 'text-primary' : 'text-text-secondary'}`}
    >
      <Icon className="h-5 w-5 mb-1" />
      <span className="text-xs">{label}</span>
    </button>
  );

  // Chart configurations
  const monthlyChartData = {
    labels: stats.monthlyData.map(d => d.month),
    datasets: [{
      label: 'Reports',
      data: stats.monthlyData.map(d => d.reports),
      borderColor: '#6366F1',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4
    }]
  };

  const categoryChartData = {
    labels: Object.keys(stats.byCategory),
    datasets: [{
      data: Object.values(stats.byCategory),
      backgroundColor: [
        '#6366F1',
        '#10B981',
        '#F59E0B',
        '#EF4444',
        '#8B5CF6',
        '#EC4899'
      ],
      borderWidth: 0
    }]
  };

  const statusChartData = {
    labels: ['Pending', 'In Progress', 'Resolved'],
    datasets: [{
      data: [stats.pending, stats.inProgress, stats.resolved],
      backgroundColor: ['#F59E0B', '#3B82F6', '#10B981'],
      borderWidth: 0
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        grid: {
          color: '#F1F5F9'
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true
        }
      }
    }
  };

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

  // Add meta viewport to prevent iOS zoom on input focus
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
    <div className="min-h-screen bg-light-gray">
      {/* Header */}
      <div className="bg-card-bg border-b border-border-light px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button 
              className="mr-3 md:hidden text-text-primary" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Admin Dashboard</h1>
              <p className="text-xs sm:text-sm text-text-secondary mt-1">Monitor and manage civic reports</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="bg-light-gray px-2 sm:px-4 py-1 sm:py-2 rounded-xl text-xs sm:text-sm">
              <span className="text-text-secondary hidden sm:inline">Last updated: </span>
              <span className="font-medium text-text-primary">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex relative">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden" onClick={() => setSidebarOpen(false)}></div>
        )}

        {/* Sidebar */}
        <div 
          ref={sidebarRef}
          className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static top-0 left-0 h-full z-20 w-64 bg-card-bg border-r border-border-light p-4 sm:p-6 transition-transform duration-300 ease-in-out`}
        >
          <div className="flex justify-between items-center mb-6 md:hidden">
            <h2 className="font-bold text-lg text-text-primary">Navigation</h2>
            <button onClick={() => setSidebarOpen(false)} className="text-text-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="space-y-2">
            <NavButton
              id="overview"
              label="Overview"
              icon={ChartBarIcon}
              isActive={activeView === 'overview'}
              onClick={(id) => {
                setActiveView(id);
                setSidebarOpen(false);
              }}
            />
            <NavButton
              id="map"
              label="Live Map"
              icon={MapIcon}
              isActive={activeView === 'map'}
              onClick={(id) => {
                setActiveView(id);
                setSidebarOpen(false);
              }}
            />
            <NavButton
              id="reports"
              label="All Reports"
              icon={DocumentTextIcon}
              isActive={activeView === 'reports'}
              onClick={(id) => {
                setActiveView(id);
                setSidebarOpen(false);
              }}
            />
          </nav>
        </div>

        {/* Bottom mobile navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-card-bg border-t border-border-light p-2 flex justify-around md:hidden z-10">
          <NavButton
            id="overview"
            label="Overview"
            icon={ChartBarIcon}
            isActive={activeView === 'overview'}
            onClick={setActiveView}
            showLabel={false}
          />
          <NavButton
            id="map"
            label="Map"
            icon={MapIcon}
            isActive={activeView === 'map'}
            onClick={setActiveView}
            showLabel={false}
          />
          <NavButton
            id="reports"
            label="Reports"
            icon={DocumentTextIcon}
            isActive={activeView === 'reports'}
            onClick={setActiveView}
            showLabel={false}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-6 pb-16 md:pb-6">
          {activeView === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <StatCard
                  title="Total Reports"
                  value={stats.total}
                  icon={DocumentTextIcon}
                  color="bg-primary"
                  trend="12"
                />
                <StatCard
                  title="Pending"
                  value={stats.pending}
                  icon={ClockIcon}
                  color="bg-warning"
                  trend="8"
                />
                <StatCard
                  title="In Progress"
                  value={stats.inProgress}
                  icon={ExclamationTriangleIcon}
                  color="bg-info"
                  trend="15"
                />
                <StatCard
                  title="Resolved"
                  value={stats.resolved}
                  icon={CheckCircleIcon}
                  color="bg-secondary"
                  trend="23"
                />
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Monthly Trend */}
                <div className="bg-card-bg rounded-2xl p-4 sm:p-6 shadow-card">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Monthly Trend</h3>
                  <div className="h-64">
                    <Line data={monthlyChartData} options={chartOptions} />
                  </div>
                </div>

                {/* Status Distribution */}
                <div className="bg-card-bg rounded-2xl p-4 sm:p-6 shadow-card">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Status Distribution</h3>
                  <div className="h-64">
                    <Doughnut data={statusChartData} options={doughnutOptions} />
                  </div>
                </div>
              </div>

              {/* Recent Reports */}
              <div className="bg-card-bg rounded-2xl p-4 sm:p-6 shadow-card">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Recent Reports</h3>
                <div className="space-y-3">
                  {stats.recentReports.map((report, index) => (
                    <div key={index} className="flex items-center justify-between p-3 sm:p-4 bg-light-gray rounded-xl">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${
                          report.status === 'resolved' ? 'bg-secondary' :
                          report.status === 'in-progress' ? 'bg-info' : 'bg-warning'
                        }`}></div>
                        <div>
                          <p className="font-medium text-text-primary">{report.title}</p>
                          <p className="text-sm text-text-secondary">{report.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-text-primary capitalize">{report.status}</p>
                        <p className="text-xs text-text-secondary">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeView === 'map' && (
            <div className="bg-card-bg rounded-2xl p-4 sm:p-6 shadow-card">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Live Reports Map</h3>
              <div className="h-96 rounded-xl overflow-hidden border border-border-light">
                {isClient ? <InteractiveMap /> : <div className="flex items-center justify-center h-full text-text-secondary">Loading map...</div>}
              </div>
            </div>
          )}

          {activeView === 'reports' && (
            <div className="bg-card-bg rounded-2xl p-4 sm:p-6 shadow-card">
              <h3 className="text-lg font-semibold text-text-primary mb-4">All Reports</h3>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-light">
                      <th className="text-left py-3 px-4 font-medium text-text-secondary">Title</th>
                      <th className="text-left py-3 px-4 font-medium text-text-secondary">Category</th>
                      <th className="text-left py-3 px-4 font-medium text-text-secondary">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-text-secondary">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-text-secondary">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report, index) => (
                      <tr key={index} className="border-b border-border-light hover:bg-light-gray">
                        <td className="py-3 px-4 font-medium text-text-primary">{report.title}</td>
                        <td className="py-3 px-4 text-text-secondary">{report.category}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                            report.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {report.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-text-secondary">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <button className="text-primary hover:text-primary-light">
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
