const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const { Readable } = require('stream');

class FileParserService {
    // Parse uploaded file (CSV or Excel)
    async parseFile(file, columnMapping = null) {
        const ext = path.extname(file.originalname).toLowerCase();

        if (ext === '.csv') {
            return await this.parseCSV(file.path, columnMapping);
        } else if (ext === '.xlsx' || ext === '.xls') {
            return await this.parseExcel(file.path, columnMapping);
        } else {
            throw new Error('Unsupported file format. Only CSV and Excel files are allowed.');
        }
    }

    // Parse CSV file
    async parseCSV(filePath, columnMapping = null) {
        return new Promise((resolve, reject) => {
            const results = [];
            const fileStream = require('fs').createReadStream(filePath);

            fileStream
                .pipe(csv())
                .on('data', (data) => {
                    try {
                        const record = this.normalizeRecord(data, columnMapping);
                        if (this.validateRecord(record)) {
                            results.push(record);
                        }
                    } catch (error) {
                        console.error('Error parsing row:', error);
                    }
                })
                .on('end', () => {
                    resolve(results);
                })
                .on('error', (error) => {
                    reject(new Error(`CSV parsing error: ${error.message}`));
                });
        });
    }

    // Parse Excel file
    async parseExcel(filePath, columnMapping = null) {
        try {
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            const data = XLSX.utils.sheet_to_json(worksheet, {
                raw: false,
                defval: ''
            });

            const records = data
                .map(row => this.normalizeRecord(row, columnMapping))
                .filter(record => this.validateRecord(record));

            return records;
        } catch (error) {
            throw new Error(`Excel parsing error: ${error.message}`);
        }
    }

    // Normalize record to standard format
    normalizeRecord(data, columnMapping = null) {
        // If column mapping is provided, use it; otherwise use auto-detection
        if (columnMapping) {
            return {
                transactionId: data[columnMapping.transactionId] || '',
                amount: parseFloat(data[columnMapping.amount]) || 0,
                referenceNumber: data[columnMapping.referenceNumber] || '',
                date: this.parseDate(data[columnMapping.date]),
                description: columnMapping.description && columnMapping.description !== 'none' ? data[columnMapping.description] || '' : '',
                category: columnMapping.category && columnMapping.category !== 'none' ? data[columnMapping.category] || '' : '',
                vendor: columnMapping.vendor && columnMapping.vendor !== 'none' ? data[columnMapping.vendor] || '' : ''
            };
        }

        // Auto-detection for backward compatibility
        return {
            transactionId: data.transaction_id || data.txn_id || data.id || '',
            amount: parseFloat(data.amount) || 0,
            referenceNumber: data.reference_number || data.ref_number || data.reference || '',
            date: this.parseDate(data.date || data.transaction_date),
            description: data.description || '',
            category: data.category || '',
            vendor: data.vendor || data.supplier || ''
        };
    }

    // Parse date from various formats
    parseDate(dateString) {
        if (!dateString) return new Date();

        // Try parsing as ISO date
        const isoDate = new Date(dateString);
        if (!isNaN(isoDate.getTime())) {
            return isoDate;
        }

        // Try parsing common formats: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
        const formats = [
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,  // MM/DD/YYYY or DD/MM/YYYY
            /^(\d{4})-(\d{1,2})-(\d{1,2})$/     // YYYY-MM-DD
        ];

        for (const format of formats) {
            const match = dateString.match(format);
            if (match) {
                const [, p1, p2, p3] = match;
                // Try as YYYY-MM-DD
                if (p1.length === 4) {
                    return new Date(p1, parseInt(p2) - 1, p3);
                }
                // Try as MM/DD/YYYY (US format)
                return new Date(p3, parseInt(p1) - 1, p2);
            }
        }

        return new Date();
    }

    // Validate record
    validateRecord(record) {
        return (
            record.transactionId &&
            record.amount > 0 &&
            record.date instanceof Date &&
            !isNaN(record.date.getTime())
        );
    }

    // Clean up uploaded file
    async cleanupFile(filePath) {
        try {
            await fs.unlink(filePath);
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    }

    // Get file statistics
    async getFileStats(records) {
        return {
            totalRecords: records.length,
            totalAmount: records.reduce((sum, r) => sum + r.amount, 0),
            dateRange: {
                earliest: new Date(Math.min(...records.map(r => r.date.getTime()))),
                latest: new Date(Math.max(...records.map(r => r.date.getTime())))
            },
            categories: [...new Set(records.map(r => r.category).filter(Boolean))],
            vendors: [...new Set(records.map(r => r.vendor).filter(Boolean))]
        };
    }
}

module.exports = new FileParserService();
