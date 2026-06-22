const { By, until } = require("selenium-webdriver");

async function runTasksTest(driver, testState) {
  console.log("Starting Appium Tasks Test...");
  const pkg = "com.example.myapplication:id";
  const taskTitle = `Appium Task ${Date.now()}`;
  testState.createdTaskTitle = taskTitle;

  // 1. Navigate to Tasks from Dashboard
  console.log("Navigating to Tasks screen...");
  const myTasksAction = await driver.wait(
    until.elementLocated(By.id(`${pkg}/myTasksAction`)),
    10000
  );
  await myTasksAction.click();

  // 2. Add a new Task
  console.log(`Adding task: ${taskTitle}`);
  await driver.wait(until.elementLocated(By.id(`${pkg}/taskInput`)), 5000);
  await driver.findElement(By.id(`${pkg}/taskInput`)).sendKeys(taskTitle);
  
  const addTaskButton = await driver.findElement(By.id(`${pkg}/addTaskButton`));
  await addTaskButton.click();

  // 3. Verify task is added (it should appear as a checkbox in the list)
  console.log("Verifying task in list...");
  const taskCheckbox = await driver.wait(
    until.elementLocated(By.xpath(`//android.widget.CheckBox[@text='${taskTitle}']`)),
    10000
  );
  if (!taskCheckbox) throw new Error("Task not found in pending list");

  // 4. Toggle Task (complete it)
  console.log("Toggling task status to completed...");
  await taskCheckbox.click();

  // Verification: click again to move back to pending, etc.
  console.log("Waiting for database update...");
  await driver.sleep(2000);

  // 5. Navigate back to Dashboard
  console.log("Navigating back to Dashboard...");
  // Use device back button to go back to DashboardActivity
  await driver.navigate().back();
  console.log("Returned to Dashboard!");
}

module.exports = { runTasksTest };
