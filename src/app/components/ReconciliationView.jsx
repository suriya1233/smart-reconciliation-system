import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card.jsx';
import { Button } from '@/app/components/ui/button.jsx';
import { Input } from '@/app/components/ui/input.jsx';
import { Label } from '@/app/components/ui/label.jsx';
import { Badge } from '@/app/components/ui/badge.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select.jsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog.jsx';
import {
    CheckCircle,
    XCircle,
    AlertCircle,
    Copy,
    Edit,
    History,
    ArrowLeftRight,
    Save
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { toast } from 'sonner';

export const ReconciliationView = ({
    results,
    onManualCorrection,
    onViewAudit,
}) => {
    const { hasPermission } = useAuth();
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedResult, setSelectedResult] = useState(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editedRecord, setEditedRecord] = useState(null);

    const filteredResults = results.filter((result) => {
        if (statusFilter !== 'all' && result.status !== statusFilter) return false;
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            return (
                result.uploadedRecord.transactionId.toLowerCase().includes(searchLower) ||
                result.uploadedRecord.referenceNumber.toLowerCase().includes(searchLower)
            );
        }
        return true;
    });

    const getStatusBadge = (status) => {
        const variants = {
            matched: {
                variant: 'default',
                icon: <CheckCircle className="h-3 w-3 mr-1" />,
            },
            partially_matched: {
                variant: 'secondary',
                icon: <AlertCircle className="h-3 w-3 mr-1" />,
            },
            not_matched: {
                variant: 'destructive',
                icon: <XCircle className="h-3 w-3 mr-1" />,
            },
            duplicate: {
                variant: 'outline',
                icon: <Copy className="h-3 w-3 mr-1" />,
            },
        };

        const config = variants[status] || variants.not_matched;

        return (
            <Badge variant={config.variant} className="flex items-center w-fit">
                {config.icon}
                {status.replace('_', ' ').toUpperCase()}
            </Badge>
        );
    };

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toISOString().split('T')[0]; // Returns yyyy-MM-dd
        } catch (e) {
            return dateString;
        }
    };

    const handleEditClick = (result) => {
        if (!hasPermission('edit')) {
            toast.error('You do not have permission to edit records');
            return;
        }
        setSelectedResult(result);
        setEditedRecord({ ...result.uploadedRecord });
        setEditDialogOpen(true);
    };

    const handleSaveEdit = () => {
        if (editedRecord && selectedResult) {
            onManualCorrection(selectedResult._id, editedRecord);
            toast.success('Record updated successfully');
            setEditDialogOpen(false);
            setSelectedResult(null);
            setEditedRecord(null);
        }
    };

    const handleFieldChange = (field, value) => {
        if (editedRecord) {
            setEditedRecord({ ...editedRecord, [field]: value });
        }
    };

    const ComparisonView = ({ result }) => {
        const { uploadedRecord, systemRecord, mismatchedFields } = result;

        const fields = [
            { key: 'transactionId', label: 'Transaction ID' },
            { key: 'amount', label: 'Amount' },
            { key: 'referenceNumber', label: 'Reference Number' },
            { key: 'date', label: 'Date' },
            { key: 'description', label: 'Description' },
            { key: 'category', label: 'Category' },
            { key: 'vendor', label: 'Vendor' },
        ];

        return (
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Uploaded Record</h3>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">System Record</h3>
                    </div>
                </div>

                {fields.map((field) => {
                    const isMismatched = mismatchedFields.includes(field.key);
                    const uploadedValue = uploadedRecord[field.key];
                    const systemValue = systemRecord?.[field.key];

                    return (
                        <div key={field.key} className="grid grid-cols-2 gap-4">
                            <div
                                className={`p-3 rounded-lg border ${isMismatched ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                                    }`}
                            >
                                <p className="text-xs text-gray-500 mb-1">{field.label}</p>
                                <p className="text-sm font-medium text-gray-900">
                                    {uploadedValue !== undefined ? String(uploadedValue) : '-'}
                                </p>
                            </div>
                            <div
                                className={`p-3 rounded-lg border ${isMismatched ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                                    }`}
                            >
                                <p className="text-xs text-gray-500 mb-1">{field.label}</p>
                                <p className="text-sm font-medium text-gray-900">
                                    {systemValue !== undefined ? String(systemValue) : '-'}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl text-gray-900">Reconciliation View</h1>
                <p className="text-gray-500 mt-1">Review and correct transaction matches</p>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Search</Label>
                            <Input
                                placeholder="Search by Transaction ID or Reference Number"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Status Filter</Label>
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
                    </div>
                </CardContent>
            </Card>

            {/* Results Table */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        Reconciliation Results ({filteredResults.length} records)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Transaction ID</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Reference</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Matched By</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredResults.map((result) => (
                                    <TableRow key={result._id}>
                                        <TableCell className="font-medium">
                                            {result.uploadedRecord.transactionId}
                                        </TableCell>
                                        <TableCell>₹{result.uploadedRecord.amount.toFixed(2)}</TableCell>
                                        <TableCell>{result.uploadedRecord.referenceNumber}</TableCell>
                                        <TableCell>{result.uploadedRecord.date}</TableCell>
                                        <TableCell>{getStatusBadge(result.status)}</TableCell>
                                        <TableCell className="text-sm text-gray-600">
                                            {result.matchedBy || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleEditClick(result)}
                                                    disabled={!hasPermission('edit')}
                                                >
                                                    <Edit className="h-3 w-3 mr-1" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => onViewAudit(result._id)}
                                                >
                                                    <History className="h-3 w-3 mr-1" />
                                                    Audit
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Detailed Comparison for Selected Items */}
            {selectedResult && !editDialogOpen && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ArrowLeftRight className="h-5 w-5" />
                            Side-by-Side Comparison
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ComparisonView result={selectedResult} />
                    </CardContent>
                </Card>
            )}

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Transaction Record</DialogTitle>
                        <DialogDescription>
                            Make manual corrections to the uploaded record. Changes will be logged in the audit trail.
                        </DialogDescription>
                    </DialogHeader>
                    {editedRecord && (
                        <div className="grid grid-cols-2 gap-4 py-4">
                            <div className="space-y-2">
                                <Label>Transaction ID</Label>
                                <Input
                                    value={editedRecord.transactionId}
                                    onChange={(e) => handleFieldChange('transactionId', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Amount</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={editedRecord.amount}
                                    onChange={(e) => handleFieldChange('amount', parseFloat(e.target.value))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Reference Number</Label>
                                <Input
                                    value={editedRecord.referenceNumber}
                                    onChange={(e) => handleFieldChange('referenceNumber', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Input
                                    type="date"
                                    value={formatDateForInput(editedRecord.date)}
                                    onChange={(e) => handleFieldChange('date', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Input
                                    value={editedRecord.description || ''}
                                    onChange={(e) => handleFieldChange('description', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Input
                                    value={editedRecord.category || ''}
                                    onChange={(e) => handleFieldChange('category', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Vendor</Label>
                                <Input
                                    value={editedRecord.vendor || ''}
                                    onChange={(e) => handleFieldChange('vendor', e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveEdit}>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
