import os
import re

FRONTEND_DIR = r"C:\Devfield\SIH\base_18\naksha-portal\src"

def replace_api_urls():
    for root, _, files in os.walk(FRONTEND_DIR):
        for file in files:
            if file.endswith(".tsx") or file.endswith(".ts"):
                filepath = os.path.join(root, file)
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()

                # Replace exact string matches
                # First handle template literals: `http://127.0.0.1:8000/api...`
                content = content.replace("`http://127.0.0.1:8000", "`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}")
                
                # Then handle standard string quotes: 'http://127.0.0.1:8000/api...'
                # We need to change these to template literals.
                pattern = r"['\"]http://127\.0\.0\.1:8000([^'\"]*)['\"]"
                replacement = r"`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}\1`"
                content = re.sub(pattern, replacement, content)

                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(content)
                    
    print("API URLs refactored to support Cloud Environment Variables!")

if __name__ == "__main__":
    replace_api_urls()
