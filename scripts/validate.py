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

    # Guard the lightweight, local-first delivery contract.
    for path, limit in ((HTML, 150_000), (CSS, 100_000), (JS, 80_000)):
        size = path.stat().st_size
        if size > limit:
            errors.append(f"{path.relative_to(ROOT)} exceeds {limit} byte budget ({size})")
    if not re.search(r'<html\b[^>]*lang="en"', html, re.I):
        errors.append("document language must be declared")
    if not re.search(r'<meta\b[^>]*name="viewport"', html, re.I):
        errors.append("responsive viewport metadata is required")
    if not re.search(r'<meta\b[^>]*name="description"', html, re.I):
        errors.append("search description metadata is required")
    if 'class="skip-link" href="#home"' not in html or ".skip-link:focus" not in css:
        errors.append("keyboard users need a visible skip-to-content link")
    if ':focus-visible' not in css or 'aria-label="Primary navigation"' not in html:
        errors.append("keyboard focus and primary navigation semantics are required")
    if 'aria-controls="mainNav" aria-expanded="false"' not in html or 'setAttribute("aria-expanded","false")' not in js:
        errors.append("mobile navigation expanded state must stay synchronized")
    if re.search(r'<(?:script|link)\b[^>]*(?:src|href)="https?://', html, re.I):
        errors.append("critical scripts and styles must remain local")
    if re.search(r'<img\b(?![^>]*\balt=)[^>]*>', html, re.I):
        errors.append("every image element must include alternative text")
    for match in re.finditer(r'<a\b([^>]*target="_blank"[^>]*)>', html, re.I):
        if not re.search(r'\brel="[^"]*noopener', match.group(1), re.I):
            errors.append("new-tab links must include rel=noopener")
            break

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
    if 'bgCompanion.addEventListener("pointerdown",startMascotDrag)' not in js or "function dragMascot(event)" not in js or "oliveInsightMascotPosition" not in js:
        errors.append("background character must be draggable and retain its position")
    if "mascotNextX=event.clientX-mascotOffsetX" not in js or "requestAnimationFrame" not in js or "snapMascotToNearestEdge" not in js:
        errors.append("drag updates must be frame-coalesced and magnetically snap to the nearest screen edge")
    if '"--mascot-x"' not in js or '"--mascot-y"' not in js or "translate3d(var(--mascot-x" not in css:
        errors.append("mascot position must update through GPU-friendly transforms")
    if "touch-action:none" not in css or ".bg-companion.is-dragging" not in css:
        errors.append("background character drag must support smooth touch interaction")
    if re.search(r'fonts\.googleapis|fonts\.gstatic|unpkg\.com', html + css):
        errors.append("avoid remote font/icon dependencies on the critical render path")
    if "backdrop-filter:blur(13px) saturate(145%)" not in css:
        errors.append("Liquid Glass surfaces must use restrained optical blur")
    if not re.search(r'\.glass:before\s*\{[^}]*animation:border-turn', css):
        errors.append("glass cards must retain super-thin animated edge treatment")
    if "animation-play-state:var(--border-play,running)" not in css or "setupBorderMotion" not in js:
        errors.append("off-screen card borders must pause to reduce rendering work")
    if "capsule-clock" not in css or 'id="ambientCapsule"' not in html:
        errors.append("centered background capsule must rotate continuously")
    if "offset-path:ellipse(43vw 39vh at 50% 50%)" not in css or "offset-distance:100%" not in css or "offset-rotate:auto" not in css:
        errors.append("capsule must orbit around the full viewport like a clock hand")
    if "--edge-angle" not in css or "mask-composite:exclude" not in css or "-webkit-mask-composite:xor" not in css:
        errors.append("animated card edges must be drawn only on the outer perimeter")
    final_motion_css = css[css.rfind("/* FINAL MOTION GEOMETRY"):]
    if "mask-composite:exclude" not in final_motion_css or "-webkit-mask-composite:xor" not in final_motion_css:
        errors.append("animated edge must use a perimeter-only mask for standard and WebKit browsers")
    if "linear-gradient(transparent,transparent) padding-box,conic-gradient" in final_motion_css:
        errors.append("animated edge gradient must not paint across the card face")
    if "borderSpeed" not in js or 'id="borderSpeedControl"' not in html or 'id="borderToggle"' not in html:
        errors.append("super-thin card edge animation controls must remain available")
    for control in ("accentRed", "accentGreen", "accentBlue", "accentHex"):
        if f'id="{control}"' not in html or control not in js:
            errors.append(f"RGB/HEX color mixer is missing {control}")
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

    if 'id="scrollRail"' not in html or 'id="scrollRailBall"' not in html or "scrubRail(event)" not in js:
        errors.append("draggable vertical scroll rail and progress ball are required")
    if "left:clamp(8px,1.6vw,22px)" not in css or "top:26px;bottom:26px" not in css or "--rail-ball-y" not in css + js or "width:21px;height:21px" not in css or "width:20px;height:20px" not in css or "ballY+ballSize/2" not in js:
        errors.append("scroll rail must span the full viewport on the left with an edge-safe ball position")
    if "scale(1.19)" not in css or "scale(1.2)" not in css or "transition:box-shadow .12s ease,transform .12s ease" not in css:
        errors.append("scroll ball must grow smoothly while dragging without changing its layout geometry")
    if 'style.scrollBehavior="auto"' not in js or "railPreviousBehavior" not in js:
        errors.append("direct ball dragging must bypass smooth-scroll easing to prevent lag")
    if ".scroll-rail-progress" not in css or "touch-action:none" not in css:
        errors.append("scroll rail must reveal progress and support direct touch dragging")
    if 'id="pageLoader"' not in html or ".page-loader" not in css or "dismissLoader" not in js:
        errors.append("branded loading transition must exist and dismiss itself")
    if 'id="scrollStaircase"' in html or "staircase" in css.lower() or "staircase" in js.lower():
        errors.append("removed staircase markup, styling and scroll handlers must stay absent")
    if "scroll-behavior:smooth" not in css or "overflow-x:hidden" not in css:
        errors.append("native smooth vertical scrolling and horizontal overflow protection must remain")

    if errors:
        for error in errors:
            print("FAIL:", error)
        return 1

    print("PASS: structure, local-first assets, metadata, link safety, responsive budget, capsule orbit, draggable companion, RGB/HEX, hairline edges and Liquid Glass.")
    print(f"Audited {len(ids)} IDs, {len(targets)} in-page links and {len(local_assets)} local assets.")
    print(f"Size budget: HTML {HTML.stat().st_size}B / 150000B, CSS {CSS.stat().st_size}B / 100000B, JS {JS.stat().st_size}B / 80000B.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
