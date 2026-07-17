#!/usr/bin/env python3
"""
Inspect the page structure to understand what elements are available
"""

import asyncio
from playwright.async_api import async_playwright

async def inspect_page():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()
        
        await page.goto('http://localhost:6080', wait_until='networkidle')
        
        # Get all input fields
        inputs = await page.query_selector_all('input')
        print(f"Found {len(inputs)} input fields:")
        for i, inp in enumerate(inputs):
            input_type = await inp.get_attribute('type') or 'text'
            input_name = await inp.get_attribute('name') or 'no-name'
            input_id = await inp.get_attribute('id') or 'no-id'
            input_placeholder = await inp.get_attribute('placeholder') or 'no-placeholder'
            print(f"  {i+1}. type={input_type}, name={input_name}, id={input_id}, placeholder={input_placeholder}")
        
        # Get all buttons
        buttons = await page.query_selector_all('button, input[type="submit"], input[type="button"]')
        print(f"\nFound {len(buttons)} buttons:")
        for i, btn in enumerate(buttons):
            btn_type = await btn.get_attribute('type') or 'button'
            btn_text = await btn.text_content() or 'no-text'
            btn_class = await btn.get_attribute('class') or 'no-class'
            print(f"  {i+1}. type={btn_type}, text='{btn_text[:50]}', class={btn_class}")
        
        # Get all forms
        forms = await page.query_selector_all('form')
        print(f"\nFound {len(forms)} forms:")
        for i, form in enumerate(forms):
            form_id = await form.get_attribute('id') or 'no-id'
            form_action = await form.get_attribute('action') or 'no-action'
            print(f"  {i+1}. id={form_id}, action={form_action}")
        
        # Get page title and headings
        title = await page.title()
        print(f"\nPage title: {title}")
        
        headings = await page.query_selector_all('h1, h2, h3, h4, h5, h6')
        print(f"\nFound {len(headings)} headings:")
        for i, h in enumerate(headings):
            tag = await h.evaluate('el => el.tagName')
            text = await h.text_content()
            print(f"  {i+1}. {tag}: '{text[:100]}'")
        
        # Get any error/alert elements
        error_selectors = ['.error', '.alert', '.toast', '[role="alert"]', '.MuiAlert-root', '.ant-alert', '.text-red', '.text-error']
        for selector in error_selectors:
            elements = await page.query_selector_all(selector)
            if elements:
                print(f"\nFound {len(elements)} elements with selector '{selector}':")
                for i, elem in enumerate(elements):
                    text = await elem.text_content()
                    print(f"  {i+1}: '{text[:200]}'")
        
        # Get the page HTML structure
        print("\n=== Page HTML structure (simplified) ===")
        body = await page.query_selector('body')
        if body:
            # Get first few levels of DOM
            html_preview = await page.evaluate('''
                () => {
                    function getElementInfo(el, depth = 0) {
                        if (depth > 3) return ''; // Limit depth
                        
                        const tag = el.tagName.toLowerCase();
                        const id = el.id ? `#${el.id}` : '';
                        const classes = el.className ? `.${el.className.split(' ').join('.')}` : '';
                        const hasChildren = el.children.length > 0;
                        
                        let result = '  '.repeat(depth) + tag + id + classes;
                        
                        // Add text content if it's a leaf node with text
                        if (!hasChildren && el.textContent && el.textContent.trim()) {
                            const text = el.textContent.trim().substring(0, 50);
                            result += ` - "${text}"`;
                        }
                        
                        result += '\\n';
                        
                        // Recursively process children
                        for (let i = 0; i < Math.min(el.children.length, 5); i++) { // Limit to 5 children
                            result += getElementInfo(el.children[i], depth + 1);
                        }
                        
                        return result;
                    }
                    
                    return getElementInfo(document.body);
                }
            ''')
            print(html_preview)
        
        # Keep browser open for manual inspection
        print("\nBrowser will remain open for manual inspection for 120 seconds...")
        await asyncio.sleep(120)
        await browser.close()

if __name__ == '__main__':
    asyncio.run(inspect_page())