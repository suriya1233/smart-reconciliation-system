import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card.jsx';
import { Badge } from '@/app/components/ui/badge.jsx';
import { ScrollArea } from '@/app/components/ui/scroll-area.jsx';
import {
    Upload,
    Edit,
    CheckCircle,
    Clock,
    User,
    FileText
} from 'lucide-react';

export const AuditTimeline = ({ logs, recordId }) => {
    const getActionIcon = (action) => {
        switch (action) {
            case 'upload':
                return <Upload className="h-4 w-4" />;
            case 'manual_edit':
                return <Edit className="h-4 w-4" />;
            case 'reconcile':
                return <FileText className="h-4 w-4" />;
            case 'approve':
                return <CheckCircle className="h-4 w-4" />;
            default:
                return <Clock className="h-4 w-4" />;
        }
    };

    const getActionColor = (action) => {
        switch (action) {
            case 'upload':
                return 'bg-blue-100 text-blue-700';
            case 'manual_edit':
                return 'bg-amber-100 text-amber-700';
            case 'reconcile':
                return 'bg-purple-100 text-purple-700';
            case 'approve':
                return 'bg-green-100 text-green-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const getSourceBadge = (source) => {
        const variants = {
            upload: 'default',
            manual: 'secondary',
            system: 'outline',
        };
        return (
            <Badge variant={variants[source] || 'default'} className="text-xs">
                {source}
            </Badge>
        );
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatValue = (value) => {
        if (value === null || value === undefined) return 'null';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl text-gray-900">Audit Timeline</h1>
                <p className="text-gray-500 mt-1">Complete history of changes for record {recordId}</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Change History</CardTitle>
                </CardHeader>
                <CardContent>
                    {logs.length === 0 ? (
                        <div className="text-center py-16">
                            <Clock className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Change History</h3>
                            <p className="text-gray-500 mb-6">
                                {recordId
                                    ? `No audit logs found for record: ${recordId}`
                                    : 'Select a record from the Reconciliation page to view its change history'}
                            </p>
                            <p className="text-sm text-gray-400">
                                Audit logs track uploads, manual edits, approvals, and system actions.
                            </p>
                        </div>
                    ) : (
                        <ScrollArea className="h-[600px] pr-4">
                            <div className="relative">
                                {/* Timeline line */}
                                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

                                {/* Timeline items */}
                                <div className="space-y-6">
                                    {logs.map((log, index) => (
                                        <div key={log.id} className="relative pl-14">
                                            {/* Timeline dot */}
                                            <div
                                                className={`absolute left-0 w-12 h-12 rounded-full flex items-center justify-center ${getActionColor(
                                                    log.action
                                                )}`}
                                            >
                                                {getActionIcon(log.action)}
                                            </div>

                                            {/* Content */}
                                            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900 capitalize">
                                                            {log.action.replace('_', ' ')}
                                                        </h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <User className="h-3 w-3 text-gray-400" />
                                                            <p className="text-sm text-gray-600">{log.userName}</p>
                                                            <span className="text-gray-300">•</span>
                                                            {getSourceBadge(log.source)}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="flex items-center gap-1 text-sm text-gray-500">
                                                            <Clock className="h-3 w-3" />
                                                            <span>{formatTimestamp(log.timestamp)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Changes */}
                                                {log.changes.length > 0 && (
                                                    <div className="space-y-2 mt-3 pt-3 border-t border-gray-100">
                                                        <p className="text-xs font-medium text-gray-500 uppercase">Changes Made</p>
                                                        {log.changes.map((change, changeIndex) => (
                                                            <div
                                                                key={changeIndex}
                                                                className="bg-gray-50 rounded-md p-3 text-sm"
                                                            >
                                                                <p className="font-medium text-gray-700 mb-2">{change.field}</p>
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    <div>
                                                                        <p className="text-xs text-gray-500 mb-1">Old Value</p>
                                                                        <p className="text-red-700 bg-red-50 px-2 py-1 rounded">
                                                                            {formatValue(change.oldValue)}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs text-gray-500 mb-1">New Value</p>
                                                                        <p className="text-green-700 bg-green-50 px-2 py-1 rounded">
                                                                            {formatValue(change.newValue)}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-gray-500">Total Changes</p>
                        <p className="text-2xl font-semibold text-gray-900 mt-1">{logs.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-gray-500">Manual Edits</p>
                        <p className="text-2xl font-semibold text-amber-600 mt-1">
                            {logs.filter((l) => l.action === 'manual_edit').length}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-gray-500">System Actions</p>
                        <p className="text-2xl font-semibold text-purple-600 mt-1">
                            {logs.filter((l) => l.source === 'system').length}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-gray-500">Contributors</p>
                        <p className="text-2xl font-semibold text-blue-600 mt-1">
                            {new Set(logs.map((l) => l.userId)).size}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
