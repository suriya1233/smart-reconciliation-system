import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card.jsx';
import { Button } from '@/app/components/ui/button.jsx';
import { Input } from '@/app/components/ui/input.jsx';
import { Label } from '@/app/components/ui/label.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select.jsx';
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import {
    FileCheck,
    AlertCircle,
    CheckCircle,
    XCircle,
    Copy,
    TrendingUp,
    Filter
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { reconciliationAPI, auditAPI } from '@/services/api.js';
import { toast } from 'sonner';

export const Dashboard = ({ results }) => {
    const { user } = useAuth();
    const [dateRange, setDateRange] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [uploadedByFilter, setUploadedByFilter] = useState('all');

    // State for fetched data
    const [accuracyTrendData, setAccuracyTrendData] = useState([]);
    const [recentUploads, setRecentUploads] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch historical statistics and recent uploads
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);

                // Fetch accuracy trend data (last 7 days)
                const { data: historicalData } = await reconciliationAPI.getHistoricalStatistics({ days: 7 });
                setAccuracyTrendData(historicalData.data || []);

                // Fetch recent upload jobs from audit logs
                const { data: auditData } = await auditAPI.getLogs({ action: 'upload', limit: 3 });

                console.log('Audit data received:', auditData); // Debug log

                // Format the audit logs for display
                const formattedUploads = (auditData.data || []).map(log => {
                    // Extract record count from changes or metadata
                    const recordCount = log.changes?.[0]?.newValue || log.metadata?.total || 0;

                    // Use fileName from metadata if available, otherwise use descriptive name
                    const fileName = log.metadata?.fileName || `Upload by ${log.userName || 'Unknown'}`;

                    return {
                        file: fileName,
                        date: new Date(log.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        }),
                        records: recordCount,
                        status: 'completed'
                    };
                });

                console.log('Formatted uploads:', formattedUploads); // Debug log
                setRecentUploads(formattedUploads);

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                toast.error('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Filter results
    const filteredResults = useMemo(() => {
        return results.filter((result) => {
            if (statusFilter !== 'all' && result.status !== statusFilter) return false;
            // Add more filters as needed
            return true;
        });
    }, [results, statusFilter]);

    // Calculate metrics
    const metrics = useMemo(() => {
        const total = filteredResults.length;
        const matched = filteredResults.filter((r) => r.status === 'matched').length;
        const partiallyMatched = filteredResults.filter((r) => r.status === 'partially_matched').length;
        const unmatched = filteredResults.filter((r) => r.status === 'not_matched').length;
        const duplicates = filteredResults.filter((r) => r.status === 'duplicate').length;
        const accuracy = total > 0 ? ((matched / total) * 100).toFixed(1) : '0';

        return {
            total,
            matched,
            partiallyMatched,
            unmatched,
            duplicates,
            accuracy,
        };
    }, [filteredResults]);

    // Chart data
    const statusChartData = [
        { name: 'Matched', value: metrics.matched, color: '#10b981' },
        { name: 'Partial', value: metrics.partiallyMatched, color: '#f59e0b' },
        { name: 'Unmatched', value: metrics.unmatched, color: '#ef4444' },
        { name: 'Duplicates', value: metrics.duplicates, color: '#8b5cf6' },
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl text-gray-900">Reconciliation Dashboard</h1>
                    <p className="text-gray-500 mt-1">Welcome back, {user?.name}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="text-sm font-medium text-gray-900">
                        {new Date().toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Date Range</Label>
                            <Select value={dateRange} onValueChange={setDateRange}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Time</SelectItem>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="week">This Week</SelectItem>
                                    <SelectItem value="month">This Month</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="matched">Matched</SelectItem>
                                    <SelectItem value="partially_matched">Partially Matched</SelectItem>
                                    <SelectItem value="not_matched">Unmatched</SelectItem>
                                    <SelectItem value="duplicate">Duplicates</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Uploaded By</Label>
                            <Select value={uploadedByFilter} onValueChange={setUploadedByFilter}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Users</SelectItem>
                                    <SelectItem value="admin">Admin User</SelectItem>
                                    <SelectItem value="analyst">Analyst User</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Records</p>
                                <p className="text-2xl font-semibold text-gray-900 mt-1">{metrics.total}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FileCheck className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Matched</p>
                                <p className="text-2xl font-semibold text-green-600 mt-1">{metrics.matched}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Partially Matched</p>
                                <p className="text-2xl font-semibold text-amber-600 mt-1">{metrics.partiallyMatched}</p>
                            </div>
                            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                                <AlertCircle className="h-6 w-6 text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Unmatched</p>
                                <p className="text-2xl font-semibold text-red-600 mt-1">{metrics.unmatched}</p>
                            </div>
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                <XCircle className="h-6 w-6 text-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Accuracy</p>
                                <p className="text-2xl font-semibold text-blue-600 mt-1">{metrics.accuracy}%</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={statusChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {statusChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Accuracy Trend (7 Days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={accuracyTrendData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis domain={[0, 100]} />
                                <Tooltip />
                                <Bar dataKey="accuracy" fill="#3b82f6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Upload Jobs</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2">Loading recent uploads...</p>
                        </div>
                    ) : recentUploads.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <FileCheck className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p>No recent upload jobs found</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {recentUploads.map((job, index) => (
                                <div key={index} className="flex items-center justify-between py-3 border-b last:border-b-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <FileCheck className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{job.file}</p>
                                            <p className="text-xs text-gray-500">{job.records} records</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-900">{job.date}</p>
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                            {job.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
