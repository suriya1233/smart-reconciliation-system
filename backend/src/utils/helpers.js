// Format currency
exports.formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency
    }).format(amount);
};

// Format date
exports.formatDate = (date, format = 'short') => {
    const options = format === 'short'
        ? { year: 'numeric', month: 'short', day: 'numeric' }
        : { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };

    return new Intl.DateTimeFormat('en-US', options).format(new Date(date));
};

// Calculate percentage
exports.calculatePercentage = (value, total) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
};

// Generate random ID
exports.generateId = (prefix = 'id') => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 9);
    return `${prefix}-${timestamp}-${randomStr}`;
};

// Sanitize string
exports.sanitizeString = (str) => {
    if (!str) return '';
    return str.toString().trim().replace(/[<>]/g, '');
};

// Paginate results
exports.paginate = (page = 1, limit = 50) => {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    return {
        skip: (pageNum - 1) * limitNum,
        limit: limitNum
    };
};

// Build pagination info
exports.buildPaginationInfo = (page, limit, total) => {
    return {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
    };
};

// Deep clone object
exports.deepClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
};

// Sleep utility
exports.sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

// Check if value is empty
exports.isEmpty = (value) => {
    return (
        value === undefined ||
        value === null ||
        (typeof value === 'object' && Object.keys(value).length === 0) ||
        (typeof value === 'string' && value.trim().length === 0)
    );
};

// Get unique values from array
exports.getUniqueValues = (arr, key = null) => {
    if (key) {
        return [...new Set(arr.map(item => item[key]))];
    }
    return [...new Set(arr)];
};

// Group array by key
exports.groupBy = (arr, key) => {
    return arr.reduce((result, item) => {
        const groupKey = item[key];
        if (!result[groupKey]) {
            result[groupKey] = [];
        }
        result[groupKey].push(item);
        return result;
    }, {});
};

// Debounce function
exports.debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Validate email format
exports.isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Calculate date difference in days
exports.daysBetween = (date1, date2) => {
    const oneDay = 24 * 60 * 60 * 1000;
    const firstDate = new Date(date1);
    const secondDate = new Date(date2);
    return Math.round(Math.abs((firstDate - secondDate) / oneDay));
};

// Truncate text
exports.truncate = (text, length = 50, suffix = '...') => {
    if (!text || text.length <= length) return text;
    return text.substring(0, length) + suffix;
};

// Convert to slug
exports.slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
};

module.exports = exports;
