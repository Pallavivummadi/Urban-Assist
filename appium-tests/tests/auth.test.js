const { By, until } = require("selenium-webdriver");

async function runAuthTest(driver, testState) {
  console.log("Starting Appium Authentication Test...");
  const uniqueEmail = `appium_${Date.now()}@example.com`;
  const password = "UrbanAssistSecurePass2026!#$";
  const name = "Appium User";
  testState.email = uniqueEmail;
  testState.password = password;

  const pkg = "com.example.myapplication:id";

  // 1. Sign Up Flow
  console.log(`Navigating to RegisterActivity...`);
  try {
    // Check if starting from LandingActivity
    const getStartedBtn = await driver.wait(
      until.elementLocated(By.id(`${pkg}/getStartedButton`)),
      5000
    );
    await getStartedBtn.click();
    console.log("Clicked getStartedButton on LandingActivity");
  } catch (e) {
    console.log("getStartedButton not found or not clickable on LandingActivity, trying registerTextView on LoginActivity...");
    const registerText = await driver.wait(
      until.elementLocated(By.id(`${pkg}/registerTextView`)),
      10000
    );
    await registerText.click();
  }

  console.log(`Filling Registration Form...`);
  await driver.wait(until.elementLocated(By.id(`${pkg}/nameEditText`)), 5000);
  await driver.findElement(By.id(`${pkg}/nameEditText`)).sendKeys(name);
  await driver.findElement(By.id(`${pkg}/emailEditText`)).sendKeys(uniqueEmail);
  await driver.findElement(By.id(`${pkg}/passwordEditText`)).sendKeys(password);

  console.log("Clicking Register Button...");
  const registerBtn = await driver.findElement(By.id(`${pkg}/registerButton`));
  await registerBtn.click();

  // Registration redirects back to LoginActivity
  console.log("Waiting for redirection back to LoginActivity...");
  await driver.wait(until.elementLocated(By.id(`${pkg}/loginButton`)), 15000);
  console.log("Registration successful!");

  // 2. Sign In Flow
  console.log(`Signing in with credentials: ${uniqueEmail}`);
  await driver.findElement(By.id(`${pkg}/emailEditText`)).sendKeys(uniqueEmail);
  await driver.findElement(By.id(`${pkg}/passwordEditText`)).sendKeys(password);

  const loginBtn = await driver.findElement(By.id(`${pkg}/loginButton`));
  await loginBtn.click();

  // Login redirects to LocationPermissionActivity (which asks for permission)
  console.log("Waiting for redirection to LocationPermissionActivity...");
  // Let's wait for the location permission button or next button
  // Let's inspect LocationPermissionActivity.kt to see what views it has.
}

module.exports = { runAuthTest };
