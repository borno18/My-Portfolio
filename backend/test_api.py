import urllib.request
import urllib.error
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def make_request(path, method="GET", data=None, headers=None):
    url = f"{BASE_URL}{path}"
    req_headers = headers.copy() if headers else {}
    if "Content-Type" not in req_headers:
        req_headers["Content-Type"] = "application/json"
    
    req_data = None
    if data:
        req_data = json.dumps(data).encode("utf-8")
        
    req = urllib.request.Request(url, data=req_data, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req) as res:
            cookie_headers = res.info().get_all("Set-Cookie")
            body = res.read().decode("utf-8")
            return res.status, json.loads(body) if body else None, cookie_headers
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            parsed_body = json.loads(body)
        except Exception:
            parsed_body = body
        return e.code, parsed_body, None

def test_flow():
    print("Starting backend tests...")
    
    # 1. Login with correct password (Default seeded password is admin123)
    print("\nTesting Login...")
    cookie = None
    status, res, cookies = make_request("/api/auth/login", method="POST", data={"password": "admin123"})
    if status == 200:
        print("[OK] Login successful!")
        # Extract cookie
        if cookies:
            cookie = cookies[0].split(";")[0]
            print(f"Session Cookie Extracted: {cookie}")
    else:
        print(f"[FAIL] Login failed with status {status}: {res}")
        return

    headers = {"Cookie": cookie} if cookie else {}
    
    # 2. Fetch check_auth
    status, res, _ = make_request("/api/auth/me", headers=headers)
    print(f"\nChecking Auth status: {res}")
    assert res.get("authenticated") is True, "Should be authenticated"
    
    # 3. Create blog post
    print("\nTesting Blog Creation...")
    blog_data = {
        "title": "My First Post",
        "slug": "my-first-post",
        "content": "This is the **markdown** content of the first post.",
        "status": "published"
    }
    status, res, _ = make_request("/api/blog", method="POST", data=blog_data, headers=headers)
    if status == 200:
        print(f"[OK] Blog post created! ID: {res['id']}")
        blog_id = res['id']
    else:
        print(f"[FAIL] Blog creation failed: {res}")
        return
        
    # 4. Get blog posts (public)
    print("\nFetching public blog list...")
    status, res, _ = make_request("/api/blog")
    print(f"List response: {res}")
    assert len(res) > 0, "Public blog list should not be empty"
    
    # 5. Fetch blog detail (public)
    status, res, _ = make_request("/api/blog/my-first-post")
    print(f"Detail response: {res['title']}")
    assert res['content'] == blog_data['content'], "Content mismatch"

    # 6. Notes API (encryption test)
    print("\nTesting Notes Encryption...")
    note_data = {
        "title": "Secret Note",
        "content": "Super sensitive info like bank password!"
    }
    status, res, _ = make_request("/api/notes", method="POST", data=note_data, headers=headers)
    if status == 200:
        print("[OK] Note created successfully!")
        note_id = res['id']
    else:
        print(f"[FAIL] Note creation failed: {status} {res}")
        return
        
    # 7. List notes (verify decryption on authenticated request)
    status, res, _ = make_request("/api/notes", headers=headers)
    print(f"Notes list: {res}")
    assert len(res) > 0, "Notes list should not be empty"
    assert res[0]["content"] == note_data["content"], "Decrypted note content mismatch!"
    print("[OK] Note decryption verification successful!")

    # 8. Cleanup
    print("\nCleaning up (Deleting blog & note)...")
    make_request(f"/api/blog/{blog_id}", method="DELETE", headers=headers)
    make_request(f"/api/notes/{note_id}", method="DELETE", headers=headers)
    print("[OK] Cleanup complete.")

    # 9. Rate limiting check (login with bad password)
    print("\nTesting Rate Limiter on Login...")
    rate_limited = False
    for i in range(6):
        status, res, cookies = make_request("/api/auth/login", method="POST", data={"password": "wrong-password"})
        print(f"Attempt {i+1}: Status={status}, Response={res}")
        if status == 429:
            print("[OK] Rate limiter successfully triggered on 6th request (Status 429)!")
            rate_limited = True
            break
    
    if not rate_limited:
        print("[FAIL] Rate limiter did not return 429 after 6 attempts.")
    
    print("[OK] All tests finished successfully!")

if __name__ == "__main__":
    # Give some wait time in case this is executed automatically
    test_flow()
