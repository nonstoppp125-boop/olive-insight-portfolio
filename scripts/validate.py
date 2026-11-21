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

    companion_match = re.search(r'<button\b[^>]*\bid="companion"[^>]*>', html)
    if not companion_match:
        errors.append("companion must be a native, accessible button")
    elif html.find(companion_match.group(0)) < html.find("</main>"):
        errors.append("companion must be outside main content so it persists site-wide")

    companion_rule = re.search(r'\.companion\s*\{([^}]*)\}', css)
    if not companion_rule or not re.search(r'position\s*:\s*fixed', companion_rule.group(1)):
        errors.append("companion must use fixed positioning across page sections")
    if not re.search(r'@media\(max-width:680px\)\{\.companion\{[^}]*width:112px', css):
        errors.append("companion must have a mobile-specific responsive rule")
    for marker in ('companion.addEventListener("click"', 'companion.addEventListener("pointermove"'):
        if marker not in js:
            errors.append("companion interaction missing: " + marker)

    if errors:
        for error in errors:
            print("FAIL:", error)
        return 1

    print("PASS: portfolio structure, unique IDs, anchor targets, local assets, CSS balance, persistent interactive companion, accessible studio and settings import/export.")
    print(f"Audited {len(ids)} IDs, {len(targets)} in-page links and {len(local_assets)} local assets.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
