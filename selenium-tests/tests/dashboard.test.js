const { By, until } = require("selenium-webdriver");

async function runDashboardTest(driver, baseUrl) {
  console.log("Starting Dashboard Test...");
  await driver.get(`${baseUrl}/dashboard`);
  
  // Wait for the welcome heading (contains "👋")
  const welcomeHeading = await driver.wait(
    until.elementLocated(By.xpath("//h1[contains(text(), '👋')]")),
    15000
  );
  const headingText = await welcomeHeading.getText();
  console.log(`Found welcome heading: ${headingText}`);

  // Verify that the overview quick stats cards are visible
  const statsContainer = await driver.wait(
    until.elementLocated(By.xpath("//div[contains(@class, 'grid') and contains(@class, 'sm:grid-cols-2')]")),
    10000
  );
  
  // Verify specific labels in the stat cards
  const tasksTodayCard = await driver.findElement(By.xpath("//span[text()='Tasks today']"));
  const completedCard = await driver.findElement(By.xpath("//span[text()='Completed']"));
  console.log("Found stat cards for 'Tasks today' and 'Completed'.");

  // Verify Quick Access Links
  const quickAccessHeading = await driver.findElement(By.xpath("//h2[text()='Quick access']"));
  const tasksLink = await driver.findElement(By.xpath("//h3[text()='Plan tasks']"));
  const weatherLink = await driver.findElement(By.xpath("//h3[text()='Weather forecast']"));
  console.log("Found Quick access cards and links.");

  // Verify Recent Activity Section
  const activityHeading = await driver.findElement(By.xpath("//h2[text()='Recent activity']"));
  console.log("Found Recent Activity section.");
}

module.exports = { runDashboardTest };
