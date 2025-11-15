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
        # -> Navigate to Business Settings to configure AI or Google integrations with invalid or empty API keys.
        frame = context.pages[-1]
        # Click on Business Settings to access integration configuration
        elem = frame.locator('xpath=html/body/div[2]/div/div[2]/div/div[2]/div/ul/li[4]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on Integrations to configure AI or Google API keys with invalid or empty values.
        frame = context.pages[-1]
        # Click on Integrations to open API key configuration
        elem = frame.locator('xpath=html/body/div[2]/div/div[2]/div/div[2]/div/ul/li[4]/div/ul/li[3]/a').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Log in using provided credentials to access Integrations settings.
        frame = context.pages[-1]
        # Input email for login
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div/div/div[2]/div[2]/form/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('saeeeel@gmail.com')
        

        frame = context.pages[-1]
        # Input password for login
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div/div/div[2]/div[2]/form/div[2]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('M@ma2009')
        

        frame = context.pages[-1]
        # Click Sign In button to log in
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div/div/div[2]/div[2]/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click Configure on OpenAI integration to input invalid API key and test system response.
        frame = context.pages[-1]
        # Click Configure on OpenAI integration to edit API key
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div[4]/div/div[2]/div[3]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Clear the OpenAI API key input field and save configuration to test system behavior with empty API key.
        frame = context.pages[-1]
        # Clear the OpenAI API key input field to simulate missing key
        elem = frame.locator('xpath=html/body/div[4]/div[2]/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('')
        

        frame = context.pages[-1]
        # Click Save Configuration to save empty API key and trigger validation
        elem = frame.locator('xpath=html/body/div[4]/div[2]/div[2]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Navigate to Live Demo page to test AI voice agent interaction with empty OpenAI API key.
        frame = context.pages[-1]
        # Click Live Demo to test AI voice agent interaction
        elem = frame.locator('xpath=html/body/div[2]/div/div[2]/div/div[2]/div/ul/li/a/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click the phone button to initiate AI voice agent interaction and observe system behavior with empty API key.
        frame = context.pages[-1]
        # Click phone button to start AI voice agent interaction
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div[2]/div/div[2]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Navigate to Business Settings > Integrations to configure Google Calendar API key with invalid or empty value.
        frame = context.pages[-1]
        # Click Business Settings to access integration configuration
        elem = frame.locator('xpath=html/body/div[2]/div/div[2]/div/div[2]/div/ul/li[4]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        try:
            await expect(frame.locator('text=Successful API Key Configuration').first).to_be_visible(timeout=5000)
        except AssertionError:
            raise AssertionError("Test failed: The system did not handle missing or invalid AI or Google Calendar API keys correctly. Expected meaningful error messages and graceful failure handling, but 'Successful API Key Configuration' message was not found, indicating the test plan execution failed.")
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    