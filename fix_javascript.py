import os
import re

# Directory containing the UI components
ui_dir = r"c:\Users\SivaSuriyan\Downloads\Smart Reconciliation System\src\app\components\ui"

# Files that need TypeScript syntax removed
files_to_fix = [
    'sidebar.jsx',
    'sheet.jsx',
    'resizable.jsx',
    'pagination.jsx',
    'navigation-menu.jsx',
    'input-otp.jsx',
    'menubar.jsx',
    'dropdown-menu.jsx',
    'drawer.jsx',
    'dialog.jsx',
    'context-menu.jsx',
    'command.jsx',
    'carousel.jsx',
    'chart.jsx',
    'breadcrumb.jsx',
    'calendar.jsx',
    'form.jsx',
    'select.jsx',
    'slider.jsx',
    'table.jsx',
    'tabs.jsx',
]

def remove_typescript_syntax(content):
    """Remove TypeScript syntax from JavaScript code"""
    
    # Remove "import type" statements
    content = re.sub(r'import\s+{\s*type\s+([^}]+)\s*}\s*from', r'import { \1 } from', content)
    content = re.sub(r'import\s+type\s+', r'import ', content)
    
    # Remove generic type parameters from React.createContext
    content = re.sub(r'React\.createContext<[^>]+>\s*\(', r'React.createContext(', content)
    content = re.sub(r'React\.useMemo<[^>]+>\s*\(', r'React.useMemo(', content)
    content = re.sub(r'React\.useRef<[^>]+>\s*\(', r'React.useRef(', content)
    content = re.sub(r'React\.useState<[^>]+>\s*\(', r'React.useState(', content)
    
    # Remove type keyword from TypeScript type declarations
    content = re.sub(r'^type\s+\w+\s*=\s*{[^}]*};', '', content, flags=re.MULTILINE)
    
    # More complex: Remove parameter type annotations
    # Pattern: }: React.ComponentProps<...> & {...}
    content = re.sub(
        r'\}\s*:\s*React\.ComponentProps<[^>]+>\s*&\s*{[^}]*}\s*\)',
        r'})',
        content
    )
    
    # Pattern: }: React.ComponentProps<...>)
    content = re.sub(
        r'\}\s*:\s*React\.ComponentProps<[^>]+>\s*\)',
        r'})',
        content
    )
    
    # Pattern: ...props }: Type)
    content = re.sub(
        r'([\w]+)\s*}\s*:\s*[A-Z][^)]*\)',
        r'\1 })',
        content
    )
    
    # Remove type annotations inside arrow functions
    content = re.sub(r'\(([^:)]+):\s*[A-Z][^)]*\)\s*=>', r'(\1) =>', content)
    
    # Remove as Type assertions
    content = re.sub(r'\s+as\s+React\.[A-Z]\w+', '', content)
    
    return content

def fix_file(filepath):
    """Fix TypeScript syntax in a single file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        fixed_content = remove_typescript_syntax(content)
        
        if original_content != fixed_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(fixed_content)
            print(f"✓ Fixed: {os.path.basename(filepath)}")
            return True
        else:
            print(f"- No changes: {os.path.basename(filepath)}")
            return False
    except Exception as e:
        print(f"✗ Error in {os.path.basename(filepath)}: {e}")
        return False

def main():
    print("Starting TypeScript to JavaScript conversion...\n")
    
    fixed_count = 0
    for filename in files_to_fix:
        filepath = os.path.join(ui_dir, filename)
        if os.path.exists(filepath):
            if fix_file(filepath):
                fixed_count += 1
        else:
            print(f"⚠ File not found: {filename}")
    
    print(f"\n✓ Conversion complete! Fixed {fixed_count} files.")

if __name__ == "__main__":
    main()
