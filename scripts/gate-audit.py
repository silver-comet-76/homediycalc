#!/usr/bin/env python3
"""HomeDIYCalc release-gate audit checks (ADR-9).

Reads the production build in dist/ and verifies, with no network access:
  - 40 built pages: 39 indexable pages + the custom 404 page
  - sitemap.xml lists exactly the 39 indexable pages (404 excluded)
  - every page: unique <title> (<= 65 chars), unique meta description
    (<= 165 chars), self-referential canonical, exactly one <h1>,
    Open Graph + Twitter card meta, JSON-LD that parses
  - zero dead internal links (href="/..." resolves to a file in dist/,
    #anchors exist on the target page)
  - no external scripts or stylesheets
  - no tracking/ad strings (Google Analytics, Tag Manager, DoubleClick,
    Facebook Pixel, AdSense) in the built output
  - no fetch()/XMLHttpRequest/WebSocket in the built client JavaScript
  - src/lib/ads.ts is still a placeholder (no real ad code)

Build modes (Phase 8 review response, PR #4 review 6012776210, P0,
ADR-15) — the URL and noindex rules depend on the build's mode, and
the audit enforces the exact origin, not just the URL path:
  - production (--mode production --origin <origin>): every canonical,
    sitemap <loc>, and robots Sitemap: must be absolute with EXACTLY
    the given origin (a wrong host fails); no page may carry a noindex
    meta tag. --origin is required in this mode.
  - preview (--mode preview [--origin <origin>]): every indexable page
    AND the 404 must carry a noindex meta tag. Canonicals, sitemap
    locations, and robots Sitemap: must use exactly the given origin
    when one is passed, and must be relative when none is passed.
  - local (--mode local): every indexable page AND the 404 must carry a
    noindex meta tag (fail-closed: an unconfigured build is never
    indexable); canonicals, sitemap locations, and robots Sitemap:
    must all be relative.

Usage: python3 scripts/gate-audit.py [--mode production|preview|local]
         [--origin https://example.com] [dist-dir]
Exit 0 when every check passes, 1 otherwise. Prints one line per check.
"""

import argparse
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse

TRACKING_PATTERNS = [
    # Tracking/ad loader endpoints — checked as domain strings, not bare
    # words: the privacy policy legitimately names "Google AdSense"
    # (disabled) in prose, and React's client bundle contains
    # "onDoubleClick" event-handler names. Neither is tracking.
    "googletagmanager.com",
    "google-analytics.com",
    "doubleclick.net",
    "facebook.net/tr",
    "connect.facebook.net",
    "adsbygoogle",
    "hotjar.com",
    "cdn.segment.com",
]

NETWORK_PATTERNS = ["fetch(", "XMLHttpRequest", "WebSocket"]


def validate_origin(origin: str) -> str:
    """Validate an expected production origin with the same rule as
    src/lib/origin.ts: a bare https:// hostname, no path/port/query/
    localhost/IP. Returns the normalized origin (lowercase host).
    Raises ValueError on an invalid origin."""
    parsed = urlparse(origin)
    host = parsed.hostname or ""
    is_ip = bool(re.fullmatch(r"\d+\.\d+\.\d+\.\d+", host)) or host.startswith("[")
    if (
        parsed.scheme != "https"
        or parsed.username is not None
        or parsed.password is not None
        or parsed.port is not None
        or parsed.path not in ("", "/")
        or parsed.query != ""
        or parsed.fragment != ""
        or host == ""
        or "." not in host
        or host == "localhost"
        or host.endswith(".local")
        or is_ip
    ):
        raise ValueError(
            f"Invalid origin {origin!r}: a production origin must be a bare https:// "
            "hostname, e.g. https://homediycalc.pages.dev — no http, path, port, "
            "query, localhost, or IP address."
        )
    return f"https://{host.lower()}"


