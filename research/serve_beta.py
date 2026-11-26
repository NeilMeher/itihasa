"""Serve the static beta and same-origin calculations on Windows or Linux."""

import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from calendar_http import CalendarHTTP


DIST = Path(__file__).resolve().parent.parent / "apps/web/dist"


class BetaServer(ThreadingHTTPServer):
    # Concurrent browser pages can open several static asset connections at once.
    request_queue_size = 32


class BetaHandler(CalendarHTTP, SimpleHTTPRequestHandler):
    def do_POST(self):
        port = self.server.server_port
        self.calculate(self.path, {f"http://127.0.0.1:{port}", f"http://localhost:{port}"})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=4321)
    parser.add_argument("--dist", type=Path, default=DIST, help="Directory containing the production Astro build")
    args = parser.parse_args()
    if not (args.dist / "index.html").is_file():
        parser.error("Build the site first with npm run build.")
    handler = partial(BetaHandler, directory=str(args.dist.resolve()))
    with BetaServer(("127.0.0.1", args.port), handler) as server:
        print(f"Itihasa beta is available at http://127.0.0.1:{server.server_port}/", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
