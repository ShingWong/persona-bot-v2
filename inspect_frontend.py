#!/usr/bin/env python3
"""
Inspect frontend page structure and API calls
"""

import time
from playwright.sync_api import sync_playwright

def inspect_frontend():
    print("Inspecting frontend page structure...")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(
            viewport={'width': 1280, 'height': 800}
        )
        
        page = context.new_page()
        
        # Capture all console logs
        def on_console(msg):
            print(f"Console {msg.type}: {msg.text}")
            if msg.type == 'error':
                # Try to get location
                location = msg.location
                print(f"  Location: {location}")
        
        page.on("console", on_console)
        
        # Capture all network responses
        def on_response(response):
            url = response.url
            status = response.status
            if status >= 400:
                print(f"\n⚠️  Error response {status}: {url}")
                try:
                    # Try to get response text for API errors
                    if "api" in url:
                        text = response.text()
                        print(f"  Response: {text[:500]}")
                except:
                    pass
            elif "api" in url:
                print(f"\n✅ API call {status}: {url}")
        
        page.on("response", on_response)
        
        print("Navigating to http://localhost:6080...")
        page.goto("http://localhost:6080")
        
        # Wait for page to load
        page.wait_for_load_state("networkidle")
        time.sleep(3)
        
        print("\n=== Page Analysis ===")
        print(f"URL: {page.url}")
        print(f"Title: {page.title()}")
        
        # Check for authentication state
        print("\n=== Checking for auth elements ===")
        
        # Look for login/logout buttons
        login_buttons = page.locator('button:has-text("Login"), button:has-text("Sign In"), a:has-text("Login"), a:has-text("Sign In")')
        logout_buttons = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout"), a:has-text("Sign Out")')
        
        print(f"Login buttons found: {login_buttons.count()}")
        print(f"Logout buttons found: {logout_buttons.count()}")
        
        # Check for user info
        user_elements = page.locator('[class*="user"], [class*="User"], .avatar, .profile')
        print(f"User elements found: {user_elements.count()}")
        
        # Check for error messages
        error_elements = page.locator('.error, .alert, .toast, .notification, [class*="error"], [class*="Error"]')
        print(f"Error elements found: {error_elements.count()}")
        for i in range(error_elements.count()):
            error = error_elements.nth(i)
            text = error.text_content()
            if text and len(text.strip()) > 0:
                print(f"  Error {i}: {text.strip()[:200]}")
        
        # Check for loading indicators
        loading_elements = page.locator('.loading, .spinner, .progress, [class*="loading"], [class*="Loading"]')
        print(f"Loading elements found: {loading_elements.count()}")
        
        # Get all text content to understand page structure
        print("\n=== Page Content Summary ===")
        all_text = page.locator('body').text_content()
        if all_text:
            lines = [line.strip() for line in all_text.split('\n') if line.strip()]
            print(f"Total non-empty lines: {len(lines)}")
            print("First 20 lines:")
            for i, line in enumerate(lines[:20]):
                print(f"  {i}: {line[:100]}")
        
        # Check localStorage for auth tokens
        print("\n=== Checking localStorage ===")
        try:
            storage = context.storage_state()
            if 'origins' in storage:
                for origin in storage['origins']:
                    if 'localhost:6080' in origin['origin']:
                        print(f"LocalStorage for {origin['origin']}:")
                        for item in origin.get('localStorage', []):
                            if 'token' in item['name'].lower() or 'auth' in item['name'].lower():
                                print(f"  {item['name']}: {item['value'][:50]}...")
        except Exception as e:
            print(f"Error checking storage: {e}")
        
        # Take screenshot
        page.screenshot(path="/tmp/frontend_inspect.png", full_page=True)
        print("\nScreenshot saved to /tmp/frontend_inspect.png")
        
        # Try to trigger login if not logged in
        if login_buttons.count() > 0:
            print("\n=== Attempting login ===")
            login_buttons.first.click()
            time.sleep(2)
            
            # Check for login form
            email_input = page.locator('input[type="email"], input[name="email"]')
            password_input = page.locator('input[type="password"], input[name="password"]')
            
            if email_input.count() > 0 and password_input.count() > 0:
                print("Found login form, filling credentials...")
                email_input.fill("admin@personabot.com")
                password_input.fill("Admin123!")
                
                submit_button = page.locator('button[type="submit"]')
                if submit_button.count() > 0:
                    print("Submitting login form...")
                    submit_button.click()
                    
                    # Wait for response
                    time.sleep(5)
                    page.wait_for_load_state("networkidle")
                    
                    # Check for errors after login attempt
                    error_elements = page.locator('.error, .alert, [class*="error"]')
                    print(f"Errors after login attempt: {error_elements.count()}")
        
        print("\n=== Waiting 30 seconds to observe behavior ===")
        for i in range(30):
            # Check for any new errors
            current_errors = page.locator('.error, .alert, [class*="error"]')
            if current_errors.count() > 0:
                for j in range(current_errors.count()):
                    error = current_errors.nth(j)
                    text = error.text_content()
                    if text and len(text.strip()) > 0:
                        print(f"  {i}s - Error: {text.strip()[:200]}")
            
            # Check page visibility
            if page.is_closed():
                print(f"  {i}s - Page closed!")
                break
                
            time.sleep(1)
        
        print("\nInspection complete.")
        browser.close()

if __name__ == "__main__":
    inspect_frontend()