from html.parser import HTMLParser
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "index.html"
CSS = ROOT / "assets/css/styles.css"
JS = ROOT / "assets/js/app.js"

class AuditParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.targets = []
        self.assets = []
        self.errors = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            self.ids.append(attrs["id"])
        if tag == "a" and attrs.get("href", "").startswith("#"):
            self.targets.append(attrs["href"][1:])
        for key in ("src", "href"):
            value = attrs.get(key, "")
            if value and not value.startswith(("http://", "https://", "mailto:", "#", "data:")):
                if value.split("?", 1)[0].endswith((".css", ".js", ".svg")):
                    self.assets.append(value.split("?", 1)[0])

def main():
    for path in (HTML, CSS, JS):
        if not path.is_file():
            raise SystemExit(f"FAIL: missing {path.relative_to(ROOT)}")
    html = HTML.read_text(encoding="utf-8")
    css = CSS.read_text(encoding="utf-8")
    js = JS.read_text(encoding="utf-8")
    parser = AuditParser()
    parser.feed(html)
    duplicates = sorted({x for x in parser.ids if parser.ids.count(x) > 1})
    if duplicates:
        parser.errors.append("duplicate IDs: " + ", ".join(duplicates))
    missing_targets = sorted(set(parser.targets) - set(parser.ids))
    if missing_targets:
        parser.errors.append("missing in-page targets: " + ", ".join(missing_targets))
    missing_assets = [x for x in parser.assets if not (ROOT / x).is_file()]
    if missing_assets:
        parser.errors.append("missing local assets: " + ", ".join(missing_assets))
    if css.count("{") != css.count("}"):
        parser.errors.append("unbalanced CSS braces")
    for section in ("about", "education", "skills", "ai-workflow", "research", "projects", "progress", "future", "contact"):
        if f'id="{section}"' not in html:
            parser.errors.append(f"missing portfolio section: {section}")
    for required in ("openStudio", "applyPrompt", "localStorage", "prefers-reduced-motion", "companion", "pointermove", "exportDesign", "importDesign", "aria-modal", "setPageInert"):
        if required not in (html + js + css):
            parser.errors.append(f"missing expected feature marker: {required}")
    if parser.errors:
        for error in parser.errors:
            print("FAIL:", error)
        return 1
    print("PASS: HTML parsed; unique IDs; in-page links; local assets; CSS braces; portfolio sections; persistent companion; touch interaction; studio accessibility and import/export.")
    print(f"Audited {len(parser.ids)} IDs, {len(parser.targets)} in-page links and {len(parser.assets)} local asset references.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
