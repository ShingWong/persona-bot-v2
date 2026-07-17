#!/usr/bin/env python3
"""
Test script to investigate frontend login/dashboard loading issue.
The user reports: "The menu flashes for 30 seconds or so with an error bubble 
showing on the bottom. 30 seconds later, screen goes black."
"""

import time
import json
import requests
from playwright.sync_api import sync_playwright, TimeoutError

def test_backend_api():
    """Test backend API endpoints to ensure they're working"""
    print("Testing backend API endpoints...")
    
    # Test login endpoint
    login_url = "http://localhost:6081/api/auth/login"
    login_data = {
        "email": "admin@personabot.com",
        "password": "Admin123!"
    }
    
    try:
        response = requests.post(login_url, json=login_data, timeout=10)
        print(f"Login response status: {response.status_code}")
        if response.status_code == 200:
                    data = response.json()
                    access_token = data.get('access_token', '')
                    print(f"Login successful! Got access_token: {len(access_token)} chars")
                    user_data = data.get('user', {})
                    print(f"User: {user_data.get('email') if user_data else 'No user data'}")
                    return access_token
        else:
            print(f"Login failed: {response.text}")
    except Exception as e:
        print(f"Error testing login: {e}")
    
    return None

def test_frontend_login():
    """Test frontend login flow using Playwright"""
    print("\nTesting frontend login flow...")
    
    with sync_playwright() as p:
        # Launch browser in non-headless mode to see what's happening
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(
            viewport={'width': 1280, 'height': 800}
            # Note: record_har_path removed due to type issue
        )
        
        # Capture console logs
        page = context.new_page()
        
        # Listen for console messages
        def on_console(msg):
            print(f"Console {msg.type}: {msg.text}")
        
        page.on("console", on_console)
        
        # Listen for page errors
        def on_page_error(error):
            print(f"Page error: {error}")
        
        page.on("pageerror", on_page_error)
        
        # Listen for network requests
        def on_request(request):
            print(f"Request: {request.method} {request.url}")
        
        def on_response(response):
            if response.status >= 400:
                print(f"Response error: {response.status} {response.url}")
                try:
                    print(f"Response body: {response.text()}")
                except:
                    pass
        
        page.on("request", on_request)
        page.on("response", on_response)
        
        # Navigate to frontend
        print("Navigating to http://localhost:6080...")
        page.goto("http://localhost:6080")
        
        # Wait for page to load
        page.wait_for_load_state("networkidle")
        time.sleep(2)
        
        # Take initial screenshot
        page.screenshot(path="/tmp/frontend_initial.png", full_page=True)
        print("Initial screenshot saved to /tmp/frontend_initial.png")
        
        # Check if we're on login page
        login_form = page.locator('form')
        if login_form.count() > 0:
            print("Found login form")
            
            # Fill login form
            email_input = page.locator('input[type="email"], input[name="email"]')
            password_input = page.locator('input[type="password"], input[name="password"]')
            submit_button = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")')
            
            if email_input.count() > 0 and password_input.count() > 0:
                print("Filling login form...")
                email_input.fill("admin@personabot.com")
                password_input.fill("Admin123!")
                
                # Click submit
                if submit_button.count() > 0:
                    print("Clicking submit button...")
                    submit_button.click()
                    
                    # Wait for navigation/response
                    try:
                        page.wait_for_load_state("networkidle", timeout=30000)
                    except TimeoutError:
                        print("Timeout waiting for network idle after login")
                    
                    # Wait and observe
                    print("Observing page for 35 seconds (as reported by user)...")
                    for i in range(35):
                        print(f"  {i+1}s: Checking page state...")
                        
                        # Check for error messages
                        error_elements = page.locator('.error, .alert-error, .text-red, [class*="error"], [class*="Error"]')
                        if error_elements.count() > 0:
                            for j in range(error_elements.count()):
                                error_text = error_elements.nth(j).text_content()
                                print(f"    Found error: {error_text}")
                        
                        # Check for loading indicators
                        loading_elements = page.locator('.loading, .spinner, [class*="loading"], [class*="Loading"]')
                        if loading_elements.count() > 0:
                            print(f"    Found loading indicator(s)")
                        
                        time.sleep(1)
                        
                        # Take screenshot every 5 seconds
                        if (i + 1) % 5 == 0:
                            page.screenshot(path=f"/tmp/frontend_{i+1}s.png", full_page=True)
                            print(f"    Screenshot saved to /tmp/frontend_{i+1}s.png")
                    
                    # Final screenshot
                    page.screenshot(path="/tmp/frontend_final.png", full_page=True)
                    print("Final screenshot saved to /tmp/frontend_final.png")
                    
                    # Get page content for analysis
                    content = page.content()
                    with open("/tmp/frontend_content.html", "w") as f:
                        f.write(content)
                    print("Page content saved to /tmp/frontend_content.html")
                    
                else:
                    print("No submit button found")
            else:
                print("Email or password input not found")
        else:
            print("No login form found - might already be logged in or on different page")
            
            # Check current URL
            print(f"Current URL: {page.url}")
            
            # Check for dashboard elements
            dashboard_elements = page.locator('[class*="dashboard"], [class*="Dashboard"], h1, h2')
            for i in range(min(dashboard_elements.count(), 10)):
                text = dashboard_elements.nth(i).text_content()
                if text:
                    print(f"  Element {i}: {text[:100]}...")
                else:
                    print(f"  Element {i}: [No text content]")
        
        # Keep browser open for manual inspection
        print("\nBrowser will remain open for 60 seconds for manual inspection...")
        print("Press Ctrl+C in terminal to continue with analysis")
        time.sleep(60)
        
        browser.close()

