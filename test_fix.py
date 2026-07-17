#!/usr/bin/env python3
"""
Test script to verify the auth loop fix
"""

import time
import requests
from playwright.sync_api import sync_playwright

def test_auth_loop():
    print("Testing auth loop fix...")
    
    # First, clear any existing tokens
    print("1. Testing backend API directly...")
    login_url = "http://localhost:6081/api/auth/login"
    login_data = {
        "email": "admin@personabot.com",
        "password": "Admin123!"
    }
    
    try:
        response = requests.post(login_url, json=login_data, timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"   Login successful, got token: {len(data.get('access_token', ''))} chars")
        else:
            print(f"   Login failed: {response.status_code} {response.text}")
            return
    except Exception as e:
        print(f"   Error testing login: {e}")
        return
    
    print("\n2. Testing frontend login flow (should not cause infinite requests)...")
    
    request_count = 0
    def count_requests(request):
        nonlocal request_count
        if "/api/auth/me" in request.url:
            request_count += 1
            print(f"   Request #{request_count}: {request.url}")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        
        # Listen for requests
        page.on("request", count_requests)
        
        print("   Navigating to http://localhost:6080...")
        page.goto("http://localhost:6080")
        
        # Wait for initial load
        page.wait_for_load_state("networkidle")
        time.sleep(2)
        
        print(f"   Initial page load complete. Total /api/auth/me requests: {request_count}")
        
        # Try to login
        print("\n3. Attempting login via frontend...")
        
        # Find and click login link - use first one
        login_link = page.locator('a:has-text("Sign In")').first
        if login_link.count() > 0:
            print("   Clicking Sign In link...")
            login_link.click()
            page.wait_for_load_state("networkidle")
            time.sleep(2)
            
            # Fill login form
            email_input = page.locator('input[type="email"], input[name="email"]')
            password_input = page.locator('input[type="password"], input[name="password"]')
            
            if email_input.count() > 0 and password_input.count() > 0:
                print("   Filling login form...")
                email_input.fill("admin@personabot.com")
                password_input.fill("Admin123!")
                
                submit_button = page.locator('button[type="submit"]')
                if submit_button.count() > 0:
                    print("   Submitting form...")
                    submit_button.click()
                    
                    # Wait for login to complete
                    time.sleep(3)
                    page.wait_for_load_state("networkidle")
                    
                    print(f"   After login, total /api/auth/me requests: {request_count}")
                    
                    # Check if we're logged in
                    user_element = page.locator('text*=admin@personabot.com, text*=Signed in as')
                    if user_element.count() > 0:
                        print("   ✓ Login successful via frontend!")
                    else:
                        print("   ✗ Login may have failed - user not found on page")
                else:
                    print("   ✗ No submit button found")
            else:
                print("   ✗ Login form inputs not found")
        else:
            print("   ✗ Sign In link not found")
        
        # Monitor for 10 seconds to check for infinite requests
        print("\n4. Monitoring for 10 seconds to check for infinite loop...")
        initial_count = request_count
        for i in range(10):
            time.sleep(1)
            current_count = request_count
            new_requests = current_count - initial_count
            if new_requests > 0:
                print(f"   {i+1}s: {new_requests} new /api/auth/me requests (total: {current_count})")
                initial_count = current_count
        
        print(f"\n5. Final tally: {request_count} total /api/auth/me requests")
        
        if request_count <= 5:
            print("   ✓ PASS: No infinite loop detected!")
        elif request_count <= 20:
            print("   ⚠ WARNING: Moderate number of requests, but not infinite")
        else:
            print("   ✗ FAIL: Too many requests, infinite loop may still exist")
        
        browser.close()
    
    print("\nTest complete!")

if __name__ == "__main__":
    test_auth_loop()