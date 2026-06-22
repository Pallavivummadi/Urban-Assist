const { By, until, Key } = require("selenium-webdriver");

async function runProfileTest(driver, testState) {
  console.log("Starting Appium Profile & Settings Test...");
  const pkg = "com.example.myapplication:id";
  const updatedName = "Appium Updated User";

  // 1. Open Navigation Drawer in Dashboard
  console.log("Opening navigation drawer...");
  const menuButton = await driver.wait(
    until.elementLocated(By.id(`${pkg}/menuButton`)),
    10000
  );
  await menuButton.click();

  // 2. Click on Settings menu item in the navigation drawer
  console.log("Navigating to Settings screen...");
  // In NavigationView, menu item text might be "Settings" or resource id is nav_settings
  // W3C syntax: locate the element with resource-id nav_settings
  const settingsMenuItem = await driver.wait(
    until.elementLocated(By.id(`com.example.myapplication:id/nav_settings`)),
    10000
  );
  await settingsMenuItem.click();

  // 3. Edit Name Field
  console.log("Editing Profile Name...");
  const nameInput = await driver.wait(
    until.elementLocated(By.id(`${pkg}/nameInput`)),
    10000
  );
  await nameInput.clear();
  await nameInput.sendKeys(updatedName);

  // 4. Save Changes
  console.log("Clicking Save Changes...");
  const saveBtn = await driver.findElement(By.id(`${pkg}/saveChangesButton`));
  await saveBtn.click();

  // Wait for name label update
  console.log("Verifying profile name update...");
  await driver.wait(
    until.elementLocated(By.xpath(`//android.widget.TextView[@text='${updatedName}']`)),
    5000
  );
  console.log("Profile name successfully updated!");

  // 5. Sign Out
  console.log("Signing out of the application...");
  const signOutBtn = await driver.findElement(By.id(`${pkg}/signOutButton`));
  await signOutBtn.click();

  // Redirect back to LoginActivity
  console.log("Verifying redirection back to LoginActivity...");
  await driver.wait(until.elementLocated(By.id(`${pkg}/loginButton`)), 10000);
  console.log("Sign out successful!");
}

module.exports = { runProfileTest };
