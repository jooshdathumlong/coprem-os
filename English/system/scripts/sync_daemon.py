#!/usr/bin/env python3
import os
CORE_FILES = {
    "English/GEMINI.md",
    "English/prem_profile.md",
    "English/README.md",
    "Thai/GEMINI.md",
    "Thai/prem_profile.md",
    "Thai/README.md",
    "Thai/คุมบังเหียน_Coprem.md"
}

def generate_tree(startpath):
    tree_str = "```text\n"
    for root, dirs, files in os.walk(startpath):
        if "node_modules" in dirs:
            dirs.remove("node_modules")
        # Exclude hidden directories like .git
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        
        level = root.replace(startpath, '').count(os.sep)
        indent = ' ' * 4 * (level)
        tree_str += f"{indent}{os.path.basename(root)}/\n"
        subindent = ' ' * 4 * (level + 1)
        for f in sorted(files):
            if f.endswith('.md') and f != "Coprem_All_Data_Context.md":
                tree_str += f"{subindent}{f}\n"
    tree_str += "```\n\n"
    return tree_str

def compile_context():
    vault_path = "/Users/eilinaire/Desktop/Coprem"
    output_file = os.path.join(vault_path, "Coprem_All_Data_Context.md")
    version_file = os.path.join(vault_path, "VERSION.md")
    
    version = "Unknown"
    if os.path.exists(version_file):
        with open(version_file, "r", encoding="utf-8") as vf:
            version = vf.read().strip()
    
    print(f"[*] Compiling Optimized Master Context from {vault_path}...")
    
    with open(output_file, "w", encoding="utf-8") as out:
        out.write(f"# 🧠 Coprem Master Context (Optimized) - v{version}\n\n")
        out.write("This document contains core identity files in full text, and a directory map for all other files to prevent token bloat.\n\n---\n\n")
        
        # 1. Write full text of core files
        out.write("## 🏛️ Core Identity Files (Full Text)\n\n")
        for core_file in sorted(list(CORE_FILES)):
            full_path = os.path.join(vault_path, core_file)
            if os.path.exists(full_path):
                out.write(f"### 📄 File: `{core_file}`\n\n")
                with open(full_path, "r", encoding="utf-8") as f:
                    out.write(f.read())
                out.write("\n\n---\n\n")
                
        # 2. Write directory tree map for everything else
        out.write("## 🗺️ System Map (Directory Tree)\n\n")
        tree = generate_tree(vault_path)
        out.write(tree)
            
    print(f"[+] Optimized context compiled and written to: {output_file}")

if __name__ == "__main__":
    compile_context()
