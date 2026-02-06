// Mock data generators
export const generateMockSystemRecords = (count) => {
    const records = [];
    const categories = ['Office Supplies', 'Software', 'Travel', 'Marketing', 'Equipment'];
    const vendors = ['Vendor A', 'Vendor B', 'Vendor C', 'Vendor D', 'Vendor E'];

    for (let i = 1; i <= count; i++) {
        records.push({
            id: `sys-${i}`,
            transactionId: `TXN-${String(i).padStart(5, '0')}`,
            amount: parseFloat((Math.random() * 10000 + 100).toFixed(2)),
            referenceNumber: `REF-${String(i).padStart(6, '0')}`,
            date: new Date(2026, 0, Math.floor(Math.random() * 31) + 1).toISOString().split('T')[0],
            description: `Transaction ${i} description`,
            category: categories[Math.floor(Math.random() * categories.length)],
            vendor: vendors[Math.floor(Math.random() * vendors.length)],
        });
    }

    return records;
};

export const generateMockUploadedRecords = (
    systemRecords,
    count
) => {
    const records = [];

    for (let i = 0; i < count; i++) {
        const shouldMatch = Math.random() > 0.2; // 80% should have a match

        if (shouldMatch && i < systemRecords.length) {
            // Create a matching or partially matching record
            const systemRecord = systemRecords[i];
            const isExactMatch = Math.random() > 0.15; // 85% exact match

            records.push({
                id: `upload-${i}`,
                transactionId: systemRecord.transactionId,
                amount: isExactMatch ? systemRecord.amount : systemRecord.amount * 1.015,
                referenceNumber: systemRecord.referenceNumber,
                date: systemRecord.date,
                description: systemRecord.description,
                category: systemRecord.category,
                vendor: systemRecord.vendor,
            });
        } else {
            // Create an unmatched record
            records.push({
                id: `upload-${i}`,
                transactionId: `TXN-${String(9000 + i).padStart(5, '0')}`,
                amount: parseFloat((Math.random() * 5000 + 100).toFixed(2)),
                referenceNumber: `REF-${String(9000 + i).padStart(6, '0')}`,
                date: new Date(2026, 0, Math.floor(Math.random() * 31) + 1).toISOString().split('T')[0],
                description: `Unmatched transaction ${i}`,
                category: 'Other',
                vendor: 'Unknown Vendor',
            });
        }
    }

    // Add some duplicates
    if (records.length > 5) {
        records.push({ ...records[0], id: `upload-dup-1` });
        records.push({ ...records[1], id: `upload-dup-2` });
    }

    return records;
};

export const reconcileRecords = (
    uploadedRecords,
    systemRecords,
    rules
) => {
    const results = [];
    const transactionIdMap = new Map();
    const refNumberMap = new Map();
    const seenTransactionIds = new Set();

    // Build lookup maps
    systemRecords.forEach((record) => {
        transactionIdMap.set(record.transactionId, record);
        refNumberMap.set(record.referenceNumber, record);
    });

    uploadedRecords.forEach((uploadedRecord) => {
        let status = 'not_matched';
        let systemRecord = null;
        let mismatchedFields = [];
        let matchedBy;

        // Check for duplicates
        if (seenTransactionIds.has(uploadedRecord.transactionId)) {
            status = 'duplicate';
        } else {
            seenTransactionIds.add(uploadedRecord.transactionId);

            // Apply exact match rule
            const exactMatchRule = rules.find((r) => r.type === 'exact_match' && r.enabled);
            if (exactMatchRule) {
                const match = transactionIdMap.get(uploadedRecord.transactionId);
                if (match && Math.abs(match.amount - uploadedRecord.amount) < 0.01) {
                    status = 'matched';
                    systemRecord = match;
                    matchedBy = 'Exact Match';
                }
            }

            // Apply partial match rule
            if (status === 'not_matched') {
                const partialMatchRule = rules.find((r) => r.type === 'partial_match' && r.enabled);
                if (partialMatchRule) {
                    const match = refNumberMap.get(uploadedRecord.referenceNumber);
                    if (match) {
                        const variance = Math.abs(match.amount - uploadedRecord.amount) / match.amount;
                        if (variance <= (partialMatchRule.config.variance || 0.02)) {
                            status = 'partially_matched';
                            systemRecord = match;
                            matchedBy = 'Partial Match (Reference)';

                            // Find mismatched fields
                            if (match.transactionId !== uploadedRecord.transactionId) {
                                mismatchedFields.push('transactionId');
                            }
                            if (Math.abs(match.amount - uploadedRecord.amount) > 0.01) {
                                mismatchedFields.push('amount');
                            }
                        }
                    }
                }
            }
        }

        results.push({
            id: `result-${uploadedRecord.id}`,
            uploadedRecord,
            systemRecord,
            status,
            mismatchedFields,
            matchedBy,
            uploadJobId: 'job-1',
        });
    });

    return results;
};

export const generateMockAuditLogs = (recordId) => {
    return [
        {
            id: 'audit-1',
            recordId,
            userId: '2',
            userName: 'Analyst User',
            action: 'upload',
            timestamp: new Date(2026, 0, 28, 10, 30).toISOString(),
            changes: [
                {
                    field: 'status',
                    oldValue: null,
                    newValue: 'pending',
                },
            ],
            source: 'upload',
        },
        {
            id: 'audit-2',
            recordId,
            userId: 'system',
            userName: 'System',
            action: 'reconcile',
            timestamp: new Date(2026, 0, 28, 10, 31).toISOString(),
            changes: [
                {
                    field: 'status',
                    oldValue: 'pending',
                    newValue: 'partially_matched',
                },
            ],
            source: 'system',
        },
        {
            id: 'audit-3',
            recordId,
            userId: '2',
            userName: 'Analyst User',
            action: 'manual_edit',
            timestamp: new Date(2026, 0, 28, 14, 15).toISOString(),
            changes: [
                {
                    field: 'amount',
                    oldValue: 1250.50,
                    newValue: 1250.00,
                },
            ],
            source: 'manual',
        },
        {
            id: 'audit-4',
            recordId,
            userId: '1',
            userName: 'Admin User',
            action: 'approve',
            timestamp: new Date(2026, 0, 29, 9, 0).toISOString(),
            changes: [
                {
                    field: 'status',
                    oldValue: 'partially_matched',
                    newValue: 'matched',
                },
            ],
            source: 'manual',
        },
    ];
};

export const defaultReconciliationRules = [
    {
        id: 'rule-1',
        name: 'Exact Match',
        type: 'exact_match',
        config: {
            fields: ['transactionId', 'amount'],
        },
        enabled: true,
    },
    {
        id: 'rule-2',
        name: 'Partial Match',
        type: 'partial_match',
        config: {
            fields: ['referenceNumber'],
            variance: 0.02, // 2%
        },
        enabled: true,
    },
    {
        id: 'rule-3',
        name: 'Duplicate Check',
        type: 'duplicate_check',
        config: {
            fields: ['transactionId'],
        },
        enabled: true,
    },
];
