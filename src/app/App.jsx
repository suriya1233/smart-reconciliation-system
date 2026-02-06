import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext.jsx';
import { Login } from '@/app/components/Login.jsx';
import { Layout } from '@/app/components/Layout.jsx';
import { Dashboard } from '@/app/components/Dashboard.jsx';
import { FileUpload } from '@/app/components/FileUpload.jsx';
import { ReconciliationView } from '@/app/components/ReconciliationView.jsx';
import { AuditTimeline } from '@/app/components/AuditTimeline.jsx';
import { Settings } from '@/app/components/Settings.jsx';
import { Toaster } from '@/app/components/ui/sonner.jsx';
import { reconciliationAPI, auditAPI, settingsAPI } from '@/services/api';
import { toast } from 'sonner';

const AppContent = () => {
    const { isAuthenticated, user } = useAuth();
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [reconciliationResults, setReconciliationResults] = useState([]);
    const [auditLogs, setAuditLogs] = useState({});
    const [selectedRecordId, setSelectedRecordId] = useState('');
    const [reconciliationRules, setReconciliationRules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statistics, setStatistics] = useState({
        total: 0,
        matched: 0,
        partiallyMatched: 0,
        notMatched: 0,
        duplicates: 0
    });

    // Fetch reconciliation rules on mount
    useEffect(() => {
        if (isAuthenticated) {
            fetchRules();
            fetchResults();
            fetchStatistics();
        }
    }, [isAuthenticated]);

    const fetchRules = async () => {
        try {
            const { data } = await settingsAPI.getRules();
            setReconciliationRules(data.data);
        } catch (error) {
            console.error('Error fetching rules:', error);
            toast.error('Failed to load reconciliation rules');
        }
    };

    const fetchResults = async () => {
        try {
            setLoading(true);
            const { data } = await reconciliationAPI.getResults({ limit: 100 });
            setReconciliationResults(data.data);
        } catch (error) {
            console.error('Error fetching results:', error);
            toast.error('Failed to load reconciliation results');
        } finally {
            setLoading(false);
        }
    };

    const fetchStatistics = async () => {
        try {
            const { data } = await reconciliationAPI.getStatistics();
            setStatistics(data.data);
        } catch (error) {
            console.error('Error fetching statistics:', error);
        }
    };

    const handleUploadComplete = async (response) => {
        // Refresh results after upload
        await fetchResults();
        await fetchStatistics();

        toast.success(`File uploaded successfully! ${response.statistics.matched} matches found.`);
        setCurrentPage('reconciliation');
    };

    const handleManualCorrection = async (resultId, updatedRecord) => {
        try {
            setLoading(true);
            const { data } = await reconciliationAPI.manualCorrection(resultId, updatedRecord);

            // Update local state
            setReconciliationResults((prev) =>
                prev.map((result) =>
                    result._id === resultId ? data.data : result
                )
            );

            // Add audit log entry
            const newLog = {
                _id: `audit-${Date.now()}`,
                recordId: updatedRecord.id,
                userId: user?.id || 'unknown',
                userName: user?.name || 'Unknown User',
                action: 'manual_edit',
                timestamp: new Date().toISOString(),
                changes: [
                    {
                        field: 'multiple',
                        oldValue: 'Previous values',
                        newValue: 'Updated values',
                    },
                ],
                source: 'manual',
            };

            setAuditLogs((prev) => ({
                ...prev,
                [updatedRecord.id]: [...(prev[updatedRecord.id] || []), newLog],
            }));

            toast.success('Manual correction applied successfully');
        } catch (error) {
            console.error('Error applying correction:', error);
            toast.error('Failed to apply manual correction');
        } finally {
            setLoading(false);
        }
    };

    const handleViewAudit = async (recordId) => {
        setSelectedRecordId(recordId);

        // Fetch audit logs if they don't exist
        if (!auditLogs[recordId]) {
            try {
                const { data } = await auditAPI.getLogsByRecordId(recordId);
                setAuditLogs((prev) => ({
                    ...prev,
                    [recordId]: data.data,
                }));
            } catch (error) {
                console.error('Error fetching audit logs:', error);
                toast.error('Failed to load audit logs');
            }
        }

        setCurrentPage('audit');
    };

    const handleUpdateRules = async (rules) => {
        try {
            setLoading(true);
            await settingsAPI.updateRules(rules);
            setReconciliationRules(rules);

            // Re-fetch results with new rules
            await fetchResults();

            toast.success('Reconciliation rules updated successfully');
        } catch (error) {
            console.error('Error updating rules:', error);
            toast.error('Failed to update reconciliation rules');
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return <Login />;
    }

    return (
        <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
            {currentPage === 'dashboard' && (
                <Dashboard
                    results={reconciliationResults}
                    statistics={statistics}
                    loading={loading}
                />
            )}
            {currentPage === 'upload' && (
                <FileUpload onUploadComplete={handleUploadComplete} />
            )}
            {currentPage === 'reconciliation' && (
                <ReconciliationView
                    results={reconciliationResults}
                    onManualCorrection={handleManualCorrection}
                    onViewAudit={handleViewAudit}
                    loading={loading}
                />
            )}
            {currentPage === 'audit' && (
                <AuditTimeline
                    logs={auditLogs[selectedRecordId] || []}
                    recordId={selectedRecordId}
                />
            )}
            {currentPage === 'settings' && (
                <Settings
                    rules={reconciliationRules}
                    onUpdateRules={handleUpdateRules}
                    loading={loading}
                />
            )}
        </Layout>
    );
};

const App = () => {
    return (
        <AuthProvider>
            <AppContent />
            <Toaster position="top-right" />
        </AuthProvider>
    );
};

export default App;
