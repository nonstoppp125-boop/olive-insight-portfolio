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

    background_character = re.search(r'<div\b[^>]*id="bgCompanion"[^>]*>', html)
    if not background_character or 'aria-hidden="true"' not in background_character.group(0):
        errors.append("background character must be decorative and accessible")
    elif html.find(background_character.group(0)) < html.find("</main>"):
        errors.append("background character must be outside main content")
    if not re.search(r'\.bg-companion\s*\{[^}]*position:\s*fixed', css):
        errors.append("background character must remain fixed across all sections")
    if 'window.addEventListener("pointerdown",reactBackgroundCompanion' not in js:
        errors.append("background character must react to touch and pointer input")
    if 'window.addEventListener("pointermove",moveBackgroundCompanion' not in js or 'event.pointerType==="touch"?8:18' not in js or 'window.addEventListener("pointerup",resetBackgroundCompanion' not in js:
        errors.append("background character must respond to pointer movement")
    if re.search(r'fonts\.googleapis|fonts\.gstatic|unpkg\.com', html + css):
        errors.append("avoid remote font/icon dependencies on the critical render path")
    if "backdrop-filter:blur(var(--blur))" in css:
        errors.append("glass surfaces must avoid expensive full-surface backdrop blur")
    if not re.search(r'\.glass:before\s*\{[^}]*animation:border-turn', css):
        errors.append("glass cards must retain animated border treatment")
    if "animation-play-state:var(--border-play,running)" not in css or "setupBorderMotion" not in js:
        errors.append("off-screen card borders must pause to reduce rendering work")
    card_classes = ("card", "timeline-card", "feature-card", "future-item", "empty-state", "progress-panel", "contact-card", "float-note")
    for class_value in re.findall(r'<(?:article|div)\b[^>]*class="([^"]+)"[^>]*>', html):
        class_set = set(class_value.split())
        if class_set.intersection(card_classes) and "glass" not in class_set:
            errors.append("every content card must use the shared animated glass surface")
            break
    if 'class="glass float-note note-top"' not in html or 'class="glass float-note note-bottom"' not in html:
        errors.append("hero information panels must use the animated glass card system")
    if "filter:blur(36px)" in css or "filter:blur(90px)" in css:
        errors.append("avoid expensive large-area ambient blur filters")
    if 'font:"system"' not in js or "fontStacks={system:" not in js or 'value="editorial"' not in html or 'value="technical"' not in html:
        errors.append("typography presets must use available local font stacks")
    if 'root.style.setProperty("--bg",palette.bg)' not in js or '--ambient-softness' not in js:
        errors.append("palette background and softness controls must apply to the rendered page")
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
