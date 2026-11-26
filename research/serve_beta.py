"""Serve the static beta and same-origin calculations on Windows or Linux."""

import argparse
import json
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from calendar_engine import InputError, birth_sky, calendar


DIST = Path(__file__).resolve().parent.parent / "apps/web/dist"
API = {"/api/v1/panchang": calendar, "/api/v1/birth-sky": birth_sky}


class BetaServer(ThreadingHTTPServer):
    # Concurrent browser pages can open several static asset connections at once.
    request_queue_size = 32


class BetaHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        # Keep requests, including personal form submissions, off the console.
        return

    def respond(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        action = API.get(self.path)
        if action is None:
            self.respond(404, {"error": "This calculation endpoint was not found."})
            return
        origin = self.headers.get("Origin")
        port = self.server.server_port
        if origin is not None and origin not in {f"http://127.0.0.1:{port}", f"http://localhost:{port}"}:
            self.respond(403, {"error": "Open the beta locally to use the calculator."})
            return
        try:
            size = int(self.headers.get("Content-Length", "0"))
            if not 0 < size <= 4096 or self.headers.get_content_type() != "application/json":
                raise InputError("Send a small JSON calculation request.")
            payload = json.loads(self.rfile.read(size))
            if not isinstance(payload, dict):
                raise InputError("Submit a city and date.")
            result = action(payload)
        except InputError as error:
            self.respond(400, {"error": str(error)})
        except (UnicodeDecodeError, ValueError):
            self.respond(400, {"error": "The calculation request was invalid."})
        except RuntimeError:
            self.respond(422, {"error": "The calculation could not return a supported result."})
        else:
            self.respond(200, result)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=4321)
    args = parser.parse_args()
    if not (DIST / "index.html").is_file():
        parser.error("Build the site first with npm run build.")
    handler = partial(BetaHandler, directory=str(DIST))
    with BetaServer(("127.0.0.1", args.port), handler) as server:
        print(f"Itihasa beta is available at http://127.0.0.1:{server.server_port}/", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
