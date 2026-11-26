"""Shared JSON protocol for the two same-origin calendar endpoints."""

import json
from http.server import BaseHTTPRequestHandler

if __package__:
    from .calendar_engine import InputError, birth_sky, calendar
else:
    from calendar_engine import InputError, birth_sky, calendar


API = {"/api/v1/panchang": calendar, "/api/v1/birth-sky": birth_sky}
MAX_BODY = 4096


class CalendarHTTP:
    def log_message(self, format, *args):
        # Calculation input is transient, including on malformed requests.
        return

    def respond(self, status, payload, *, allow=None):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        if allow:
            self.send_header("Allow", allow)
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def calculate(self, path, allowed_origins):
        action = API.get(path)
        if action is None:
            self.respond(404, {"error": "This calculation endpoint was not found."})
            return
        origin = self.headers.get("Origin")
        if (origin is not None and origin not in allowed_origins) or self.headers.get("Sec-Fetch-Site") == "cross-site":
            self.respond(403, {"error": "Open Itihāsa on this site to use the calculator."})
            return
        try:
            size = int(self.headers.get("Content-Length", "0"))
            if not 0 < size <= MAX_BODY or self.headers.get_content_type() != "application/json":
                raise InputError("Send a small JSON calculation request.")
            payload = json.loads(self.rfile.read(size))
            if not isinstance(payload, dict):
                raise InputError("Submit a city and date.")
            result = action(payload)
        except InputError as error:
            self.respond(400, {"error": str(error)})
        except (ValueError, RecursionError):
            self.respond(400, {"error": "The calculation request was invalid."})
        except (ArithmeticError, RuntimeError):
            self.respond(422, {"error": "The calculation could not return a supported result."})
        else:
            self.respond(200, result)


class HostedCalendar(CalendarHTTP, BaseHTTPRequestHandler):
    """Vercel supplies the request through its file-based Python handler."""

    endpoint = ""

    def do_POST(self):
        host = self.headers.get("Host")
        self.calculate(self.endpoint, {f"https://{host}"} if host else set())

    def method_not_allowed(self):
        self.respond(405, {"error": "Use POST to run a calculation."}, allow="POST")

    do_GET = do_HEAD = do_OPTIONS = do_PUT = do_DELETE = do_PATCH = method_not_allowed
