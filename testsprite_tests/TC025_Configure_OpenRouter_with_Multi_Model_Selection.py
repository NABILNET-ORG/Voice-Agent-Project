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
        # -> Click OpenRouter card to open configuration dialog.
        frame = context.pages[-1]
        # Click Business Settings to find OpenRouter configuration
        elem = frame.locator('xpath=html/body/div[2]/div/div[2]/div/div[2]/div/ul/li[4]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click Integrations link to check if OpenRouter card is under Integrations.
        frame = context.pages[-1]
        # Click Integrations link under Business Settings to find OpenRouter card
        elem = frame.locator('xpath=html/body/div[2]/div/div[2]/div/div[2]/div/ul/li[4]/div/ul/li[3]/a').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Input email and password, then click Sign In to authenticate.
        frame = context.pages[-1]
        # Input email for login
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div/div/div[2]/div[2]/form/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('saeeeel@gmail.com')
        

        frame = context.pages[-1]
        # Input password for login
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div/div/div[2]/div[2]/form/div[2]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('M@ma2009')
        

        frame = context.pages[-1]
        # Click Sign In button to authenticate
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div/div/div[2]/div[2]/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click Configure button on OpenRouter card to open configuration dialog.
        frame = context.pages[-1]
        # Click Configure button on OpenRouter card
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div[4]/div[4]/div[2]/div[2]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Close the Google Calendar configuration dialog and carefully click Configure button on OpenRouter card.
        frame = context.pages[-1]
        # Close Google Calendar configuration dialog
        elem = frame.locator('xpath=html/body/div[4]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Manually check and interact with the OpenRouter configuration dialog to confirm presence of API key input, model dropdown with provider/model format, and custom model input.
        await page.mouse.wheel(0, 300)
        

        # -> Click Connect button on OpenRouter card to initiate connection and possibly reveal API key input and model selection options.
        frame = context.pages[-1]
        # Click Connect button on OpenRouter card to start configuration
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div[4]/div[3]/div[2]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Input a test API key, select a specific model from the dropdown, toggle features, select 'Custom Model...' and input a custom provider/model, then save configuration.
        frame = context.pages[-1]
        # Input test API key in OpenRouter API Key field
        elem = frame.locator('xpath=html/body/div[4]/div[2]/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('test-openrouter-api-key-123')
        

        frame = context.pages[-1]
        # Open model dropdown to select a specific model
        elem = frame.locator('xpath=html/body/div[4]/div[2]/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select 'Custom Model...' option from the model dropdown and input a custom provider/model string, then toggle features and save configuration.
        frame = context.pages[-1]
        # Select 'Custom Model...' option from model dropdown
        elem = frame.locator('xpath=html/body/div[5]/div/div/div[6]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click Close button to close configuration modal and verify if OpenRouter card status updates to Connected on integrations page.
        frame = context.pages[-1]
        # Click Close button to close OpenRouter configuration modal
        elem = frame.locator('xpath=html/body/div[4]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=Access multiple AI models through a unified API').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Connected').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Configure').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Disconnect').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=API key').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=openai/gpt-4o').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=anthropic/claude-3.5-sonnet').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Custom Model...').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Feature assignment').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    