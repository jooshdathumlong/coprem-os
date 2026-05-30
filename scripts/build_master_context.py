import os

def read_file(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return f.read().strip()
    except Exception as e:
        return f"Error reading {path}: {e}"

def generate_tree(dir_path, exclude_dirs=['.obsidian', '__pycache__', 'outputs', 'knowledge', '.git', 'node_modules']):
    tree_str = "Coprem/\n"
    for root, dirs, files in os.walk(dir_path):
        dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('.')]
        level = root.replace(dir_path, '').count(os.sep)
        indent = '    ' * (level + 1)
        if root != dir_path:
            tree_str += f"{indent}{os.path.basename(root)}/\n"
        subindent = '    ' * (level + 2)
        
        # Only show md and py files in the tree for brevity
        for f in sorted(files):
            if f.endswith('.md') or f.endswith('.py') or f.endswith('.gs'):
                if root == dir_path and f not in ['CHANGELOG.md', 'VERSION.md', 'master_context.md']:
                     continue # skip root files except specific ones
                tree_str += f"{subindent}{f}\n"
    return tree_str

def main():
    base_dir = "/Users/eilinaire/Desktop/Coprem"
    
    files_to_include = [
        "English/CLAUD.md",
        "English/README.md",
        "English/prem_profile.md",
        "Thai/CLAUD.md",
        "Thai/README.md",
        "Thai/prem_profile.md",
        "Thai/DASHBOARD.md",
    ]
    
    output = "# 🧠 Coprem Master Context (v3.0 Lean Architecture)\n\n"
    output += "This document contains core identity files in full text, and a directory map for all other files to prevent token bloat.\n\n---\n\n"
    output += "## 🏛️ Core Identity Files (Full Text)\n\n"
    
    for f in files_to_include:
        path = os.path.join(base_dir, f)
        content = read_file(path)
        output += f"### 📄 File: `{f}`\n\n"
        output += content + "\n\n\n---\n\n"
        
    output += "## 🗺️ System Map (Directory Tree)\n\n```text\n"
    output += generate_tree(base_dir)
    output += "```\n"
    
    with open(os.path.join(base_dir, "master_context.md"), 'w', encoding='utf-8') as f:
        f.write(output)
        
    print("Successfully built master_context.md")

if __name__ == "__main__":
    main()
