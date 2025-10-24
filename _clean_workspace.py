"""
Script d'exemple pour la commande /clean_code
Ce script montre comment implémenter le nettoyage complet du workspace.

Usage depuis Copilot Chat : /clean_code
"""

import os
import hashlib
from pathlib import Path
from typing import List, Dict, Set
import re


class WorkspaceCleaner:
    """Nettoie le workspace complet du projet CinéBrest."""
    
    def __init__(self, workspace_path: str = "."):
        self.workspace_path = Path(workspace_path)
        self.report = {
            "files_deleted": [],
            "space_freed": 0,
            "duplicates_found": [],
            "unused_assets": [],
            "python_issues": {},
            "js_issues": {},
            "html_issues": {}
        }
    
    def scan_workspace(self) -> Dict:
        """Analyse complète du workspace.
        
        Returns:
            Dict: Statistiques du workspace
        """
        stats = {
            "total_files": 0,
            "python_files": 0,
            "js_files": 0,
            "html_files": 0,
            "image_files": 0,
            "other_files": 0
        }
        
        for file_path in self.workspace_path.rglob("*"):
            if file_path.is_file():
                stats["total_files"] += 1
                
                if file_path.suffix == ".py":
                    stats["python_files"] += 1
                elif file_path.suffix == ".js":
                    stats["js_files"] += 1
                elif file_path.suffix == ".html":
                    stats["html_files"] += 1
                elif file_path.suffix in [".png", ".jpg", ".svg", ".ico"]:
                    stats["image_files"] += 1
                else:
                    stats["other_files"] += 1
        
        return stats
    
    def find_duplicates(self) -> List[tuple]:
        """Trouve les fichiers dupliqués par MD5.
        
        Returns:
            List[tuple]: Liste de tuples (fichier1, fichier2, taille)
        """
        file_hashes = {}
        duplicates = []
        
        for file_path in self.workspace_path.rglob("*"):
            if file_path.is_file() and file_path.suffix != ".db":
                try:
                    with open(file_path, "rb") as f:
                        file_hash = hashlib.md5(f.read()).hexdigest()
                    
                    if file_hash in file_hashes:
                        duplicates.append((
                            str(file_hashes[file_hash]),
                            str(file_path),
                            file_path.stat().st_size
                        ))
                    else:
                        file_hashes[file_hash] = file_path
                except Exception:
                    pass
        
        return duplicates
    
    def find_unused_assets(self) -> List[str]:
        """Trouve les assets (images, fonts) non référencés.
        
        Returns:
            List[str]: Liste des fichiers non utilisés
        """
        unused = []
        
        # Lire tous les templates HTML
        referenced_files = set()
        for html_file in self.workspace_path.rglob("*.html"):
            try:
                content = html_file.read_text(encoding="utf-8")
                # Trouver les références src="..." et href="..."
                refs = re.findall(r'(?:src|href)=["\']([^"\']+)["\']', content)
                referenced_files.update(refs)
            except Exception:
                pass
        
        # Vérifier les fichiers dans static/
        static_path = self.workspace_path / "static"
        if static_path.exists():
            for asset in static_path.rglob("*"):
                if asset.is_file():
                    rel_path = str(asset.relative_to(self.workspace_path))
                    web_path = f"/static/{asset.relative_to(static_path)}"
                    
                    if not any(web_path in ref for ref in referenced_files):
                        unused.append(rel_path)
        
        return unused
    
    def clean_python_file(self, file_path: Path) -> Dict:
        """Nettoie un fichier Python.
        
        Args:
            file_path: Chemin du fichier Python
            
        Returns:
            Dict: Rapport des modifications
        """
        issues = {
            "unused_imports": [],
            "unused_variables": [],
            "missing_type_hints": [],
            "missing_docstrings": [],
            "debug_prints": [],
            "extra_blank_lines": 0
        }
        
        try:
            content = file_path.read_text(encoding="utf-8")
            lines = content.split("\n")
            
            # Compter les lignes vides consécutives
            blank_count = 0
            for line in lines:
                if line.strip() == "":
                    blank_count += 1
                    if blank_count > 2:
                        issues["extra_blank_lines"] += 1
                else:
                    blank_count = 0
            
            # Détecter les print() de debug (heuristique simple)
            for i, line in enumerate(lines, 1):
                if "print(" in line and not any(emoji in line for emoji in ["🎬", "✓", "⚠️", "❌"]):
                    issues["debug_prints"].append(i)
        
        except Exception:
            pass
        
        return issues
    
    def clean_javascript(self, file_path: Path) -> Dict:
        """Nettoie le code JavaScript dans un fichier.
        
        Args:
            file_path: Chemin du fichier contenant du JS
            
        Returns:
            Dict: Rapport des modifications
        """
        issues = {
            "console_logs": [],
            "duplicate_functions": [],
            "unused_vars": []
        }
        
        try:
            content = file_path.read_text(encoding="utf-8")
            lines = content.split("\n")
            
            # Détecter les console.log()
            for i, line in enumerate(lines, 1):
                if "console.log(" in line:
                    issues["console_logs"].append(i)
            
            # Détecter les fonctions dupliquées (même nom défini plusieurs fois)
            function_names = {}
            for i, line in enumerate(lines, 1):
                match = re.search(r'function\s+(\w+)\s*\(', line)
                if match:
                    func_name = match.group(1)
                    if func_name in function_names:
                        issues["duplicate_functions"].append({
                            "name": func_name,
                            "line1": function_names[func_name],
                            "line2": i
                        })
                    else:
                        function_names[func_name] = i
        
        except Exception:
            pass
        
        return issues
    
    def clean_html(self, file_path: Path) -> Dict:
        """Nettoie un fichier HTML.
        
        Args:
            file_path: Chemin du fichier HTML
            
        Returns:
            Dict: Rapport des modifications
        """
        issues = {
            "empty_attributes": [],
            "obsolete_comments": [],
            "unused_classes": []
        }
        
        try:
            content = file_path.read_text(encoding="utf-8")
            lines = content.split("\n")
            
            # Détecter les attributs vides
            for i, line in enumerate(lines, 1):
                if 'class=""' in line or 'style=""' in line:
                    issues["empty_attributes"].append(i)
                
                # Détecter les commentaires TODO résolus ou obsolètes
                if "<!-- TODO" in line or "<!-- FIXME" in line:
                    issues["obsolete_comments"].append(i)
        
        except Exception:
            pass
        
        return issues
    
    def generate_report(self) -> str:
        """Génère un rapport détaillé du nettoyage.
        
        Returns:
            str: Contenu du rapport Markdown
        """
        report = f"""# 🧹 Rapport de Nettoyage - CinéBrest

## 📊 Résumé

- **Fichiers supprimés** : {len(self.report['files_deleted'])}
- **Espace libéré** : {self.report['space_freed'] / 1024:.2f} KB
- **Duplicatas trouvés** : {len(self.report['duplicates_found'])}
- **Assets inutilisés** : {len(self.report['unused_assets'])}

## 🗑️ Fichiers Supprimés

"""
        
        for file in self.report['files_deleted']:
            report += f"- ❌ `{file}`\n"
        
        report += "\n## 🔄 Duplicatas Détectés\n\n"
        for dup in self.report['duplicates_found']:
            report += f"- `{dup[0]}` ↔️ `{dup[1]}` ({dup[2]} bytes)\n"
        
        report += "\n## 🖼️ Assets Non Utilisés\n\n"
        for asset in self.report['unused_assets']:
            report += f"- 🗑️ `{asset}`\n"
        
        report += "\n## 🐍 Issues Python\n\n"
        for file, issues in self.report['python_issues'].items():
            if any(issues.values()):
                report += f"### `{file}`\n"
                if issues['debug_prints']:
                    report += f"- ⚠️ Print() de debug aux lignes : {', '.join(map(str, issues['debug_prints']))}\n"
                if issues['extra_blank_lines']:
                    report += f"- ⚠️ {issues['extra_blank_lines']} lignes vides en trop\n"
        
        report += "\n## 📜 Issues JavaScript\n\n"
        for file, issues in self.report['js_issues'].items():
            if any(issues.values()):
                report += f"### `{file}`\n"
                if issues['console_logs']:
                    report += f"- ⚠️ console.log() aux lignes : {', '.join(map(str, issues['console_logs']))}\n"
                if issues['duplicate_functions']:
                    for dup in issues['duplicate_functions']:
                        report += f"- ⚠️ Fonction `{dup['name']}` dupliquée (lignes {dup['line1']} et {dup['line2']})\n"
        
        report += "\n## 🌐 Issues HTML\n\n"
        for file, issues in self.report['html_issues'].items():
            if any(issues.values()):
                report += f"### `{file}`\n"
                if issues['empty_attributes']:
                    report += f"- ⚠️ Attributs vides aux lignes : {', '.join(map(str, issues['empty_attributes']))}\n"
        
        report += "\n---\n\n**✅ Nettoyage terminé !**\n"
        
        return report


