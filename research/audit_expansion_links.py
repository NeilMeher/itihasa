"""Audit links in the built pages and the browser-only graph and source data."""

import argparse
import json
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import unquote, urldefrag, urljoin, urlsplit
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "http://127.0.0.1"
DYNAMIC_RECORDS = (
    "project-graph", "library", "mahabharata-atlas", "mahabharata-evidence", "mahabharata-evidence-details",
    "mahabharata-reading", "mahabharata-sky", "maratha-history", "maratha-sources", "ramayana-atlas", "cities",
)


class Page(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.ids = set()
        self.links = set()
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if values.get("id"):
            self.ids.add(values["id"])
        if tag == "a" and values.get("href"):
            self.links.add(values["href"])


def json_links(value):
    if isinstance(value, str) and value.startswith(("https://", "http://", "/")):
        yield value
    elif isinstance(value, dict):
        for child in value.values():
            yield from json_links(child)
    elif isinstance(value, list):
        for child in value:
            yield from json_links(child)


def probe(url):
    try:
        request = Request(url, headers={"User-Agent": "Itihasa-source-link-audit/1.0", "Range": "bytes=0-0"})
        with urlopen(request, timeout=8) as result:
            return {"url": url, "status": result.status, "destination": result.url}
    except HTTPError as error:
        return {"url": url, "status": error.code, "destination": error.url}
    except (URLError, TimeoutError, ValueError) as error:
        return {"url": url, "status": "unverified", "reason": str(error)}


def audit(dist, external):
    pages = {file.relative_to(dist).as_posix(): Page(file.read_text(encoding="utf-8"))
             for file in sorted(dist.rglob("*.html"))}
    if "index.html" not in pages:
        raise ValueError("Supply the directory containing a fresh static build.")

    def page_route(file):
        return "/" + (file.removesuffix("index.html") if file.endswith("index.html") else file)

    routes = {page_route(file): page for file, page in pages.items()}
    links = {urljoin(ORIGIN + page_route(file), href) for file, page in pages.items() for href in page.links}
    for name in DYNAMIC_RECORDS:
        records = json.loads((ROOT / "content" / f"{name}.json").read_bytes())
        links.update(urljoin(ORIGIN + "/", href) for href in json_links(records))

    violations = []
    internal_count = 0
    destinations = set()
    for link in sorted(links):
        spec = urlsplit(link)
        if spec.netloc == "127.0.0.1":
            internal_count += 1
            path = unquote(spec.path or "/")
            page = routes.get(path) or routes.get(path.rstrip("/") + "/")
            fragment = unquote(spec.fragment).split(":~:", 1)[0]
            file = (dist / path.lstrip("/")).resolve()
            if page is None and (not file.is_relative_to(dist) or not file.is_file()):
                violations.append({"url": link, "issue": "missing local target"})
            elif fragment and page is not None and fragment not in page.ids:
                violations.append({"url": link, "issue": "missing HTML id"})
        elif spec.scheme in {"http", "https"}:
            destinations.add(urldefrag(link).url)

    report = {"pages": len(pages), "local_links": internal_count, "violations": violations,
              "external_page_targets": len(destinations)}
    if external:
        with ThreadPoolExecutor(max_workers=5) as pool:
            report["external"] = list(pool.map(probe, sorted(destinations)))
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dist", type=Path, required=True)
    parser.add_argument("--external", action="store_true")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    report = audit(args.dist.resolve(), args.external)
    rendered = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.write_text(rendered, encoding="utf-8")
    else:
        print(rendered, end="")
    raise SystemExit(bool(report["violations"]))
