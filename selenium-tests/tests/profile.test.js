const { By, until, Key } = require("selenium-webdriver");

async function runProfileTest(driver, baseUrl) {
  console.log("Starting Profile Test...");
  await driver.get(`${baseUrl}/profile`);
  
  // Wait for Profile heading
  await driver.wait(until.elementLocated(By.xpath("//h1[text()='Profile']")), 10000);
  console.log("Profile page loaded.");

  // Locators
  const nameInput = await driver.findElement(By.css("input[placeholder='Your name']"));
  const cityInput = await driver.findElement(By.css("input[placeholder='e.g. Bengaluru']"));
  const phoneInput = await driver.findElement(By.css("input[placeholder='Optional']"));
  const saveBtn = await driver.findElement(By.xpath("//button[contains(text(), 'Save changes')]"));

  // Form input helper
  async function clearAndType(element, text) {
    await element.sendKeys(Key.CONTROL, "a");
    await element.sendKeys(Key.BACK_SPACE);
    await element.sendKeys(text);
  }

  // Edit fields
  const testName = `Selenium User ${Date.now().toString().slice(-4)}`;
  const testCity = "Automated City";
  const testPhone = "+919876543210";

  console.log(`Setting Profile Info - Name: ${testName}, City: ${testCity}, Phone: ${testPhone}`);
  await clearAndType(nameInput, testName);
  await clearAndType(cityInput, testCity);
  await clearAndType(phoneInput, testPhone);

  // Click Save
  await saveBtn.click();
  
  // Wait for button to be enabled again (or page to finish saving)
  await driver.sleep(2000); 

  // Reload page to verify persistence
  console.log("Refreshing page to verify changes persisted...");
  await driver.navigate().refresh();
  await driver.wait(until.elementLocated(By.xpath("//h1[text()='Profile']")), 10000);

  // Fetch inputs again
  const nameInputNew = await driver.findElement(By.css("input[placeholder='Your name']"));
  const cityInputNew = await driver.findElement(By.css("input[placeholder='e.g. Bengaluru']"));
  const phoneInputNew = await driver.findElement(By.css("input[placeholder='Optional']"));

  const valName = await nameInputNew.getAttribute("value");
  const valCity = await cityInputNew.getAttribute("value");
  const valPhone = await phoneInputNew.getAttribute("value");

  if (valName === testName && valCity === testCity && valPhone === testPhone) {
    console.log("Profile changes successfully verified!");
  } else {
    throw new Error(
      `Profile verification failed. Expected: Name: ${testName}, City: ${testCity}, Phone: ${testPhone}. Got: Name: ${valName}, City: ${valCity}, Phone: ${valPhone}`
    );
  }
}

module.exports = { runProfileTest };
