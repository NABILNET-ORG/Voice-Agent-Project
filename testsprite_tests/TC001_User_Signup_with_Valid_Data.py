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
        # -> Navigate to the signup page by finding and clicking the signup or account creation link or button.
        frame = context.pages[-1]
        # Click on the 'Account' button to find signup or login options
        elem = frame.locator('xpath=html/body/div[2]/div/div[2]/div/div[2]/div/ul/li[6]/a/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click the 'Sign up' link to navigate to the signup page.
        frame = context.pages[-1]
        # Click the 'Sign up' link to go to the signup page
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div/div/div[2]/div[3]/p/a').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Fill in the signup form with valid Full Name, Business Name, Email, Password, and Confirm Password, then submit the form.
        frame = context.pages[-1]
        # Input Full Name
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div/div/div[2]/div[2]/form/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Saeeel User')
        

        frame = context.pages[-1]
        # Input Business Name
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div/div/div[2]/div[2]/form/div[2]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill("Saeeel's Business")
        

        frame = context.pages[-1]
        # Input Email
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div/div/div[2]/div[2]/form/div[3]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('saeeeel@gmail.com')
        

        frame = context.pages[-1]
        # Input Password
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div/div/div[2]/div[2]/form/div[4]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('M@ma2009')
        

        frame = context.pages[-1]
        # Input Confirm Password
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div/div/div[2]/div[2]/form/div[5]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('M@ma2009')
        

        frame = context.pages[-1]
        # Click Create Account button to submit the signup form
        elem = frame.locator('xpath=html/body/div[2]/main/main/div/div/div/div[2]/div[2]/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Input the new user's email and password, then click the Sign In button to verify login and redirection to dashboard or welcome screen.
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
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=Manage your appointments and reservations').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=New Booking').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=List View').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Calendar View').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Export CSV').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Today\'s Bookings').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=0').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Total Revenue').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=$0.00').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=No bookings found').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    