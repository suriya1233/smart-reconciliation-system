import os
import re
from pathlib import Path

def convert_typescript_to_javascript(content):
    """Convert TypeScript syntax to JavaScript"""
    
    # Remove type-only imports
    content = re.sub(r'import\s+type\s+\{[^}]+\}\s+from\s+[\'"][^\'"]+[\'"];?\s*\n?', '', content)
    content = re.sub(r',\s*type\s+[\w]+', '', content)
    
    # Remove interfaces and type declarations
    content = re.sub(r'export\s+interface\s+\w+\s*\{[^}]*\}', '', content, flags=re.DOTALL)
    content = re.sub(r'interface\s+\w+\s*\{[^}]*\}', '', content, flags=re.DOTALL)
    content = re.sub(r'export\s+type\s+\w+\s*=\s*[^;]+;', '', content)
    content = re.sub(r'type\s+\w+\s*=\s*[^;]+;', '', content)
    
    # Remove React.FC
    content = re.sub(r':\s*React\.FC<[^>]*>', '', content)
    content = re.sub(r'React\.FC<[^>]*>', '', content)
    
    # Remove generic type parameters
    content = re.sub(r'useState<[^>]*>', 'useState', content)
    content = re.sub(r'useRef<[^>]*>', 'useRef', content)
    content = re.sub(r'useMemo<[^>]*>', 'useMemo', content)
    content = re.sub(r'useCallback<[^>]*>', 'useCallback', content)
    content = re.sub(r'createContext<[^>]*>', 'createContext', content)
    
    # Remove 'as const'
    content = re.sub(r'\s+as\s+const', '', content)
    
    # Remove type annotations from parameters (simple cases)
    content = re.sub(r'\((\w+):\s*[\w<>]+\)', r'(\1)', content)
    
    # Update import extensions
    content = re.sub(r"from\s+['\"](@/[^'\"]+)\.tsx['\"]", r"from '\1.jsx'", content)
    content = re.sub(r"from\s+['\"](@/[^'\"]+)\.ts['\"]", r"from '\1.js'", content)
    content = re.sub(r"from\s+['\"](\./[^'\"]+)\.tsx['\"]", r"from '\1.jsx'", content)
    content = re.sub(r"from\s+['\"](\./[^'\"]+)\.ts['\"]", r"from '\1.js'", content)
    
    return content

def convert_files(src_dir):
    """Convert all TypeScript files in src directory"""
    converted = 0
    errors = []
    
    for root, dirs, files in os.walk(src_dir):
        # Skip node_modules
        if 'node_modules' in root:
            continue
            
        for file in files:
            if file.endswith(('.tsx', '.ts')) and not file.endswith('.d.ts'):
                try:
                    file_path = os.path.join(root, file)
                    
                    # Read original file
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Convert content
                    converted_content = convert_typescript_to_javascript(content)
                   
                    # Determine new extension
                    new_ext = '.jsx' if file.endswith('.tsx') else '.js'
                    new_path = file_path[:-len(Path(file).suffix)] + new_ext
                    
                    # Write converted file
                    with open(new_path, 'w', encoding='utf-8') as f:
                        f.write(converted_content)
                    
                    print(f"✓ {os.path.relpath(file_path, src_dir)} → {Path(new_path).name}")
                    converted += 1
                    
                except Exception as e:
                    errors.append(f"✗ {file}: {str(e)}")
                    print(f"✗ Error converting {file}: {e}")
    
    print(f"\n✓ Successfully converted {converted} files!")
    if errors:
        print(f"\n⚠ {len(errors)} errors occurred")
        for error in errors:
            print(error)

if __name__ == '__main__':
    src_dir = os.path.join(os.path.dirname(__file__), 'src')
    print(f"Converting TypeScript files in: {src_dir}\n")
    convert_files(src_dir)
    print("\nDone! Review the converted files and delete .tsx/.ts files if satisfied.")
