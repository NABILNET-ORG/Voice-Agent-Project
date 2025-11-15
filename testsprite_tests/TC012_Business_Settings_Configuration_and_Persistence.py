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
        # -> Click on 'Account' to log in as business owner
        frame = context.pages[-1]
        # Click on 'Account' button to start login process
        elem = frame.locator('xpath=html/body/div[2]/div/div[2]/div/div[2]/div/ul/li[6]/a/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Input email and password, then click Sign In button
        frame = context.pages[-1]
        # Input email for login
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div/div/div[2]/div[2]/form/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('saeeeel@gmail.com')
        

        frame = context.pages[-1]
        # Input password for login
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div/div/div[2]/div[2]/form/div[2]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('M@ma2009')
        

        frame = context.pages[-1]
        # Click Sign In button to log in as business owner
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div/div/div[2]/div[2]/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on 'Business Settings' button in the sidebar to navigate to business settings page
        frame = context.pages[-1]
        # Click on 'Business Settings' button in sidebar
        elem = frame.locator('xpath=html/body/div[2]/div/div[2]/div/div[2]/div/ul/li[4]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on 'Business Info' tab under Business Settings to update business details
        frame = context.pages[-1]
        # Click on 'Business Info' tab under Business Settings
        elem = frame.locator('xpath=html/body/div[2]/div/div[2]/div/div[2]/div/ul/li[4]/div/ul/li/a').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Update business name, phone number, and address fields with new values
        frame = context.pages[-1]
        # Update business name field
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div[2]/div[2]/div/div[2]/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Updated Business Name')
        

        frame = context.pages[-1]
        # Update phone number field
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div[2]/div[2]/div/div[2]/div/div[3]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('+1 987-654-3210')
        

        frame = context.pages[-1]
        # Update address field
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div[2]/div[2]/div/div[2]/div/div[4]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('456 New Address, New City, State')
        

        # -> Click on 'Availability & Scheduling' tab to update operation hours
        frame = context.pages[-1]
        # Click on 'Availability & Scheduling' tab to update operation hours
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div[2]/div/button[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on 'Services/Products' tab to update service offerings and pricing
        frame = context.pages[-1]
        # Click on 'Services/Products' tab to update service offerings and pricing
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div[2]/div/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Update price and description of existing service 'Test Service'
        frame = context.pages[-1]
        # Click on existing service to edit pricing and description
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div[2]/div[3]/div/div[2]/div/div/div/div/div/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Add a new service with name, category, price, duration, buffer time, and description, then save changes
        frame = context.pages[-1]
        # Input new service name
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div[2]/div[3]/div/div[2]/div[3]/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('New Test Service')
        

        frame = context.pages[-1]
        # Input new service category
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div[2]/div[3]/div/div[2]/div[3]/div/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Test Category')
        

        frame = context.pages[-1]
        # Input new service price
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div[2]/div[3]/div/div[2]/div[3]/div/div[3]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('100')
        

        # -> Complete service description, toggle 'Requires Calendar Slot', add the new service, and save all settings
        frame = context.pages[-1]
        # Input new service description
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div[2]/div[3]/div/div[2]/div[3]/div[2]/textarea').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('This is a test service description.')
        

        frame = context.pages[-1]
        # Toggle 'Requires Calendar Slot' on
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div[2]/div[3]/div/div[2]/div[3]/div[3]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        frame = context.pages[-1]
        # Click 'Add Service' button to add the new service
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div[2]/div[3]/div/div[2]/div[3]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click 'Save All Settings' button to save changes
        frame = context.pages[-1]
        # Click 'Save All Settings' button to save all changes
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div/div[2]/button[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Reload the page to verify that all changes to business details, hours, and services persist
        await page.goto('http://localhost:3000/settings', timeout=10000)
        await asyncio.sleep(3)
        

        # -> Verify operation hours and services persistence by navigating to Availability & Scheduling and Services tabs
        frame = context.pages[-1]
        # Click on 'Availability & Scheduling' tab to verify operation hours persistence
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div[2]/div/button[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on 'Services/Products' tab to verify persistence of service pricing and details
        frame = context.pages[-1]
        # Click on 'Services/Products' tab to verify service pricing and details persistence
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div[2]/div/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=Configure your AI business assistant').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Save All Settings').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=New Test Service').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=$100').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=60 minutes').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=This is a test service description.').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    