def origin_of(url: str) -> str:
    """Scheme + host of an absolute URL, or '' when the URL is relative."""
    parsed = urlparse(url)
    if not parsed.scheme:
        return ""
    return f"{parsed.scheme}://{parsed.hostname or ''}".lower()


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.title = ""
        self._in_title = False
        self.description = None
        self.canonical = None
        self.noindex = False
        self.h1_count = 0
        self.og = False
        self.twitter = False
        self.json_ld_blocks: list[str] = []
        self._in_json_ld = False
        self._json_ld_buf = ""
        self.links: list[str] = []
        self.ids: set[str] = set()
        self.scripts: list[str] = []
        self.stylesheets: list[str] = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "title":
            self._in_title = True
        elif tag == "meta":
            if a.get("name") == "description":
                self.description = a.get("content", "")
            if a.get("name") == "robots" and "noindex" in a.get("content", ""):
                # A robots noindex tag is required on every page of a
                # local/preview build (fail-closed, ADR-15) and forbidden
                # on every page of a production build; the mode check
                # below enforces whichever rule applies.
                self.noindex = True
            if a.get("property", "").startswith("og:"):
                self.og = True
            if a.get("name", "").startswith("twitter:"):
                self.twitter = True
        elif tag == "link":
            if a.get("rel") == "canonical":
                self.canonical = a.get("href")
            if a.get("rel") == "stylesheet" and a.get("href"):
                self.stylesheets.append(a["href"])
        elif tag == "h1":
            self.h1_count += 1
        elif tag == "script":
            if a.get("type") == "application/ld+json":
                self._in_json_ld = True
                self._json_ld_buf = ""
            elif a.get("src"):
                self.scripts.append(a["src"])
        elif tag == "a" and a.get("href"):
            self.links.append(a["href"])
        if "id" in a:
            self.ids.add(a["id"])

    def handle_data(self, data):
        if self._in_title:
            self.title += data
        if self._in_json_ld:
            self._json_ld_buf += data

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
        if tag == "script" and self._in_json_ld:
            self._in_json_ld = False
            self.json_ld_blocks.append(self._json_ld_buf)


def page_path(dist: Path, url_path: str) -> Path | None:
    """Map a site URL path to a file in dist/, or None if it cannot exist."""
    path = unquote(urlparse(url_path).path)
    if not path.startswith("/"):
        return None
    rel = path.lstrip("/")
    if rel == "":
        return dist / "index.html"
    candidate = dist / rel
    if candidate.is_file():
        return candidate
    if (dist / rel / "index.html").is_file():
        return dist / rel / "index.html"
    if (dist / (rel + ".html")).is_file():
        return dist / (rel + ".html")
    return None


