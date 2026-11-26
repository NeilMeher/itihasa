import importlib.util
import json
import threading
import unittest
from http.client import HTTPConnection
from http.server import ThreadingHTTPServer
from pathlib import Path

from calendar_engine import birth_sky, calendar

ROOT = Path(__file__).resolve().parents[1]
HOST = "itihasa-test.vercel.app"
DATE = {"city": "delhi", "date": "2025-01-01"}
BIRTH = {**DATE, "time": "08:00"}


class CalendarHTTPTest(unittest.TestCase):
    def request(self, name, body, *, method="POST", origin=f"https://{HOST}", content_type="application/json"):
        spec = importlib.util.spec_from_file_location(name, ROOT / "api/v1" / (name + ".py"))
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        with ThreadingHTTPServer(("127.0.0.1", 0), module.handler) as server:
            thread = threading.Thread(target=server.serve_forever, kwargs={"poll_interval": 0.05})
            thread.start()
            connection = HTTPConnection("127.0.0.1", server.server_port, timeout=5)
            try:
                connection.request(method, f"/api/v1/{name}", body, {
                    "Host": HOST, "Origin": origin, "Content-Type": content_type,
                })
                reply = connection.getresponse()
                return reply.status, reply.getheader("Cache-Control"), reply.getheader("Allow"), json.loads(reply.read())
            finally:
                connection.close()
                server.shutdown()
                thread.join()

    def test_adapters_match_the_local_engine(self):
        for name, form, calculator in (("panchang", DATE, calendar), ("birth-sky", BIRTH, birth_sky)):
            with self.subTest(endpoint=name):
                status, cache, _, result = self.request(name, json.dumps(form))
                self.assertEqual((status, cache), (200, "no-store"))
                self.assertEqual(result, json.loads(json.dumps(calculator(form))))

    def test_post_rejects_unsupported_malformed_and_large_payloads(self):
        for body in (json.dumps({**DATE, "date": "2028-01-01"}), "{", "[]", " " * 4097):
            with self.subTest(size=len(body)):
                status, cache, _, result = self.request("panchang", body)
                self.assertEqual((status, cache), (400, "no-store"))
                self.assertIsInstance(result.get("error"), str)

    def test_origin_and_method(self):
        status, cache, _, result = self.request("birth-sky", json.dumps(BIRTH), origin="https://unrelated.example")
        self.assertEqual((status, cache), (403, "no-store"))
        self.assertNotIn(BIRTH["time"], result["error"])
        self.assertEqual(self.request("birth-sky", None, method="GET")[:3], (405, "no-store", "POST"))


if __name__ == "__main__":
    unittest.main()
