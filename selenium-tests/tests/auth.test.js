const { By, until } = require("selenium-webdriver");

async function runAuthTest(driver, baseUrl, testState) {
  console.log("Starting Authentication Test...");
  const uniqueEmail = `test_${Date.now()}@example.com`;
  const password = "UrbanAssistSecurePass2026!#$";
  const name = "Test User";
  testState.email = uniqueEmail;
  testState.password = password;

  // 1. Sign Up Flow
  console.log(`Attempting Signup with: ${uniqueEmail}`);
  await driver.get(`${baseUrl}/auth`);
  
  // Wait for the Sign in page to load
  await driver.wait(until.elementLocated(By.id("email")), 10000);
  
  // Switch to Signup Tab
  const signupTab = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(text(), 'Sign up') or @value='signup']")),
    5000
  );
  await signupTab.click();
  
  // Wait for Name field to appear
  await driver.wait(until.elementLocated(By.id("name")), 5000);
  
  // Fill form
  await driver.findElement(By.id("name")).sendKeys(name);
  await driver.findElement(By.id("email")).sendKeys(uniqueEmail);
  await driver.findElement(By.id("password")).sendKeys(password);
  
  // Click Create Account
  const submitButton = await driver.findElement(By.css("button[type='submit']"));
  await submitButton.click();
  
  // Wait for transition to dashboard
  await driver.wait(until.urlContains("/dashboard"), 15000);
  console.log("Signup successful, reached dashboard!");

  // 2. Sign Out Flow
  console.log("Attempting Sign out...");
  const signoutBtn = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(text(), 'Sign out')]")),
    10000
  );
  await signoutBtn.click();
  
  // Wait for transition back to auth page
  await driver.wait(until.urlContains("/auth"), 10000);
  console.log("Sign out successful, returned to /auth page!");

  // 3. Sign In Flow
  console.log(`Attempting Signin with: ${uniqueEmail}`);
  await driver.get(`${baseUrl}/auth`);
  await driver.wait(until.elementLocated(By.id("email")), 10000);
  
  // Make sure we are on signin mode
  const signinTab = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(text(), 'Sign in') or @value='signin']")),
    5000
  );
  await signinTab.click();
  
  await driver.findElement(By.id("email")).sendKeys(uniqueEmail);
  await driver.findElement(By.id("password")).sendKeys(password);
  
  const signinSubmit = await driver.findElement(By.css("button[type='submit']"));
  await signinSubmit.click();
  
  await driver.wait(until.urlContains("/dashboard"), 15000);
  console.log("Signin successful, reached dashboard again!");
}

module.exports = { runAuthTest };