def main() -> int:
    parser = argparse.ArgumentParser(description="HomeDIYCalc release-gate audit checks")
    parser.add_argument("--mode", choices=["production", "preview", "local"],
                        default="production",
                        help="build mode whose URL/noindex rules to enforce")
    parser.add_argument("--origin", default=None,
                        help="expected production origin, e.g. https://example.com "
                             "(required for --mode production; optional for preview)")
    parser.add_argument("dist_dir", nargs="?", default="dist")
    args = parser.parse_args()
    mode = args.mode
    if mode == "production" and not args.origin:
        print("FAIL  --mode production requires --origin (the exact production origin)")
        return 1
    if mode == "local" and args.origin:
        print("FAIL  --mode local takes no --origin (a local build has no origin)")
        return 1
    expected_origin = validate_origin(args.origin) if args.origin else None
    if expected_origin is None and mode == "production":
        print("FAIL  --mode production requires a valid --origin")
        return 1

    dist = Path(args.dist_dir)
    repo = Path(__file__).resolve().parent.parent
    failures: list[str] = []

    def check(name: str, ok: bool, detail: str = "") -> None:
        print(f"{'PASS' if ok else 'FAIL'}  {name}" + (f" — {detail}" if detail else ""))
        if not ok:
            failures.append(name)

    print(f"audit mode: {mode}" + (f", expected origin: {expected_origin}" if expected_origin else ""))

    html_files = sorted(dist.rglob("*.html"))
    pages = [p for p in html_files if p.name != "404.html"]
    check("built pages: 39 indexable + custom 404", len(pages) == 39 and (dist / "404.html").is_file(),
          f"{len(pages)} indexable, 404={'yes' if (dist / '404.html').is_file() else 'no'}")

    sitemap = (dist / "sitemap.xml").read_text(encoding="utf-8")
    sitemap_urls = re.findall(r"<loc>([^<]+)</loc>", sitemap)
    sitemap_paths = sorted(urlparse(u).path for u in sitemap_urls)
    page_paths = sorted("/" + str(p.relative_to(dist)).removesuffix("index.html").removesuffix(".html")
                        for p in pages)
    # Normalise: /calculators/x/ style paths with trailing slash, root as /.
    page_paths = [pp if pp.endswith("/") or pp == "/" else pp + "/" for pp in page_paths]
    page_paths = ["/" if pp == "//" else pp for pp in page_paths]
    check("sitemap lists exactly the 39 indexable pages (404 excluded)",
          len(sitemap_urls) == 39 and sitemap_paths == sorted(page_paths)
          and not any("404" in u for u in sitemap_urls),
          f"{len(sitemap_urls)} URLs")
    # Origin rule (ADR-15): production and preview-with-origin sitemaps
    # carry absolute <loc> with exactly the expected origin; local and
    # preview-without-origin sitemaps stay relative. A wrong host fails
    # even if every path is right.
    if expected_origin is not None:
        bad_sitemap_origin = [u for u in sitemap_urls if origin_of(u) != expected_origin]
        check("sitemap <loc> URLs use exactly the expected origin",
              not bad_sitemap_origin,
              f"{len(bad_sitemap_origin)} wrong-origin URLs" + (f": {bad_sitemap_origin[0]}" if bad_sitemap_origin else ""))
    else:
        bad_sitemap_absolute = [u for u in sitemap_urls if origin_of(u) != ""]
        check("sitemap <loc> URLs are relative (no origin set)",
              not bad_sitemap_absolute,
              f"{len(bad_sitemap_absolute)} absolute URLs" + (f": {bad_sitemap_absolute[0]}" if bad_sitemap_absolute else ""))

    # robots.txt Sitemap: directive follows the same origin rule.
    robots_text = (dist / "robots.txt").read_text(encoding="utf-8")
    sitemap_lines = [line for line in robots_text.splitlines()
                     if line.strip().lower().startswith("sitemap:")]
    if expected_origin is not None:
        robots_ok = len(sitemap_lines) == 1 and sitemap_lines[0].split(":", 1)[1].strip() == f"{expected_origin}/sitemap.xml"
        check("robots.txt Sitemap: is absolute with exactly the expected origin",
              robots_ok, sitemap_lines[0].strip() if sitemap_lines else "no Sitemap: line")
    else:
        robots_ok = len(sitemap_lines) == 1 and sitemap_lines[0].split(":", 1)[1].strip() == "/sitemap.xml"
        check("robots.txt Sitemap: is relative (no origin set)",
              robots_ok, sitemap_lines[0].strip() if sitemap_lines else "no Sitemap: line")

    parsed: dict[Path, PageParser] = {}
    for p in html_files:
        parser = PageParser()
        parser.feed(p.read_text(encoding="utf-8"))
        parsed[p] = parser

    titles = [parsed[p].title.strip() for p in pages]
    descriptions = [parsed[p].description for p in pages]
    check("unique titles, none over 65 chars",
          len(set(titles)) == len(titles) and all(titles) and all(len(t) <= 65 for t in titles),
          f"{len(set(titles))}/{len(titles)} unique, longest {max(len(t) for t in titles)} chars")
    check("unique meta descriptions, none over 165 chars",
          len(set(descriptions)) == len(descriptions) and all(d is not None and d for d in descriptions)
          and all(len(d) <= 165 for d in descriptions if d),
          f"{len(set(descriptions))}/{len(descriptions)} unique")
    bad_canonical = []
    bad_h1 = []
    bad_social = []
    bad_jsonld = []
    bad_noindex = []
    missing_noindex = []
    for p in pages:
        parser = parsed[p]
        url_path = "/" + str(p.relative_to(dist)).removesuffix("index.html").removesuffix(".html")
        if url_path == "/":
            url_path = "/"
        elif not url_path.endswith("/"):
            url_path += "/"
        # Canonical must be self-referential (path = the page's own path)
        # AND follow the mode's origin rule (ADR-15): production and
        # preview-with-origin carry absolute canonicals with exactly the
        # expected origin; local and preview-without-origin stay
        # relative. A wrong host fails even when the path is right.
        canonical_path = urlparse(parser.canonical).path if parser.canonical else None
        canonical_origin = origin_of(parser.canonical) if parser.canonical else None
        if canonical_path != url_path:
            bad_canonical.append(str(p.relative_to(dist)))
        elif expected_origin is not None and canonical_origin != expected_origin:
            bad_canonical.append(str(p.relative_to(dist)))
        elif expected_origin is None and canonical_origin not in (None, ""):
            bad_canonical.append(str(p.relative_to(dist)))
        if parser.noindex:
            bad_noindex.append(str(p.relative_to(dist)))
        else:
            missing_noindex.append(str(p.relative_to(dist)))
        if parser.h1_count != 1:
            bad_h1.append(str(p.relative_to(dist)))
        if not (parser.og and parser.twitter):
            bad_social.append(str(p.relative_to(dist)))
        for block in parser.json_ld_blocks:
            try:
                json.loads(block)
            except json.JSONDecodeError:
                bad_jsonld.append(str(p.relative_to(dist)))
    if expected_origin is not None:
        check("canonical present, self-referential, and absolute with exactly the expected origin",
              not bad_canonical, "; ".join(bad_canonical[:3]))
    else:
        check("canonical present, self-referential, and relative (no origin set)",
              not bad_canonical, "; ".join(bad_canonical[:3]))
    if mode == "production":
        check("no page carries a robots noindex meta (production builds are indexable)", not bad_noindex, "; ".join(bad_noindex[:3]))
    else:
        # Fail-closed (ADR-15): a local or preview build must carry a
        # noindex tag on every indexable page AND the 404 (which uses
        # the same Layout), so an unconfigured build can never leak
        # into search results.
        four04_noindex = parsed[dist / "404.html"].noindex if (dist / "404.html") in parsed else False
        check("every indexable page and the 404 carry a robots noindex meta (local/preview builds are never indexable)",
              not missing_noindex and four04_noindex,
              "; ".join(missing_noindex[:3]) + ("; 404 lacks noindex" if not four04_noindex else ""))
    check("exactly one H1 per page", not bad_h1, "; ".join(bad_h1[:3]))
    check("Open Graph + Twitter card on every page", not bad_social, "; ".join(bad_social[:3]))
    check("every JSON-LD block parses", not bad_jsonld, "; ".join(bad_jsonld[:3]))

    dead_links: list[str] = []
    for p in html_files:
        for href in parsed[p].links:
            if href.startswith(("http://", "https://", "mailto:", "tel:")):
                continue
            target_path, _, fragment = href.partition("#")
            target = page_path(dist, target_path) if target_path else p
            if target is None or not target.is_file():
                dead_links.append(f"{p.relative_to(dist)} -> {href}")
            elif fragment and fragment not in parsed[target].ids:
                dead_links.append(f"{p.relative_to(dist)} -> {href} (missing #{fragment})")
    check("zero dead internal links", not dead_links, "; ".join(dead_links[:3]))

    external_assets = []
    for p in html_files:
        for src in parsed[p].scripts + parsed[p].stylesheets:
            if src.startswith(("http://", "https://", "//")):
                external_assets.append(f"{p.relative_to(dist)}: {src}")
    check("no external scripts or stylesheets", not external_assets, "; ".join(external_assets[:3]))

    blob = "".join(p.read_text(encoding="utf-8", errors="ignore") for p in html_files)
    js_files = list((dist / "_astro").glob("*.js")) if (dist / "_astro").is_dir() else []
    js_blob = "".join(p.read_text(encoding="utf-8", errors="ignore") for p in js_files)
    found_tracking = sorted({pat for pat in TRACKING_PATTERNS if pat in blob.lower() or pat in js_blob.lower()})
    check("no tracking/ad strings in built output", not found_tracking, ", ".join(found_tracking))
    found_network = sorted({pat for pat in NETWORK_PATTERNS if pat in js_blob})
    check("no fetch/XHR/WebSocket in built client JavaScript", not found_network, ", ".join(found_network))

    ads = (repo / "src" / "lib" / "ads.ts").read_text(encoding="utf-8")
    check("ads.ts is still a placeholder (no real ad code)",
          "placeholder" in ads.lower() and "adsbygoogle" not in ads.lower())

    four04 = parsed[dist / "404.html"]
    check("custom 404: single H1, links home + All Calculators, excluded from sitemap",
          four04.h1_count == 1 and "/" in four04.links and "/calculators/" in four04.links
          and not any("404" in u for u in sitemap_urls))

    print(f"\n{'ALL CHECKS PASSED' if not failures else 'FAILURES: ' + ', '.join(failures)}")
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
