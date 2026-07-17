#!/usr/bin/env python3
"""
Simple debug of login issue
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
    
    # Capture network responses
    def on_response(response):
        url = response.url
        status = response.status
        if "api/auth/login" in url:
            print(f"\nLogin API response {status}:")
            try:
                print(f"  Body: {response.text()[:500]}")
            except:
                pass
    
    page.on("response", on_response)
    
    print("Going to login page...")
    page.goto("http://localhost:6080/auth/login")
    time.sleep(2)
    
    print("\nFilling form...")
    page.fill('input[type="email"], input[name="email"]', "admin@personabot.com")
    page.fill('input[type="password"], input[name="password"]', "Admin123!")
    
    print("Clicking submit...")
    page.click('button[type="submit"]')
    
    print("\nWaiting for response...")
    time.sleep(5)
    
    print(f"\nCurrent URL: {page.url}")
    print(f"Page title: {page.title()}")
    
    # Check for error messages
    errors = page.locator('.error, .alert, [class*="error"]')
    print(f"\nError elements found: {errors.count()}")
    for i in range(errors.count()):
        error = errors.nth(i)
        text = error.text_content()
        if text:
            print(f"  Error {i}: {text}")
    
    # Check localStorage
    storage = context.storage_state()
    print("\nLocalStorage:")
    for origin in storage.get('origins', []):
        if 'localhost:6080' in origin.get('origin', ''):
            for item in origin.get('localStorage', []):
                print(f"  {item.get('name')}: {item.get('value')[:50]}...")
    
    print("\nKeeping browser open for 30 seconds...")
    time.sleep(30)
    
    browser.close()