# Exemple d'utilisation
if __name__ == "__main__":
    print("🧹 Nettoyage du workspace CinéBrest...")
    print("=" * 60)
    
    cleaner = WorkspaceCleaner(".")
    
    # Phase 1 : Analyse
    print("\n📂 Phase 1 : Analyse du workspace...")
    stats = cleaner.scan_workspace()
    print(f"Total : {stats['total_files']} fichiers")
    print(f"Python : {stats['python_files']} fichiers")
    print(f"JavaScript : {stats['js_files']} fichiers")
    print(f"HTML : {stats['html_files']} fichiers")
    print(f"Images : {stats['image_files']} fichiers")
    
    # Phase 2 : Duplicatas
    print("\n🔄 Phase 2 : Recherche de duplicatas...")
    duplicates = cleaner.find_duplicates()
    cleaner.report['duplicates_found'] = duplicates
    print(f"Trouvé : {len(duplicates)} duplicatas")
    
    # Phase 3 : Assets inutilisés
    print("\n🖼️  Phase 3 : Recherche d'assets inutilisés...")
    unused = cleaner.find_unused_assets()
    cleaner.report['unused_assets'] = unused
    print(f"Trouvé : {len(unused)} assets non utilisés")
    
    # Phase 4 : Nettoyage Python
    print("\n🐍 Phase 4 : Analyse du code Python...")
    for py_file in Path(".").rglob("*.py"):
        if "__pycache__" not in str(py_file):
            issues = cleaner.clean_python_file(py_file)
            if any(issues.values()):
                cleaner.report['python_issues'][str(py_file)] = issues
    
    # Phase 5 : Nettoyage JavaScript
    print("\n📜 Phase 5 : Analyse du JavaScript...")
    for html_file in Path(".").rglob("*.html"):
        issues = cleaner.clean_javascript(html_file)
        if any(issues.values()):
            cleaner.report['js_issues'][str(html_file)] = issues
    
    # Phase 6 : Nettoyage HTML
    print("\n🌐 Phase 6 : Analyse du HTML...")
    for html_file in Path(".").rglob("*.html"):
        issues = cleaner.clean_html(html_file)
        if any(issues.values()):
            cleaner.report['html_issues'][str(html_file)] = issues
    
    # Génération du rapport
    print("\n📄 Génération du rapport...")
    report_content = cleaner.generate_report()
    
    with open("CLEAN_REPORT.md", "w", encoding="utf-8") as f:
        f.write(report_content)
    
    print("\n" + "=" * 60)
    print("✅ Nettoyage terminé !")
    print(f"📊 Rapport sauvegardé dans : CLEAN_REPORT.md")
