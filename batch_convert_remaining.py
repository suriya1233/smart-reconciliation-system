import os
import re

# Simple conversion function
def convert_ts_to_js(content):
    # Remove type imports
    content = re.sub(r'import\s+type\s+\{[^}]+\}\s+from\s+[\'"][^\'"]+[\'"];?\s*', '', content)
    content = re.sub(r',\s*type\s+\w+', '', content)
    
    # Remove interfaces
    content = re.sub(r'export\s+interface\s+\w+\s*\{[^}]*\}', '', content, flags=re.DOTALL)
    content = re.sub(r'interface\s+\w+\s*extends\s+[^{]+\{[^}]*\}', '',  content, flags=re.DOTALL)
    content = re.sub(r'interface\s+\w+\s*\{[^}]*\}', '', content, flags=re.DOT ALL)
    
    # Remove React.FC
    content = re.sub(r':\s*React\.FC<[^>]*>', '', content)
    content = re.sub(r'React\.FC<[^>]*>', '', content)
    
    # Remove ComponentProps
    content = re.sub(r'React\.ComponentProps<[^>]+>', '', content)
    content = re.sub(r':\s*React\.ComponentProps<[^>]+>', '', content)
    
    # Remove VariantProps
    content = re.sub(r'VariantProps<[^>]+>', '', content)
    content = re.sub(r':\s*\w+\s*&\s*VariantProps<[^>]+>', '', content)
    
    # Remove generic types
    content = re.sub(r'useState<[^>]*>', 'useState', content)
    content = re.sub(r'useRef<[^>]*>', 'useRef', content)
    content = re.sub(r'useMemo<[^>]*>', 'useMemo', content)
    content = re.sub(r'useCallback<[^>]*>', 'useCallback', content)
    content = re.sub(r'createContext<[^>]*>', 'createContext', content)
    content = re.sub(r'forwardRef<[^>]*>', 'forwardRef', content)
    
    # Remove 'as' type assertions
    content = re.sub(r'\s+as\s+const\b', '', content)
    content = re.sub(r'\s+as\s+\w+\[\]', '', content)
    content = re.sub(r'\s+as\s+React\.\w+', '', content)
    content = re.sub(r'\s+as\s+ToasterProps\[[^\]]+\]', '', content)
    
    # Remove type annotations from parameters
    content = re.sub(r'\(([a-zA-Z_$][\w$]*)\s*:\s*[^,)]+\)', r'(\1)', content)
    content = re.sub(r',\s*([a-zA-Z_$][\w$]*)\s*:\s*[^,)]+', r', \1', content)
    
    # Remove Record, Partial
    content = re.sub(r'Record<[^>]+>', 'Object', content)
    content = re.sub(r'Partial<[^>]+>', 'Object', content)
    
    # Remove keyof
    content = re.sub(r'keyof\s+\w+', 'string', content)
    
    # Remove type assertions with !
    content = re.sub(r'\[mapping\.(\w+)!\]', r'[mapping.\1]', content)
    
    # Update imports
    content = re.sub(r'from\s+[\'"](@/[^\'"]+)\.tsx[\'"]', r"from '\1.jsx'", content)
    content = re.sub(r'from\s+[\'"](@/[^\'"]+)\.ts[\'"]', r"from '\1.js'", content)
    content = re.sub(r'from\s+[\'"](\./[^\'"]+)\.tsx[\'"]', r"from '\1.jsx'", content)
    content = re.sub(r'from\s+[\'"](\./[^\'"]+)\.ts[\'"]', r"from '\1.js'", content)
    
    return content

# Files to convert
files_to_convert = [
    'src/app/components/FileUpload.tsx',
    'src/app/components/ui/accordion.tsx',
    'src/app/components/ui/alert-dialog.tsx',
    'src/app/components/ui/aspect-ratio.tsx',
    'src/app/components/ui/avatar.tsx',
    'src/app/components/ui/breadcrumb.tsx',
    'src/app/components/ui/calendar.tsx',
    'src/app/components/ui/carousel.tsx',
    'src/app/components/ui/chart.tsx',
    'src/app/components/ui/collapsible.tsx',
    'src/app/components/ui/command.tsx',
    'src/app/components/ui/context-menu.tsx',
    'src/app/components/ui/drawer.tsx',
    'src/app/components/ui/dropdown-menu.tsx',
    'src/app/components/ui/form.tsx',
    'src/app/components/ui/hover-card.tsx',
    'src/app/components/ui/input-otp.tsx',
    'src/app/components/ui/menubar.tsx',
    'src/app/components/ui/navigation-menu.tsx',
    'src/app/components/ui/pagination.tsx',
    'src/app/components/ui/popover.tsx',
    'src/app/components/ui/radio-group.tsx',
    'src/app/components/ui/resizable.tsx',
    'src/app/components/ui/separator.tsx',
    'src/app/components/ui/sheet.tsx',
    'src/app/components/ui/sidebar.tsx',
    'src/app/components/ui/skeleton.tsx',
    'src/app/components/ui/slider.tsx',
    'src/app/components/ui/sonner.tsx',
    'src/app/components/ui/switch.tsx',
    'src/app/components/ui/textarea.tsx',
    'src/app/components/ui/toggle.tsx',
    'src/app/components/ui/toggle-group.tsx',
    'src/app/components/ui/tooltip.tsx',
]

print(f"Converting {len(files_to_convert)} files...")
converted = 0

for file_path in files_to_convert:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        converted_content = convert_ts_to_js(content)
        new_ext = '.jsx' if file_path.endswith('.tsx') else '.js'
        new_path = file_path.replace('.tsx', new_ext).replace('.ts', new_ext)
        
        with open(new_path, 'w', encoding='utf-8') as f:
            f.write(converted_content)
        
        print(f"✓ {os.path.basename(file_path)} → {os.path.basename(new_path)}")
        converted += 1
    except Exception as e:
        print(f"✗ Error: {file_path} - {e}")

print(f"\n✅ Successfully converted {converted}/{len(files_to_convert)} files!")
print("\nAll files have been converted to JavaScript!")
print("Run 'npm run dev' to test the application.")
