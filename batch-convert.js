const fs = require('fs');
const path = require('path');

// Comprehensive TypeScript to JavaScript conversion
function convertTStoJS(content) {
    let result = content;

    // Remove type imports
    result = result.replace(/import\s+type\s+\{[^}]+\}\s+from\s+['"][^'"]+['"];?\s*/g, '');
    result = result.replace(/,\s*type\s+\w+/g, '');
    result = result.replace(/type\s+\w+,/g, '');

    // Remove interfaces
    result = result.replace(/export\s+interface\s+\w+\s*\{[^}]*\}/gs, '');
    result = result.replace(/interface\s+\w+\s*\{[^}]*\}/gs, '');

    // Remove React.FC and type annotations
    result = result.replace(/:\s*React\.FC<[^>]*>/g, '');
    result = result.replace(/React\.FC<[^>]*>/g, '');

    // Remove generic type parameters from hooks
    result = result.replace(/useState<[^>]*>/g, 'useState');
    result = result.replace(/useRef<[^>]*>/g, 'useRef');
    result = result.replace(/useMemo<[^>]*>/g, 'useMemo');
    result = result.replace(/useCallback<[^>]*>/g, 'useCallback');
    result = result.replace(/createContext<[^>]*>/g, 'createContext');

    // Remove type annotations from function parameters
    result = result.replace(/\(([^:)]+):\s*[^,)]+\)/g, '($1)');
    result = result.replace(/\(([^:,)]+):\s*[^,)]+,/g, '($1,');

    // Remove 'as const'
    result = result.replace(/\s+as\s+const/g, '');

    // Remove Record, Partial generic types
    result = result.replace(/Record<[^>]+>/g, 'Object');
    result = result.replace(/Partial<[^>]+>/g, 'Object');

    // Update import extensions
    result = result.replace(/from ['"](@\/[^'"]+)\.tsx['"]/g, "from '$1.jsx'");
    result = result.replace(/from ['"](@\/[^'"]+)\.ts['"]/g, "from '$1.js'");
    result = result.replace(/from ['"](\.[^'"]+)\.tsx['"]/g, "from '$1.jsx'");
    result = result.replace(/from ['"](\.[^'"]+)\.ts['"]/g, "from '$1.js'");

    return result;
}

// Find all TypeScript files
function findFiles(dir, ext) {
    let results = [];
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory() && file !== 'node_modules') {
            results = results.concat(findFiles(filePath, ext));
        } else if (file.endsWith(ext)) {
            results.push(filePath);
        }
    }

    return results;
}

// Main execution
const srcDir = path.join(__dirname, 'src');
const tsxFiles = findFiles(srcDir, '.tsx');
const tsFiles = findFiles(srcDir, '.ts').filter(f => !f.endsWith('.d.ts'));

console.log(`Found ${tsxFiles.length} .tsx files and ${tsFiles.length} .ts files\n`);

let converted = 0;

[...tsxFiles, ...tsFiles].forEach(file => {
    try {
        const content = fs.readFileSync(file, 'utf-8');
        const converted_content = convertTStoJS(content);
        const newExt = file.endsWith('.tsx') ? '.jsx' : '.js';
        const newPath = file.replace(/\.tsx?$/, newExt);

        fs.writeFileSync(newPath, converted_content);
        console.log(`✓ ${path.relative(__dirname, file)} → ${path.basename(newPath)}`);
        converted++;
    } catch (error) {
        console.error(`✗ Error: ${file} - ${error.message}`);
    }
});

console.log(`\n✓ Converted ${converted} files successfully!`);
