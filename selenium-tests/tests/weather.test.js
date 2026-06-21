const { By, until } = require("selenium-webdriver");

async function runWeatherTest(driver, baseUrl) {
  console.log("Starting Weather Test...");
  await driver.get(`${baseUrl}/weather`);
  
  // Wait for Weather page heading
  await driver.wait(until.elementLocated(By.xpath("//h1[text()='Weather']")), 10000);
  console.log("Weather page heading loaded.");

  // Wait for loading to finish and for weather tiles to load (or default location weather info)
  // We can wait for "7-day forecast" section
  const forecastHeading = await driver.wait(
    until.elementLocated(By.xpath("//h2[text()='7-day forecast']")),
    20000
  );
  console.log("Weather forecast section loaded successfully!");

  // Verify Feels Like tile
  const feelsLikeTile = await driver.findElement(By.xpath("//div[contains(text(), 'Feels like')]"));
  console.log("Verified 'Feels like' weather tile exists.");

  // Verify wind speed tile
  const windTile = await driver.findElement(By.xpath("//div[contains(text(), 'Wind')]"));
  console.log("Verified 'Wind' speed weather tile exists.");

  // Verify at least one forecast day card exists
  const forecastDayCards = await driver.findElements(By.xpath("//div[contains(@class, 'glass') and contains(@class, 'rounded-xl')]/p[contains(@class, 'text-muted-foreground')]"));
  console.log(`Found ${forecastDayCards.length} forecast days cards.`);
  if (forecastDayCards.length === 0) {
    throw new Error("No forecast days found in the weather forecast section.");
  }
}

module.exports = { runWeatherTest };
