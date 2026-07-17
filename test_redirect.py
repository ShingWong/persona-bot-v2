#!/usr/bin/env python3
"""
Test redirect after login
"""

import time
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    context = browser.new_context()
    page = context.new_page()
    
    # Capture console logs
    def on_console(msg):
        print(f"Console {msg.type}: {msg.text}")
    
    page.on("console", on_console)
    
    print("1. Going to login page...")
    page.goto("http://localhost:6080/auth/login")
    time.sleep(2)
    
    print("\n2. Filling login form...")
    page.fill('input[type="email"], input[name="email"]', "admin@personabot.com")
    page.fill('input[type="password"], input[name="password"]', "Admin123!")
    
    print("3. Clicking submit...")
    page.click('button[type="submit"]')
    
    print("\n4. Waiting for redirect...")
    
    # Wait up to 10 seconds for redirect
    for i in range(10):
        current_url = page.url
        print(f"   {i}s: URL = {current_url}")
        
        if "/dashboard" in current_url:
            print("   ✓ Redirected to dashboard!")
            break
        
        time.sleep(1)
    
    if "/dashboard" not in page.url:
        print("   ✗ Not redirected to dashboard")
        
        # Check for errors
        errors = page.locator('.error, .alert, [class*="error"]')
        print(f"\nError elements: {errors.count()}")
        for i in range(errors.count()):
            error = errors.nth(i)
            text = error.text_content()
            if text:
                print(f"  Error {i}: {text}")
    
    print(f"\n5. Final URL: {page.url}")
    print("   Keeping browser open for inspection...")
    time.sleep(30)
    
    browser.close()