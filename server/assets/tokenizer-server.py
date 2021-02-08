import json
import sys
from transformers import GPT2TokenizerFast
from http.server import BaseHTTPRequestHandler, HTTPServer

tokenizer = GPT2TokenizerFast.from_pretrained("gpt2")

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write("Tokenizer server working!".encode("utf-8"))

    def do_POST(self):
        if self.headers.get("Content-Type") != "application/json":
            self.send_response(400)
            self.end_headers()
            return

        try:
            length = int(self.headers.get("Content-Length"))
        except ValueError:
            self.send_response(400)
            self.end_headers()
            return

        data = json.loads(self.rfile.read(length))

        try:
            message = data["message"]
        except KeyError:
            self.send_response(400)
            self.end_headers()
            return

        tokens = len(tokenizer.encode(message))

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"tokens": tokens}).encode("utf-8"))

if len(sys.argv) > 1:
    try:
        port = int(sys.argv[1])
        server = HTTPServer(("127.0.0.1", port), Handler)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            server.server_close()
    except ValueError:
        print("Please specify port")
else:
    print("Please specify port")