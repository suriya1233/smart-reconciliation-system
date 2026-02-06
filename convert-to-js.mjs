// Batch TypeScript to JavaScript Conversion Script
// This script helps identify and convert all remaining TSX/TS files to JSX/JS

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, 'src');

// TypeScript syntax patterns to remove
const conversionPatterns = [
    // Remove type imports
    { pattern: /import\s+type\s+{[^}]+}\s+from\s+['"][^'"]+['"]/g, replacement: '' },
    { pattern: /import\s+{([^}]+)},?\s+type\s+([^}]+)\s+from\s+['"]([^'"]+)['"]/g, replacement: 'import { $1 } from \'$3\'' },

    // Remove interface declarations
    { pattern: /export\s+interface\s+\w+\s*{[^}]*}/gs, replacement: '' },
    { pattern: /interface\s+\w+\s*{[^}]*}/gs, replacement: '' },

    // Remove type annotations from parameters
    { pattern: /\(\s*([a-zA-Z_$][\w$]*)\s*:\s*[^,)]+/g, replacement: '($1' },

    // Remove React.FC
    { pattern: /React\.FC<[^>]*>/g, replacement: '' },
    { pattern: /:\s*React\.FC\s*=\s*/g, replacement: ' = ' },

    // Remove type annotations from useState, etc
    { pattern: /useState<[^>]+>/g, replacement: 'useState' },
    { pattern: /useRef<[^>]+>/g, replacement: 'useRef' },
    { pattern: /createContext<[^>]+>/g, replacement: 'createContext' },

    // Remove 'as const'
    { pattern: /\s+as\s+const/g, replacement: '' },

    // Remove generic type parameters
    { pattern: /<[A-Z][a-zA-Z]*>/g, replacement: '' },
];

// Find all TSX/TS files
function findTypeScriptFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory() && file !== 'node_modules' && file !== '.git') {
            findTypeScriptFiles(filePath, fileList);
        } else if (file.endsWith('.tsx') || (file.endsWith('.ts') && !file.endsWith('.d.ts'))) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

// Convert file
function convertFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Apply conversion patterns
    conversionPatterns.forEach(({ pattern, replacement }) => {
        content = content.replace(pattern, replacement);
    });

    // Update imports to use .jsx/.js extensions
    content = content.replace(/from ['"](@\/[^'"]+)\.tsx['"]/g, "from '$1.jsx'");
    content = content.replace(/from ['"](@\/[^'"]+)\.ts['"]/g, "from '$1.js'");
    content = content.replace(/from ['"](\.[^'"]+)\.tsx['"]/g, "from '$1.jsx'");
    content = content.replace(/from ['"](\.[^'"]+)\.ts['"]/g, "from '$1.js'");

    // Determine output path
    const newExt = filePath.endsWith('.tsx') ? '.jsx' : '.js';
    const outputPath = filePath.replace(/\.tsx?$/, newExt);

    fs.writeFileSync(outputPath, content);
    console.log(`✓ Converted: ${path.relative(srcDir, filePath)} → ${path.basename(outputPath)}`);
}

// Main execution
const files = findTypeScriptFiles(srcDir);
console.log(`Found ${files.length} TypeScript files to convert\n`);

files.forEach(file => {
    try {
        convertFile(file);
    } catch (error) {
        console.error(`✗ Error converting ${file}:`, error.message);
    }
});

console.log(`\n✓ Conversion complete! Converted ${files.length} files.`);
console.log('\nNext steps:');
console.log('1. Review the converted files');
console.log('2. Delete the old .tsx and .ts files if satisfied');
console.log('3. Run: npm run dev');
