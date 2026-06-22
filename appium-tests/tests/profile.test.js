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
  let settingsMenuItem;
  try {
    settingsMenuItem = await driver.wait(
      until.elementLocated(By.id(`com.example.myapplication:id/nav_settings`)),
      3000
    );
  } catch (err) {
    console.log("Clicking menu button didn't open drawer. Trying dragGesture on drawerLayout...");
    try {
      await driver.executeScript("mobile: dragGesture", {
        startX: 5,
        startY: 800,
        endX: 800,
        endY: 800,
        speed: 1000
      });
      await driver.sleep(1000);
    } catch (swipeErr) {
      console.log("dragGesture failed: " + swipeErr.message);
    }
    settingsMenuItem = await driver.wait(
      until.elementLocated(By.id(`com.example.myapplication:id/nav_settings`)),
      10000
    );
  }
  await settingsMenuItem.click();

  // 3. Edit Name Field
  console.log("Editing Profile Name...");
  const nameInput = await driver.wait(
    until.elementLocated(By.id(`${pkg}/nameInput`)),
    10000
  );
  await nameInput.clear();
  await nameInput.sendKeys(updatedName);

  // Hide keyboard to ensure subsequent buttons are visible/clickable
  try {
    await driver.executeScript("mobile: hideKeyboard");
    console.log("Hidden keyboard.");
  } catch (e) {}

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
  
  // Scroll down to make signOutButton visible
  try {
    const scrollView = await driver.findElement(By.xpath("//android.widget.ScrollView"));
    const scrollId = await scrollView.getId();
    await driver.executeScript("mobile: scrollGesture", {
      elementId: scrollId,
      direction: "down",
      percent: 1.0,
      speed: 1000
    });
    await driver.sleep(1000);
    console.log("Scrolled down to locate signOutButton.");
  } catch (e) {
    console.log("Scroll down failed: " + e.message);
  }

  const signOutBtn = await driver.wait(
    until.elementLocated(By.id(`${pkg}/signOutButton`)),
    10000
  );
  await signOutBtn.click();

  // Redirect back to LoginActivity
  console.log("Verifying redirection back to LoginActivity...");
  await driver.wait(until.elementLocated(By.id(`${pkg}/loginButton`)), 10000);
  console.log("Sign out successful!");
}

module.exports = { runProfileTest };
