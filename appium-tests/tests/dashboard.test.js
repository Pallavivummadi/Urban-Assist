const { By, until } = require("selenium-webdriver");

async function runDashboardTest(driver, testState) {
  console.log("Starting Appium Dashboard Test...");
  const pkg = "com.example.myapplication:id";

  // 1. Verify greeting message loads correctly
  console.log("Verifying greeting message...");
  const greetingText = await driver.wait(
    until.elementLocated(By.id(`${pkg}/greetingText`)),
    10000
  );
  const text = await greetingText.getText();
  console.log(`Greeting message found: "${text}"`);
  if (!text.startsWith("Hello,")) {
    throw new Error(`Greeting text mismatch: expected 'Hello,...', got '${text}'`);
  }

  // 2. Verify dashboard quick action buttons exist and are displayed
  console.log("Verifying action items...");
  const actions = [
    "transportAction",
    "payBillsAction",
    "foodAction",
    "weatherAction",
    "myTasksAction",
    "hospitalAction",
    "govServicesAction",
    "emergencyAction"
  ];

  for (const act of actions) {
    const el = await driver.findElement(By.id(`${pkg}/${act}`));
    const isDisplayed = await el.isDisplayed();
    if (!isDisplayed) {
      throw new Error(`Action item ${act} is not displayed on Dashboard`);
    }
  }

  console.log("Dashboard verification complete!");
}

module.exports = { runDashboardTest };
