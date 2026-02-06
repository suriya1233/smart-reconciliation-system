// Simple and reliable TypeScript to JavaScript converter
const fs = require('fs');
const path = require('path');

function removeTypeScript(code) {
    return code
        // Remove type imports
        .replace(/import\s+type\s+\{[^}]+\}\s+from\s+['"][^'"]+['"];?\s*/g, '')
        .replace(/,\s*type\s+\w+\b/g, '')

        // Remove interfaces
        .replace(/export\s+interface\s+\w+\s*\{[^}]*\}/gs, '')
        .replace(/interface\s+\w+\s*extends\s+[^{]+\{[^}]*\}/gs, '')
        .replace(/interface\s+\w+\s*\{[^}]*\}/gs, '')

        // Remove type aliases  
        .replace(/export\s+type\s+\w+\s*=\s*[^;]+;/g, '')
        .replace(/type\s+\w+\s*=\s*[^;]+;/g, '')

        // Remove React.FC
        .replace(/:\s*React\.FC<[^>]*>/g, '')
        .replace(/React\.FC<[^>]*>/g, '')

        // Remove generics from hooks
        .replace(/useState<[^>]*>/g, 'useState')
        .replace(/useRef<[^>]*>/g, 'useRef')
        .replace(/useMemo<[^>]*>/g, 'useMemo')
        .replace(/useCallback<[^>]*>/g, 'useCallback')
        .replace(/createContext<[^>]*>/g, 'createContext')
        .replace(/forwardRef<[^>]*>/g, 'forwardRef')

        // Remove as const
        .replace(/\s+as\s+const\b/g, '')

        // Fix imports
        .replace(/from\s+['"](@\/[^'"]+)\.tsx['"]/g, "from '$1.jsx'")
        .replace(/from\s+['"](@\/[^'"]+)\.ts['"]/g, "from '$1.js'")
        .replace(/from\s+['"](\.[^'"]+)\.tsx['"]/g, "from '$1.jsx'")
        .replace(/from\s+['"](\.[^'"]+)\.ts['"]/g, "from '$1.js'");
}

function convertFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const converted = removeTypeScript(content);

    const ext = path.extname(filePath);
    const newExt = ext === '.tsx' ? '.jsx' : '.js';
    const newPath = filePath.replace(/\.tsx?$/, newExt);

    fs.writeFileSync(newPath, converted, 'utf8');
    return path.basename(newPath);
}

function findFiles(dir, results = []) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && file !== 'node_modules') {
            findFiles(fullPath, results);
        } else if (file.match(/\.(tsx?|ts)$/) && !file.endsWith('.d.ts')) {
            results.push(fullPath);
        }
    }

    return results;
}

// Main
const srcDir = path.join(__dirname, 'src');
const files = findFiles(srcDir);

console.log(`Found ${files.length} TypeScript files\n`);

let count = 0;
files.forEach(file => {
    try {
        const newName = convertFile(file);
        console.log(`✓ ${path.relative(srcDir, file)} → ${newName}`);
        count++;
    } catch (err) {
        console.error(`✗ ${file}: ${err.message}`);
    }
});

console.log(`\n✅ Converted ${count}/${files.length} files successfully!`);
