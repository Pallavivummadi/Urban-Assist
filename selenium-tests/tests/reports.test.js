const { By, until } = require("selenium-webdriver");

async function runReportsTest(driver, baseUrl) {
  console.log("Starting Reports & Analytics Test...");
  await driver.get(`${baseUrl}/reports`);
  
  // Wait for page title to load
  await driver.wait(until.elementLocated(By.xpath("//h1[text()='Reports & Analytics']")), 10000);
  console.log("Reports & Analytics page loaded.");

  // Verify that the statistics section cards are loaded
  const totalTasksStat = await driver.findElement(By.xpath("//p[text()='Total tasks']"));
  const completedStat = await driver.findElement(By.xpath("//p[text()='Completed']"));
  const pendingStat = await driver.findElement(By.xpath("//p[text()='Pending']"));
  const rateStat = await driver.findElement(By.xpath("//p[text()='Completion rate']"));
  console.log("Verified stats indicators (Total, Completed, Pending, Rate).");

  // Verify that chart headers exist
  const last7DaysChartHeader = await driver.findElement(By.xpath("//h3[text()='Last 7 days']"));
  const byCategoryChartHeader = await driver.findElement(By.xpath("//h3[text()='By category']"));
  const monthlyPerfChartHeader = await driver.findElement(By.xpath("//h3[text()='Monthly performance']"));
  console.log("Verified chart headings exist.");

  // Verify Activity log section is present
  const activityLogHeader = await driver.findElement(By.xpath("//h3[text()='Activity log']"));
  console.log("Verified Activity log section is present.");
}

module.exports = { runReportsTest };
