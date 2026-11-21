from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "index.html"
CSS = ROOT / "assets/css/styles.css"
JS = ROOT / "assets/js/app.js"

def main():
    errors = []
    for path in (HTML, CSS, JS):
        if not path.is_file():
            errors.append(f"missing required file: {path.relative_to(ROOT)}")
    if errors:
        print("\n".join("FAIL: " + item for item in errors))
        return 1

    html = HTML.read_text(encoding="utf-8")
    css = CSS.read_text(encoding="utf-8")
    js = JS.read_text(encoding="utf-8")

    ids = re.findall(r'\bid="([^"]+)"', html)
    duplicates = sorted({item for item in ids if ids.count(item) > 1})
    if duplicates:
        errors.append("duplicate IDs: " + ", ".join(duplicates))

    targets = re.findall(r'<a\b[^>]*href="#([^"]+)"', html)
    missing_targets = sorted(set(targets) - set(ids))
    if missing_targets:
        errors.append("missing in-page targets: " + ", ".join(missing_targets))

    refs = re.findall(r'\b(?:src|href)="([^"]+)"', html)
    local_assets = [
        value.split("?", 1)[0] for value in refs
        if not value.startswith(("http://", "https://", "mailto:", "#", "data:"))
        and value.split("?", 1)[0].endswith((".css", ".js", ".svg"))
    ]
    missing_assets = sorted({value for value in local_assets if not (ROOT / value).is_file()})
    if missing_assets:
        errors.append("missing local assets: " + ", ".join(missing_assets))

    if css.count("{") != css.count("}"):
        errors.append(f"unbalanced CSS braces: {css.count('{')} opening / {css.count('}')} closing")

    sections = ("about", "education", "skills", "ai-workflow", "research", "projects", "progress", "future", "contact")
    for section in sections:
        if f'id="{section}"' not in html:
            errors.append(f"missing portfolio section: {section}")

    markers = ("openStudio", "applyPrompt", "localStorage", "prefers-reduced-motion",
               "companion", "pointermove", "exportDesign", "importDesign", "densitySelect", "contrastSelect", "aria-modal", "setPageInert")
    for marker in markers:
        if marker not in html + js + css:
            errors.append(f"missing expected feature marker: {marker}")

    background_character = re.search(r'<div\\b[^>]*id="bgCompanion"[^>]*>', html)
    if not background_character or 'aria-hidden="true"' not in background_character.group(0):
        errors.append("background character must be decorative and accessible")
    if html.find(background_character.group(0)) < html.find("</main>"):
        errors.append("background character must be outside main content")
    if not re.search(r'\\.bg-companion\\s*\\{[^}]*position:\\s*fixed', css):
        errors.append("background character must remain fixed across all sections")
    if not re.search(r'window\\.addEventListener\\("pointerdown",reactBackgroundCompanion', js):
        errors.append("background character must react to touch and pointer input")
    if not re.search(r'window\\.addEventListener\\("pointermove",moveBackgroundCompanion', js):
        errors.append("background character must respond to pointer movement")
    if re.search(r'fonts\\.googleapis|fonts\\.gstatic|unpkg\\.com', html + css):
        errors.append("avoid remote font/icon dependencies on the critical render path")
    if "backdrop-filter:blur(var(--blur))" in css:
        errors.append("glass surfaces must avoid expensive full-surface backdrop blur")
    if not re.search(r'\\.glass:before\\s*\\{[^}]*animation:border-turn', css):
        errors.append("glass cards must retain animated border treatment")
    if "studio-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))" not in css:
        errors.append("design studio tabs must use aligned equal-width columns")

    if errors:
        for error in errors:
            print("FAIL:", error)
        return 1

    print("PASS: portfolio structure, unique IDs, anchor targets, local assets, CSS balance, site-wide ambient companion, performance-conscious rendering, accessible studio and settings import/export.")
    print(f"Audited {len(ids)} IDs, {len(targets)} in-page links and {len(local_assets)} local assets.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
