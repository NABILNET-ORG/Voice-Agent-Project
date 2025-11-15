import asyncio
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )
        
        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)
        
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:3000", wait_until="commit", timeout=10000)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Interact with the page elements to simulate user flow
        # -> Click Gemini card in AI Models tab
        frame = context.pages[-1]
        # Click Business Settings to access AI Models tab or related settings
        elem = frame.locator('xpath=html/body/div[2]/div/div[2]/div/div[2]/div/ul/li[4]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Try clicking 'Integrations' link to check if AI Models tab or Gemini card is accessible there
        frame = context.pages[-1]
        # Click 'Integrations' link to find AI Models tab or Gemini card
        elem = frame.locator('xpath=html/body/div[2]/div/div[2]/div/div[2]/div/ul/li[4]/div/ul/li[3]/a').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Input email and password, then click Sign In to authenticate
        frame = context.pages[-1]
        # Enter email for login
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div/div/div[2]/div[2]/form/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('saeeeel@gmail.com')
        

        frame = context.pages[-1]
        # Enter password for login
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div/div/div[2]/div[2]/form/div[2]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('M@ma2009')
        

        frame = context.pages[-1]
        # Click Sign In button to authenticate
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div/div/div[2]/div[2]/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click Configure button on Google Gemini card to open configuration dialog
        frame = context.pages[-1]
        # Click Configure button on Google Gemini card
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div[4]/div[2]/div[2]/div[2]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Open model dropdown to verify official Gemini models and select gemini-2.5-flash
        frame = context.pages[-1]
        # Click Default Model dropdown to open model options
        elem = frame.locator('xpath=html/body/div[4]/div[2]/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select 'Gemini 2.5 Flash (Fast)' from the model dropdown
        frame = context.pages[-1]
        # Select 'Gemini 2.5 Flash (Fast)' from the model dropdown
        elem = frame.locator('xpath=html/body/div[5]/div/div/div[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click Save Configuration button to save the Gemini settings
        frame = context.pages[-1]
        # Click Save Configuration button to save Gemini configuration
        elem = frame.locator('xpath=html/body/div[4]/div[2]/div[2]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click Configure button on Google Gemini card to reopen configuration dialog and verify saved settings
        frame = context.pages[-1]
        # Click Configure button on Google Gemini card to reopen configuration dialog
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div[4]/div[2]/div[2]/div[2]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Close the configuration dialog to finish the Gemini configuration test
        frame = context.pages[-1]
        # Click Close button to close the configuration dialog
        elem = frame.locator('xpath=html/body/div[4]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=Configure Google Gemini').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Gemini API Key').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=gemini-2.5-pro').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=gemini-2.5-flash').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=gemini-2.0-flash').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Feature assignment').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Knowledge Base Summarization').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Connected').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    