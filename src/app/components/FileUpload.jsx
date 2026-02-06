import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card.jsx';
import { Button } from '@/app/components/ui/button.jsx';
import { Label } from '@/app/components/ui/label.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select.jsx';
import { Progress } from '@/app/components/ui/progress.jsx';
import { Alert, AlertDescription } from '@/app/components/ui/alert.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table.jsx';
import { Upload as UploadIcon, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { toast } from 'sonner';
import { reconciliationAPI } from '@/services/api';

export const FileUpload = ({ onUploadComplete }) => {
    const { user } = useAuth();
    const [file, setFile] = useState(null);
    const [fileData, setFileData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [mapping, setMapping] = useState({});
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [step, setStep] = useState('upload');

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        const validTypes = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];

        if (!validTypes.includes(selectedFile.type)) {
            toast.error('Invalid file type. Please upload a CSV or Excel file.');
            return;
        }

        setFile(selectedFile);
        parseFile(selectedFile);
    };

    const parseFile = (file) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary', sheetRows: 1000 }); // Limit to 1000 rows for preview
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

                if (jsonData.length === 0) {
                    toast.error('File is empty or could not be parsed');
                    return;
                }

                if (jsonData.length > 50000) {
                    toast.error('File has too many rows. Maximum 50,000 rows allowed.');
                    return;
                }

                const headers = jsonData[0];

                if (!headers || headers.length === 0) {
                    toast.error('No column headers found in file');
                    return;
                }

                if (headers.length > 100) {
                    toast.error('File has too many columns. Maximum 100 columns allowed.');
                    return;
                }

                const rows = jsonData.slice(1, 21); // First 20 rows for preview

                setColumns(headers.filter(h => h)); // Remove empty headers
                setFileData(rows);
                setStep('mapping');
            } catch (error) {
                console.error('File parsing error:', error);
                toast.error('Failed to parse file. Please ensure it\'s a valid CSV or Excel file with reasonable size.');
            }
        };

        reader.readAsBinaryString(file);
    };

    const handleMappingChange = (field, value) => {
        setMapping((prev) => ({ ...prev, [field]: value }));
    };

    const isMappingValid = () => {
        return (
            mapping.transactionId &&
            mapping.amount &&
            mapping.referenceNumber &&
            mapping.date
        );
    };

    const handleSubmit = async () => {
        if (!file || !isMappingValid()) {
            toast.error('Please complete all required field mappings.');
            return;
        }

        setUploading(true);
        setStep('processing');
        setProgress(0);

        try {
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('file', file);

            // Add column mapping as metadata
            formData.append('mapping', JSON.stringify(mapping));

            // Upload file to backend with progress tracking
            const { data } = await reconciliationAPI.uploadFile(formData);

            setProgress(100);

            // Pass backend response to parent
            onUploadComplete(data.data);

            // Reset form
            setTimeout(() => {
                setFile(null);
                setFileData([]);
                setColumns([]);
                setMapping({});
                setUploading(false);
                setProgress(0);
                setStep('upload');
            }, 1000);

        } catch (error) {
            console.error('Upload error:', error);
            toast.error(error.response?.data?.message || 'Failed to upload file');
            setUploading(false);
            setStep('mapping');
        }
    };

    const handleReset = () => {
        setStep('upload');
        setFile(null);
        setFileData([]);
        setColumns([]);
        setMapping({});
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl text-gray-900">File Upload</h1>
                <p className="text-gray-500 mt-1">Upload transaction files for reconciliation</p>
            </div>

            {step === 'upload' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Upload Transaction File</CardTitle>
                        <CardDescription>
                            Select a CSV or Excel file containing transaction data (up to 50,000 records)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors">
                            <input
                                type="file"
                                id="file-upload"
                                className="hidden"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileSelect}
                            />
                            <label htmlFor="file-upload" className="cursor-pointer">
                                <UploadIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-lg text-gray-700 mb-2">
                                    Click to upload or drag and drop
                                </p>
                                <p className="text-sm text-gray-500">CSV or Excel files only</p>
                            </label>
                        </div>

                        {file && (
                            <Alert className="mt-4">
                                <FileSpreadsheet className="h-4 w-4" />
                                <AlertDescription>
                                    Selected: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            )}

            {step === 'mapping' && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Column Mapping</CardTitle>
                            <CardDescription>
                                Map your file columns to the required fields. Fields marked with * are mandatory.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="transactionId">
                                        Transaction ID <span className="text-red-500">*</span>
                                    </Label>
                                    <p className="text-xs text-gray-500">Select a column with unique identifiers (e.g., Note, ID, Reference)</p>
                                    <Select
                                        value={mapping.transactionId}
                                        onValueChange={(value) => handleMappingChange('transactionId', value)}
                                    >
                                        <SelectTrigger id="transactionId">
                                            <SelectValue placeholder="Select column" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {columns.map((col) => (
                                                <SelectItem key={col} value={col}>
                                                    {col}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="amount">
                                        Amount (₹) <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={mapping.amount}
                                        onValueChange={(value) => handleMappingChange('amount', value)}
                                    >
                                        <SelectTrigger id="amount">
                                            <SelectValue placeholder="Select column" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {columns.map((col) => (
                                                <SelectItem key={col} value={col}>
                                                    {col}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="referenceNumber">
                                        Reference Number <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={mapping.referenceNumber}
                                        onValueChange={(value) => handleMappingChange('referenceNumber', value)}
                                    >
                                        <SelectTrigger id="referenceNumber">
                                            <SelectValue placeholder="Select column" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {columns.map((col) => (
                                                <SelectItem key={col} value={col}>
                                                    {col}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="date">
                                        Date <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={mapping.date}
                                        onValueChange={(value) => handleMappingChange('date', value)}
                                    >
                                        <SelectTrigger id="date">
                                            <SelectValue placeholder="Select column" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {columns.map((col) => (
                                                <SelectItem key={col} value={col}>
                                                    {col}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description (Optional)</Label>
                                    <Select
                                        value={mapping.description}
                                        onValueChange={(value) => handleMappingChange('description', value)}
                                    >
                                        <SelectTrigger id="description">
                                            <SelectValue placeholder="Select column" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {columns.map((col) => (
                                                <SelectItem key={col} value={col}>
                                                    {col}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="category">Category (Optional)</Label>
                                    <Select
                                        value={mapping.category}
                                        onValueChange={(value) => handleMappingChange('category', value)}
                                    >
                                        <SelectTrigger id="category">
                                            <SelectValue placeholder="Select column" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {columns.map((col) => (
                                                <SelectItem key={col} value={col}>
                                                    {col}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="vendor">Vendor (Optional)</Label>
                                    <Select
                                        value={mapping.vendor}
                                        onValueChange={(value) => handleMappingChange('vendor', value)}
                                    >
                                        <SelectTrigger id="vendor">
                                            <SelectValue placeholder="Select column" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {columns.map((col) => (
                                                <SelectItem key={col} value={col}>
                                                    {col}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button onClick={handleSubmit} disabled={!isMappingValid()}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Submit Upload
                                </Button>
                                <Button variant="outline" onClick={handleReset}>
                                    Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Data Preview (First 20 Rows)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {columns.map((col) => (
                                                <TableHead key={col}>{col}</TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {fileData.slice(0, 10).map((row, rowIndex) => (
                                            <TableRow key={rowIndex}>
                                                {row.map((cell, cellIndex) => (
                                                    <TableCell key={cellIndex}>{cell}</TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {step === 'processing' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Processing Upload</CardTitle>
                        <CardDescription>
                            Please wait while we process your file. This may take a few moments.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Progress value={progress} />
                        <p className="text-sm text-gray-600 text-center">{progress}% Complete</p>
                        <div className="flex items-center justify-center gap-2 text-blue-600">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                            <span className="text-sm">Processing records...</span>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