def analyze_logs():
    """Analyze backend logs for errors"""
    print("\nAnalyzing backend logs...")
    
    try:
        with open("/tmp/backend.log", "r") as f:
            lines = f.readlines()[-50:]  # Last 50 lines
            print("Recent backend log entries:")
            for line in lines:
                if "error" in line.lower() or "fail" in line.lower() or "401" in line or "403" in line or "500" in line:
                    print(f"  {line.strip()}")
    except FileNotFoundError:
        print("Backend log file not found at /tmp/backend.log")
    
    try:
        with open("/tmp/backend3.log", "r") as f:
            lines = f.readlines()[-50:]  # Last 50 lines
            print("\nRecent backend3 log entries:")
            for line in lines:
                if "error" in line.lower() or "fail" in line.lower() or "401" in line or "403" in line or "500" in line:
                    print(f"  {line.strip()}")
    except FileNotFoundError:
        print("Backend3 log file not found at /tmp/backend3.log")

def main():
    print("=" * 80)
    print("Frontend Login/Dashboard Issue Investigation")
    print("=" * 80)
    
    # Test backend API first
    token = test_backend_api()
    
    if token:
        # Test additional API endpoints
        print("\nTesting dashboard API endpoint with token...")
        headers = {"Authorization": f"Bearer {token}"}
        
        try:
            # Test /api/auth/me endpoint
            me_response = requests.get("http://localhost:6081/api/auth/me", headers=headers, timeout=10)
            print(f"/api/auth/me status: {me_response.status_code}")
            if me_response.status_code == 200:
                print(f"User info: {me_response.json()}")
            else:
                print(f"Error: {me_response.text}")
            
            # Test dashboard data endpoint
            dashboard_response = requests.get("http://localhost:6081/api/dashboard", headers=headers, timeout=10)
            print(f"/api/dashboard status: {dashboard_response.status_code}")
            if dashboard_response.status_code == 200:
                print("Dashboard data retrieved successfully")
            else:
                print(f"Error: {dashboard_response.text}")
                
        except Exception as e:
            print(f"Error testing API endpoints: {e}")
    
    # Analyze logs
    analyze_logs()
    
    # Test frontend
    test_frontend_login()
    
    print("\n" + "=" * 80)
    print("Investigation complete. Check screenshots in /tmp/")
    print("=" * 80)

if __name__ == "__main__":
    main()