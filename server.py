"""
FinanzasPro - Servidor Alternativo en Python
Sin librerías externas - Ejecuta con python server.py
"""
import http.server
import socketserver
import socket
import os
import json

PORT = 3000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "localhost"

local_ip = get_local_ip()

class FinanzasHTTPHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        if self.path == '/api/info':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            data = {
                'localUrl': f'http://localhost:{PORT}',
                'lanUrl': f'http://{local_ip}:{PORT}',
                'ip': local_ip,
                'port': PORT
            }
            self.wfile.write(json.dumps(data).encode('utf-8'))
            return
        
        return super().do_GET()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

if __name__ == '__main__':
    with socketserver.TCPServer(("0.0.0.0", PORT), FinanzasHTTPHandler) as httpd:
        print("\n======================================================")
        print("   🚀 FinanzasPro (Python) - Servidor Iniciado")
        print("======================================================")
        print(f"\n💻 En Microsoft Windows: http://localhost:{PORT}")
        print(f"📱 En Android: http://{local_ip}:{PORT}")
        print("======================================================\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor detenido.")
