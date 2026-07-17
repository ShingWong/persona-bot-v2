#!/usr/bin/env python3
"""
Debug the login and dashboard loading issue
"""

import asyncio
from playwright.async_api import async_playwright
import time

async def debug_login():
    print("=== Debugging Login/Dashboard Issue ===")
    
    async with async_playwright() as p:
        # Launch browser in non-headless so we can see what's happening
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 800}
        )
        
        page = await context.new_page()
        
        # Capture console logs
        def log_console(msg):
            print(f"[CONSOLE {msg.type}] {msg.text}")
            if msg.type == 'error':
                try:
                    print(f"  Location: {msg.location}")
                except:
                    pass
        
        page.on("console", log_console)
        
        # Capture page errors
        def log_page_error(error):
            print(f"[PAGE ERROR] {error}")
        
        page.on("pageerror", log_page_error)
        
        # Capture failed requests
        def log_failed_request(request):
            if request.failure:
                print(f"[FAILED REQUEST] {request.url}: {request.failure}")
        
        page.on("requestfailed", log_failed_request)
        
        # Capture responses
        def log_response(response):
            if response.status >= 400:
                print(f"[ERROR RESPONSE] {response.status} {response.url}")
                try:
                    # Try to get response text for API errors
                    if '/api/' in response.url:
                        print(f"  Response: {response.text()}")
                except:
                    pass
        
        page.on("response", log_response)
        
        try:
            print("\n1. Going to login page...")
            await page.goto('http://localhost:6080/auth/login', wait_until='networkidle')
            await page.screenshot(path='/tmp/1_login_page.png')
            print("   Screenshot: /tmp/1_login_page.png")
            
            # Fill login form
            print("\n2. Filling login form...")
            await page.fill('#email', 'admin@personabot.com')
            await page.fill('#password', 'Admin123!')
            await page.screenshot(path='/tmp/2_filled_form.png')
            print("   Screenshot: /tmp/2_filled_form.png")
            
            # Submit form
            print("\n3. Submitting form...")
            await page.click('button[type="submit"]')
            
            # Wait for navigation
            print("   Waiting for navigation...")
            await page.wait_for_timeout(2000)
            
            # Check if we're redirected
            current_url = page.url
            print(f"   Current URL: {current_url}")
            
            # Take screenshot after submit
            await page.screenshot(path='/tmp/3_after_submit.png')
            print("   Screenshot: /tmp/3_after_submit.png")
            
            # Wait for dashboard to load (or fail)
            print("\n4. Waiting for dashboard to load (or observing failure)...")
            
            # Monitor for 35 seconds as reported
            for i in range(7):  # 7 * 5 = 35 seconds
                await page.wait_for_timeout(5000)
                print(f"\n   {i*5 + 5}s elapsed:")
                
                # Check page state
                current_url = page.url
                print(f"     URL: {current_url}")
                
                # Check for error messages
                error_selectors = [
                    '.error', '.alert', '.toast', '[role="alert"]', 
                    '.text-red', '.text-error', '.bg-destructive',
                    'div[class*="error"]', 'div[class*="Error"]',
                    'div[class*="alert"]', 'div[class*="Alert"]'
                ]
                
                for selector in error_selectors:
                    elements = await page.query_selector_all(selector)
                    if elements:
                        for elem in elements:
                            text = await elem.text_content()
                            if text and len(text.strip()) > 0:
                                print(f"     Error element ({selector}): {text[:100]}")
                
                # Check for loading indicators
                loading_selectors = [
                    '.loading', '.spinner', '[aria-busy="true"]',
                    'div[class*="loading"]', 'div[class*="Loading"]',
                    'div[class*="spinner"]', 'div[class*="Spinner"]'
                ]
                
                for selector in loading_selectors:
                    elements = await page.query_selector_all(selector)
                    if elements:
                        print(f"     Loading indicator found: {selector}")
                
                # Check if page is blank/black
                body = await page.query_selector('body')
                if body:
                    # Check background color
                    bg_color = await body.evaluate('el => window.getComputedStyle(el).backgroundColor')
                    if bg_color in ['rgba(0, 0, 0, 0)', 'rgb(0, 0, 0)', 'black']:
                        print(f"     WARNING: Body background is {bg_color}")
                    
                    # Check if body has content
                    body_text = await body.text_content()
                    if not body_text or body_text.strip() == '':
                        print("     WARNING: Body appears empty")
                    else:
                        # Count visible elements
                        visible_elements = await body.evaluate('''
                            () => {
                                const elements = document.body.querySelectorAll('*');
                                let visibleCount = 0;
                                elements.forEach(el => {
                                    const style = window.getComputedStyle(el);
                                    if (style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null) {
                                        visibleCount++;
                                    }
                                });
                                return visibleCount;
                            }
                        ''')
                        print(f"     Visible elements on page: {visible_elements}")
                
                # Take screenshot
                await page.screenshot(path=f'/tmp/4_wait_{i*5 + 5}s.png')
                print(f"     Screenshot: /tmp/4_wait_{i*5 + 5}s.png")
            
            print("\n5. Final checks...")
            
            # Check for React hydration errors
            hydration_issue = await page.evaluate('''
                () => {
                    // Check for Next.js hydration warnings
                    const scripts = document.querySelectorAll('script');
                    for (const script of scripts) {
                        if (script.textContent && script.textContent.includes('hydration')) {
                            return 'Hydration warning in script';
                        }
                    }
                    
                    // Check for React error boundaries
                    const errorBoundaries = document.querySelectorAll('[data-react-error-boundary]');
                    if (errorBoundaries.length > 0) {
                        return 'React error boundary active';
                    }
                    
                    return null;
                }
            ''')
            
            if hydration_issue:
                print(f"   {hydration_issue}")
            
            # Check localStorage for auth tokens
            auth_data = await page.evaluate('''
                () => {
                    const items = {};
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key.includes('auth') || key.includes('token') || key.includes('user')) {
                            items[key] = localStorage.getItem(key);
                        }
                    }
                    return items;
                }
            ''')
            
            if auth_data:
                print("   LocalStorage auth data:")
                for key, value in auth_data.items():
                    print(f"     {key}: {value[:50]}..." if len(str(value)) > 50 else f"     {key}: {value}")
            else:
                print("   No auth data in localStorage")
            
            # Check cookies
            cookies = await context.cookies()
            auth_cookies = [c for c in cookies if 'auth' in c['name'].lower() or 'token' in c['name'].lower()]
            if auth_cookies:
                print("   Auth cookies found")
            else:
                print("   No auth cookies found")
            
            print("\n=== Debug Complete ===")
            print("Check the screenshots in /tmp/ to see what happened at each stage.")
            
        except Exception as e:
            print(f"\nERROR: {e}")
            import traceback
            traceback.print_exc()
        
        finally:
            print("\nBrowser will remain open for manual inspection for 30 seconds...")
            await asyncio.sleep(30)
            await browser.close()

if __name__ == '__main__':
    asyncio.run(debug_login())