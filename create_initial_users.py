import urllib.request
import json
import time

BASE_URL = "http://localhost:8080"

def create_user(email, password, full_name, role, phone):
    url = f"{BASE_URL}/auth/signup"
    data = {
        "email": email,
        "password": password,
        "full_name": full_name,
        "role": role,
        "phone_number": phone
    }
    
    req = urllib.request.Request(
        url, 
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            print(f"Success: Created {role} user '{email}'")
    except urllib.error.HTTPError as e:
        print(f"Error creating {email}: {e.read().decode()}")
    except Exception as e:
        print(f"Failed to connect: {e}")

if __name__ == "__main__":
    print("Waiting for server to be ready...")
    # Simple retry logic
    for i in range(10):
        try:
            urllib.request.urlopen(BASE_URL)
            break
        except:
            time.sleep(2)
            print(".", end="", flush=True)
    print("\nCreating initial users...")
    
    # Admin
    create_user("admin@waste.com", "admin123", "System Admin", "admin", "1111111111")
    # Worker
    create_user("worker@waste.com", "worker123", "Field Worker", "worker", "2222222222")
    # User
    create_user("user@waste.com", "user123", "Regular User", "user", "3333333333")
    print("\nDone! You can now login with these credentials.")
