#!/usr/bin/env python3
"""
Test script to diagnose the frontend login/dashboard issue.
The user reports: "The menu flashes for 30 seconds or so with an error bubble showing on the bottom. 
30 seconds later, screen goes black."
"""

import asyncio
from playwright.async_api import async_playwright
import time
import sys

async def test_login_and_dashboard():
    """Test the login flow and dashboard loading"""
    print("Starting Playwright test for login/dashboard issue...")
    
    async with async_playwright() as p:
        # Launch browser in non-headless mode so we can see what's happening
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 800},
            # Capture console logs and network requests
            record_har_path={'path': '/tmp/login_test.har'}
        )
        
        # Capture console logs
        page = await context.new_page()
        
        # Listen to console messages
        def handle_console(msg):
            print(f"Console {msg.type}: {msg.text}")
            if msg.type == 'error':
                print(f"  Error details: {msg}")
        
        page.on("console", handle_console)
        
        # Listen to page errors
        def handle_page_error(error):
            print(f"Page error: {error}")
        
        page.on("pageerror", handle_page_error)
        
        # Listen to network requests
        def handle_request(request):
            print(f"Request: {request.method} {request.url}")
        
        def handle_response(response):
            if response.status >= 400:
                print(f"Error response: {response.status} {response.url}")
                try:
                    print(f"  Response body: {response.text()}")
                except:
                    pass
        
        page.on("request", handle_request)
        page.on("response", handle_response)
        
        try:
            print("\n1. Navigating to frontend (http://localhost:6080)...")
            await page.goto('http://localhost:6080', wait_until='networkidle')
            
            # Take initial screenshot
            await page.screenshot(path='/tmp/initial_page.png')
            print("   Initial page screenshot saved to /tmp/initial_page.png")
            
            # Check if we're on login page
            page_content = await page.content()
            if 'login' in page_content.lower() or 'sign in' in page_content.lower():
                print("   Detected login page")
                
                # Look for login form elements
                email_field = await page.query_selector('input[type="email"], input[name="email"], #email')
                password_field = await page.query_selector('input[type="password"], input[name="password"], #password')
                login_button = await page.query_selector('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")')
                
                if email_field and password_field and login_button:
                    print("   Found login form elements")
                    
                    # Fill in credentials
                    print("   Filling in admin credentials...")
                    await email_field.fill('admin@personabot.com')
                    await password_field.fill('Admin123!')
                    
                    # Click login button
                    print("   Clicking login button...")
                    await login_button.click()
                    
                    # Wait for navigation/loading
                    print("   Waiting for login to complete...")
                    await page.wait_for_timeout(3000)  # Initial wait
                    
                    # Wait for network to settle
                    try:
                        await page.wait_for_load_state('networkidle', timeout=10000)
                    except:
                        print("   Network didn't settle within 10 seconds, continuing...")
                    
                    # Take screenshot after login attempt
                    await page.screenshot(path='/tmp/after_login.png')
                    print("   After login screenshot saved to /tmp/after_login.png")
                    
                    # Check for error messages
                    error_elements = await page.query_selector_all('.error, .alert, .toast, [role="alert"], .MuiAlert-root, .ant-alert')
                    if error_elements:
                        print(f"   Found {len(error_elements)} error/alert elements")
                        for i, elem in enumerate(error_elements):
                            text = await elem.text_content()
                            print(f"   Error {i+1}: {text[:100]}...")
                    
                    # Check for loading indicators
                    loading_elements = await page.query_selector_all('.loading, .spinner, [aria-busy="true"], .MuiCircularProgress-root')
                    if loading_elements:
                        print(f"   Found {len(loading_elements)} loading indicators")
                    
                    # Wait longer to see if dashboard loads or goes black
                    print("   Waiting 35 seconds to observe the reported issue (menu flashes then black screen)...")
                    for i in range(7):  # 7 * 5 seconds = 35 seconds
                        await page.wait_for_timeout(5000)
                        # Take periodic screenshots
                        await page.screenshot(path=f'/tmp/wait_{i*5}s.png')
                        
                        # Check current page state
                        current_url = page.url
                        page_title = await page.title()
                        print(f"   At {i*5}s: URL={current_url}, Title={page_title}")
                        
                        # Check if page is blank/black
                        body = await page.query_selector('body')
                        if body:
                            body_bg = await body.evaluate('el => window.getComputedStyle(el).backgroundColor')
                            body_text = await body.text_content()
                            if not body_text or body_text.strip() == '':
                                print(f"   WARNING: Body appears empty at {i*5}s")
                            if body_bg == 'rgba(0, 0, 0, 0)' or body_bg == 'rgb(0, 0, 0)':
                                print(f"   WARNING: Body background is black/transparent at {i*5}s")
                    
                    # Final screenshot
                    await page.screenshot(path='/tmp/final_state.png')
                    print("   Final state screenshot saved to /tmp/final_state.png")
                    
                    # Get console logs from browser
                    print("\n2. Checking browser console logs...")
                    # Console logs are already being captured via event handler
                    
                    # Check for any React errors
                    react_error = await page.evaluate('''
                        () => {
                            // Check for React error boundaries
                            const errorBoundaries = document.querySelectorAll('[data-react-error-boundary]');
                            if (errorBoundaries.length > 0) {
                                return 'React error boundary detected';
                            }
                            
                            // Check for error in window
                            if (window.__REACT_ERROR__) {
                                return window.__REACT_ERROR__;
                            }
                            
                            return null;
                        }
                    ''')
                    
                    if react_error:
                        print(f"   React error detected: {react_error}")
                    
                    # Check for hydration errors (common in Next.js)
                    hydration_mismatch = await page.evaluate('''
                        () => {
                            // Look for hydration mismatch warnings
                            const scripts = document.querySelectorAll('script');
                            for (const script of scripts) {
                                if (script.textContent && script.textContent.includes('hydration')) {
                                    return 'Hydration issue detected in script';
                                }
                            }
                            return null;
                        }
                    ''')
                    
                    if hydration_mismatch:
                        print(f"   Hydration issue: {hydration_mismatch}")
                        
                else:
                    print("   ERROR: Could not find all login form elements")
                    print(f"     Email field: {email_field}")
                    print(f"     Password field: {password_field}")
                    print(f"     Login button: {login_button}")
            else:
                print("   Not on login page. Current page content preview:")
                print(page_content[:500])
                
        except Exception as e:
            print(f"ERROR during test: {e}")
            import traceback
            traceback.print_exc()
        
        finally:
            # Keep browser open for inspection
            print("\nTest completed. Browser will remain open for 60 seconds for manual inspection...")
            print("Press Ctrl+C to close browser early.")
            try:
                await asyncio.sleep(60)
            except asyncio.CancelledError:
                pass
            
            await browser.close()
            print("Browser closed.")

if __name__ == '__main__':
    asyncio.run(test_login_and_dashboard())