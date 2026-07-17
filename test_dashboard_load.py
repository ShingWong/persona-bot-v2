#!/usr/bin/env python3
"""
Test dashboard loading after login
"""

import time
import requests
from playwright.sync_api import sync_playwright

def test_dashboard():
    print("Testing dashboard loading after login...")
    
    # Clear localStorage first by opening a private window
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()
        
        print("1. Navigating to homepage...")
        page.goto("http://localhost:6080")
        page.wait_for_load_state("networkidle")
        time.sleep(2)
        
        # Check if we see Sign In button (not logged in)
        sign_in_buttons = page.locator('text=Sign In')
        if sign_in_buttons.count() > 0:
            print("   ✓ Not logged in (shows Sign In button)")
        else:
            print("   ✗ Unexpected: No Sign In button")
        
        print("\n2. Navigating to login page...")
        page.goto("http://localhost:6080/auth/login")
        page.wait_for_load_state("networkidle")
        time.sleep(2)
        
        # Check for login form
        email_input = page.locator('input[type="email"], input[name="email"]')
        password_input = page.locator('input[type="password"], input[name="password"]')
        
        if email_input.count() > 0 and password_input.count() > 0:
            print("   ✓ Found login form")
            
            print("   Filling credentials...")
            email_input.fill("admin@personabot.com")
            password_input.fill("Admin123!")
            
            submit_button = page.locator('button[type="submit"]')
            if submit_button.count() > 0:
                print("   Submitting login...")
                submit_button.click()
                
                # Wait for login to complete
                time.sleep(3)
                page.wait_for_load_state("networkidle")
                
                # Check for success
                current_url = page.url
                print(f"   Current URL: {current_url}")
                
                if "/dashboard" in current_url:
                    print("   ✓ Redirected to dashboard after login")
                else:
                    print("   ✗ Not redirected to dashboard")
                
                # Check for user info
                user_elements = page.locator('text:has-text("admin@personabot.com"), text:has-text("Signed in as")')
                if user_elements.count() > 0:
                    print("   ✓ User info displayed")
                else:
                    print("   ✗ User info not found")
                
                # Check for dashboard content
                dashboard_elements = page.locator('text*=Dashboard, h1, h2')
                found_elements = []
                for i in range(min(dashboard_elements.count(), 5)):
                    text = dashboard_elements.nth(i).text_content()
                    if text:
                        found_elements.append(text[:50])
                
                if found_elements:
                    print(f"   Found dashboard elements: {found_elements}")
                else:
                    print("   ✗ No dashboard content found")
                
                # Monitor for 30 seconds to see if page goes black or has errors
                print("\n3. Monitoring page for 30 seconds (as reported by user)...")
                error_count = 0
                for i in range(30):
                    # Check for error messages
                    errors = page.locator('.error, .alert-error, .text-red, [class*="error"]')
                    if errors.count() > 0:
                        error_count += 1
                        for j in range(errors.count()):
                            error_text = errors.nth(j).text_content()
                            if error_text and len(error_text.strip()) > 0:
                                print(f"   {i}s: Error: {error_text.strip()[:100]}")
                    
                    # Check page visibility
                    if page.is_closed():
                        print(f"   {i}s: Page closed unexpectedly!")
                        break
                    
                    # Take screenshot every 10 seconds
                    if i in [0, 10, 20, 29]:
                        page.screenshot(path=f"/tmp/dashboard_{i}s.png", full_page=True)
                        print(f"   {i}s: Screenshot saved to /tmp/dashboard_{i}s.png")
                    
                    time.sleep(1)
                
                print(f"\n4. Test complete. Error count: {error_count}")
                if error_count == 0:
                    print("   ✓ No errors detected during monitoring")
                else:
                    print(f"   ⚠ {error_count} errors detected")
                
            else:
                print("   ✗ No submit button found")
        else:
            print("   ✗ Login form not found")
        
        print("\n5. Final check: Testing dashboard API directly...")
        # Get token from localStorage
        storage = context.storage_state()
        access_token = None
        for origin in storage.get('origins', []):
            if 'localhost:6080' in origin.get('origin', ''):
                for item in origin.get('localStorage', []):
                    if item.get('name') == 'accessToken':
                        access_token = item.get('value')
                        break
        
        if access_token:
            print(f"   Got access token from localStorage: {len(access_token)} chars")
            
            # Test dashboard API
            try:
                headers = {"Authorization": f"Bearer {access_token}"}
                response = requests.get("http://localhost:6081/api/conversations", headers=headers, timeout=5)
                print(f"   /api/conversations status: {response.status_code}")
                if response.status_code == 200:
                    print("   ✓ Dashboard API works!")
                else:
                    print(f"   ✗ Dashboard API error: {response.text[:200]}")
            except Exception as e:
                print(f"   ✗ Error testing dashboard API: {e}")
        else:
            print("   ✗ No access token found in localStorage")
        
        # Keep browser open for manual inspection
        print("\nBrowser will remain open for manual inspection for 60 seconds...")
        print("Press Ctrl+C in terminal to exit.")
        time.sleep(60)
        
        browser.close()
    
    print("\nTest complete!")

if __name__ == "__main__":
    test_dashboard()