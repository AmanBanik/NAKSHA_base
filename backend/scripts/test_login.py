import requests
import json

try:
    res = requests.post("http://127.0.0.1:8000/api/auth/login", json={"username": "bengal_clerk", "password": "password123"})
    print("STATUS:", res.status_code)
    print("RESPONSE:", res.text)
except Exception as e:
    print("ERROR:", e)
