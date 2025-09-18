import React, { useState, useEffect } from 'react';
import BlogHero from '../components/shared/BlogHero.jsx';
import ReportForm from '../components/citizen/ReportForm.jsx';
import MyReports from '../components/citizen/MyReports.jsx';
import InteractiveMap from '../components/shared/Map/InteractiveMap.jsx';
import { useReports } from '../contexts/ReportsContext.jsx';
import { 
  PlusIcon, 
  MapIcon, 
  DocumentTextIcon, 
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const CitizenDashboardPage = () => {
    const { fetchReports, reports } = useReports();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const [activeView, setActiveView] = useState('overview');

    useEffect(() => {
        setIsClient(true);
        fetchReports();
    }, [fetchReports]);

    // Calculate user's report statistics
    const userStats = React.useMemo(() => {
        if (!reports || reports.length === 0) {
            return {
                total: 0,
                pending: 0,
                inProgress: 0,
                resolved: 0,
                recent: []
            };
        }

        const pending = reports.filter(r => r.status === 'pending').length;
        const inProgress = reports.filter(r => r.status === 'in-progress').length;
        const resolved = reports.filter(r => r.status === 'resolved').length;
        const recent = reports
            .slice() // avoid mutating original
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3);

        return {
            total: reports.length,
            pending,
            inProgress,
            resolved,
            recent
        };
    }, [reports]);

    const StatCard = ({ title, value, icon: Icon, color, description, trend }) => (
        <div className="bg-surface rounded-xl p-3 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-border">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center space-x-1.5 sm:space-x-2 mb-1.5 sm:mb-2">
                        <div className={`p-1 sm:p-2 rounded-lg ${color}`}>
                            <Icon className="h-3 sm:h-4 w-3 sm:w-4 text-white" />
                        </div>
                        <p className="text-text-secondary text-xs sm:text-sm font-medium truncate">{title}</p>
                    </div>
                    <div className="flex items-baseline space-x-2">
                        <p className="text-xl sm:text-3xl font-bold text-text-primary">{value}</p>
                        {trend && (
                            <span className={`text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${
                                trend > 0 ? 'bg-success-light text-success' : 
                                trend < 0 ? 'bg-accent-light text-accent' : 
                                'bg-gray-100 text-gray-600'
                            }`}>
                                {trend > 0 ? '+' : ''}{trend}%
                            </span>
                        )}
                    </div>
                    {description && (
                        <p className="text-xs text-text-muted mt-1 sm:mt-2 truncate">{description}</p>
                    )}
                </div>
            </div>
        </div>
    );

    const ViewButton = ({ id, label, icon: Icon, isActive, onClick }) => (
        <button
            onClick={() => onClick(id)}
            className={`flex items-center space-x-1 sm:space-x-2 px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-xl font-medium transition-all duration-200 ${
                isActive 
                    ? 'bg-gradient-to-r from-primary-gradient-start to-primary-gradient-end text-white shadow-lg' 
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary bg-surface border border-border'
            }`}
        >
            <Icon className="h-3 sm:h-4 w-3 sm:w-4" />
            <span className="text-xs sm:text-base whitespace-nowrap">{label}</span>
        </button>
    );

    return (
        <div className="min-h-screen bg-background">
            {/* Modern Header with Gradient */}
            <div className="bg-gradient-to-r from-primary-gradient-start to-primary-gradient-end text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold">Welcome back!</h1>
                            <p className="text-primary-light mt-1 sm:mt-2 opacity-90 text-sm sm:text-base">
                                Track your civic reports and community impact
                            </p>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="flex-grow sm:flex-grow-0">
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-primary font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 w-full sm:w-auto"
                                >
                                    <PlusIcon className="h-4 sm:h-5 w-4 sm:w-5" />
                                    <span>Report Issue</span>
                                </button>
                            </div>

                            {/* Minimal Use my location button placed next to Report Issue */}
                            <div>
                                <button
                                    onClick={() => {
                                        if (!navigator.geolocation) {
                                            alert('Geolocation is not supported by your browser');
                                            return;
                                        }
                                        navigator.geolocation.getCurrentPosition((pos) => {
                                            const lat = pos.coords.latitude;
                                            const lng = pos.coords.longitude;
                                            window.dispatchEvent(new CustomEvent('setMapToLocation', { detail: { lat, lng } }));
                                        }, (err) => {
                                            console.error('Geolocation error', err);
                                            alert('Unable to retrieve your location');
                                        }, { enableHighAccuracy: true, timeout: 10000 });
                                    }}
                                    disabled={!isClient}
                                    className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/90 text-primary font-medium shadow hover:shadow-md transition-all duration-150"
                                >
                                    <MapIcon className="h-4 w-4" />
                                    <span className="text-sm">Use my location</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Blog hero inserted with minimal change */}
            <BlogHero />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-6 mb-4 sm:mb-8">
                    <StatCard
                        title="My Reports"
                        value={userStats.total}
                        icon={DocumentTextIcon}
                        color="bg-primary"
                        description="Total submitted"
                    />
                    <StatCard
                        title="Pending"
                        value={userStats.pending}
                        icon={ClockIcon}
                        color="bg-warning"
                        description="Awaiting review"
                    />
                    <StatCard
                        title="In Progress"
                        value={userStats.inProgress}
                        icon={ExclamationTriangleIcon}
                        color="bg-info"
                        description="Being addressed"
                    />
                    <StatCard
                        title="Resolved"
                        value={userStats.resolved}
                        icon={CheckCircleIcon}
                        color="bg-secondary"
                        description="Completed"
                    />
                </div>

                {/* View Toggle */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-4 mb-3 sm:mb-6 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                    <ViewButton
                        id="overview"
                        label="Overview"
                        icon={ChartBarIcon}
                        isActive={activeView === 'overview'}
                        onClick={setActiveView}
                    />
                    <ViewButton
                        id="map"
                        label="Map View"
                        icon={MapIcon}
                        isActive={activeView === 'map'}
                        onClick={setActiveView}
                    />
                    <ViewButton
                        id="reports"
                        label="My Reports"
                        icon={DocumentTextIcon}
                        isActive={activeView === 'reports'}
                        onClick={setActiveView}
                    />
                </div>

                {/* Content based on active view */}
                {activeView === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        {/* Recent Activity */}
                        <div className="bg-card-bg rounded-2xl p-4 sm:p-6 shadow-card">
                            <h3 className="text-lg font-semibold text-text-primary mb-4">Recent Activity</h3>
                            <div className="space-y-4">
                                {userStats.recent.length > 0 ? (
                                    userStats.recent.map((report, index) => (
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
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <DocumentTextIcon className="h-12 w-12 text-text-secondary mx-auto mb-4" />
                                        <p className="text-text-secondary">No reports yet</p>
                                        <button
                                            onClick={() => setIsModalOpen(true)}
                                            className="mt-2 text-primary hover:text-primary/80 font-medium"
                                        >
                                            Submit your first report
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-card-bg rounded-2xl p-4 sm:p-6 shadow-card">
                            <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="w-full flex items-center space-x-3 p-4 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors duration-200"
                                >
                                    <PlusIcon className="h-5 w-5" />
                                    <span className="font-medium">Report New Issue</span>
                                </button>
                                <button
                                    onClick={() => setActiveView('map')}
                                    className="w-full flex items-center space-x-3 p-4 bg-secondary/10 text-secondary rounded-xl hover:bg-secondary/20 transition-colors duration-200"
                                >
                                    <MapIcon className="h-5 w-5" />
                                    <span className="font-medium">View Issues Map</span>
                                </button>
                                <button
                                    onClick={() => setActiveView('reports')}
                                    className="w-full flex items-center space-x-3 p-4 bg-info/10 text-info rounded-xl hover:bg-info/20 transition-colors duration-200"
                                >
                                    <DocumentTextIcon className="h-5 w-5" />
                                    <span className="font-medium">Track My Reports</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeView === 'map' && (
                    <div className="bg-card-bg rounded-2xl p-4 sm:p-6 shadow-card">
                        <h3 className="text-lg font-semibold text-text-primary mb-4">Community Issues Map</h3>
                        <div className="h-96 rounded-xl overflow-hidden border border-border-light">
                            {isClient ? <InteractiveMap /> : (
                                <div className="flex items-center justify-center h-full text-text-secondary">
                                    Loading map...
                                </div>
                            )}
                        </div>
                        <p className="text-sm text-text-secondary mt-4">
                            View all reported issues in your area. Click on markers to see details.
                        </p>
                    </div>
                )}

                {activeView === 'reports' && (
                    <div className="bg-card-bg rounded-2xl p-4 sm:p-6 shadow-card">
                        <h3 className="text-lg font-semibold text-text-primary mb-4">My Submitted Reports</h3>
                        <MyReports />
                    </div>
                )}
            </div>

            {/* Report Form Modal */}
            {isModalOpen && (
                <ReportForm 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                />
            )}
        </div>
    );
};

export default CitizenDashboardPage;
