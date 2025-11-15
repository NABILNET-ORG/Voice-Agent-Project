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
        # -> Click on 'Business Settings' button to navigate to settings page.
        frame = context.pages[-1]
        # Click 'Business Settings' button to go to settings
        elem = frame.locator('xpath=html/body/div[2]/div/div[2]/div/div[2]/div/ul/li[4]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on 'Integrations' link in the sidebar to go to Integrations page.
        frame = context.pages[-1]
        # Click 'Integrations' link in sidebar
        elem = frame.locator('xpath=html/body/div[2]/div/div[2]/div/div[2]/div/ul/li[4]/div/ul/li[3]/a').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Input email and password, then click Sign In button to authenticate.
        frame = context.pages[-1]
        # Input email for login
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div/div/div[2]/div[2]/form/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('saeeeel@gmail.com')
        

        frame = context.pages[-1]
        # Input password for login
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div/div/div[2]/div[2]/form/div[2]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('M@ma2009')
        

        frame = context.pages[-1]
        # Click Sign In button to submit login form
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div/div/div[2]/div[2]/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click each category tab (AI Models, Calendar, Payment, Communication, Analytics) one by one and verify that the cards filter correctly.
        frame = context.pages[-1]
        # Click 'AI Models' category tab to filter cards
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div[3]/div[2]/div/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click the 'Configure' button on the Google Gemini card to open its configuration dialog and verify it opens correctly.
        frame = context.pages[-1]
        # Click 'Configure' button on Google Gemini AI Models card
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div[4]/div[2]/div[2]/div[2]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Close the Google Gemini configuration dialog and click the 'Calendar' category tab to test filtering of calendar integrations.
        frame = context.pages[-1]
        # Click 'Close' button to close Google Gemini configuration dialog
        elem = frame.locator('xpath=html/body/div[4]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Verify that only calendar integration cards are visible and click on one to open its configuration dialog.
        frame = context.pages[-1]
        # Click 'Calendar' category tab to filter calendar integration cards
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div[3]/div[2]/div/button[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click the 'Configure' button on the Google Calendar card to open its configuration dialog and verify it opens correctly.
        frame = context.pages[-1]
        # Click 'Configure' button on Google Calendar card
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div[4]/div/div[2]/div[2]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Close the Google Calendar configuration dialog and click the 'Payment' category tab to test filtering of payment integrations.
        frame = context.pages[-1]
        # Click 'Close' button to close Google Calendar configuration dialog
        elem = frame.locator('xpath=html/body/div[4]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Verify that only payment integration cards are visible and click on one to open its configuration dialog.
        frame = context.pages[-1]
        # Click 'Payment' category tab to filter payment integration cards
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div[3]/div[2]/div/button[4]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click the 'Connect' button on the Stripe card to open its configuration dialog and verify it opens correctly.
        frame = context.pages[-1]
        # Click 'Connect' button on Stripe payment integration card
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div[4]/div/div[2]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Close the Stripe configuration dialog and click the 'Communication' category tab to test filtering of communication integrations.
        frame = context.pages[-1]
        # Click 'Close' button to close Stripe configuration dialog
        elem = frame.locator('xpath=html/body/div[4]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Verify that only communication integration cards are visible and click on one to open its configuration dialog.
        frame = context.pages[-1]
        # Click 'Communication' category tab to filter communication integration cards
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div[3]/div[2]/div/button[5]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click the 'Configure' button on the Twilio communication card to open its configuration dialog and verify it opens correctly.
        frame = context.pages[-1]
        # Click 'Configure' button on Twilio communication integration card
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div[4]/div/div[2]/div[3]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=All Integrations').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=AI Models').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Calendar').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Payment').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Communication').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Analytics').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Other').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Voice calls and SMS notifications').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Connected').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Connected:').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Pending').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Configure').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Connect').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Account SID').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Phone Number').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Voice Webhook URL').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    