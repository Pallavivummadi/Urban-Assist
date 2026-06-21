const { By, until } = require("selenium-webdriver");

async function runSettingsTest(driver, baseUrl) {
  console.log("Starting Settings Test...");
  await driver.get(`${baseUrl}/settings`);
  
  // Wait for Settings page to load
  await driver.wait(until.elementLocated(By.xpath("//h1[text()='Settings']")), 10000);
  console.log("Settings page loaded.");

  // Locators
  const darkModeSwitch = await driver.findElement(
    By.xpath("//p[text()='Dark mode']/ancestor::div[contains(@class, 'flex') and contains(@class, 'justify-between')]/button[@role='switch']")
  );
  
  const notificationsSwitch = await driver.findElement(
    By.xpath("//p[text()='Notifications']/ancestor::div[contains(@class, 'flex') and contains(@class, 'justify-between')]/button[@role='switch']")
  );

  // 1. Test Dark Mode Theme Switch
  const initialDarkMode = await driver.executeScript("return document.documentElement.classList.contains('dark')");
  console.log(`Initial dark mode status: ${initialDarkMode}`);
  
  await darkModeSwitch.click();
  await driver.sleep(1000); // Wait for transition
  
  const updatedDarkMode = await driver.executeScript("return document.documentElement.classList.contains('dark')");
  console.log(`Updated dark mode status: ${updatedDarkMode}`);
  
  if (updatedDarkMode === initialDarkMode) {
    throw new Error("Dark mode toggle failed to change class on document element.");
  }
  console.log("Dark mode toggle verified!");

  // 2. Test Notifications Switch
  const initialNotificationsState = await notificationsSwitch.getAttribute("aria-checked");
  console.log(`Initial notifications switch checked state: ${initialNotificationsState}`);
  
  await notificationsSwitch.click();
  await driver.sleep(1000);
  
  const updatedNotificationsState = await notificationsSwitch.getAttribute("aria-checked");
  console.log(`Updated notifications switch checked state: ${updatedNotificationsState}`);
  
  if (updatedNotificationsState === initialNotificationsState) {
    throw new Error("Notifications switch failed to toggle checked state.");
  }
  console.log("Notifications switch toggle verified!");

  // 3. Test Language Selection
  const langTrigger = await driver.findElement(
    By.xpath("//p[text()='Language']/ancestor::div[contains(@class, 'flex') and contains(@class, 'justify-between')]//button")
  );
  await langTrigger.click();

  // Wait for Select options
  const hindiOption = await driver.wait(
    until.elementLocated(By.xpath("//span[text()='Hindi']/ancestor::div[@role='option']")),
    5000
  );
  await hindiOption.click();
  await driver.sleep(1000);

  const selectedText = await langTrigger.getText();
  console.log(`Selected language displayed on trigger: ${selectedText}`);
  if (!selectedText.includes("Hindi")) {
    throw new Error(`Failed to change language. Expected 'Hindi', got '${selectedText}'`);
  }
  console.log("Language select dropdown verified!");
}

module.exports = { runSettingsTest };
