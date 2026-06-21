const { By, until, Key } = require("selenium-webdriver");

async function runTasksTest(driver, baseUrl) {
  console.log("Starting Tasks Page Test...");
  await driver.get(`${baseUrl}/tasks`);
  
  // Wait for Tasks page heading
  await driver.wait(until.elementLocated(By.xpath("//h1[text()='Tasks']")), 10000);
  console.log("Tasks page loaded.");

  // 1. Create a New Task
  const newTaskBtn = await driver.findElement(By.xpath("//button[contains(text(), 'New task')]"));
  await newTaskBtn.click();
  
  // Wait for dialog title "New task"
  await driver.wait(until.elementLocated(By.xpath("//h2[text()='New task']")), 5000);
  
  // Enter Title
  const titleInput = await driver.findElement(By.css("input[placeholder='What do you need to do?']"));
  const taskTitle = `E2E Test Task ${Date.now()}`;
  await titleInput.sendKeys(taskTitle);
  
  // Enter Description
  const descInput = await driver.findElement(By.css("textarea[placeholder='Optional details']"));
  await descInput.sendKeys("This task was automatically created by Selenium.");

  // Save the Task
  const saveBtn = await driver.findElement(By.xpath("//button[text()='Create task']"));
  await saveBtn.click();
  
  // Wait for dialog to close and verify task appears in list
  await driver.wait(until.elementLocated(By.xpath(`//p[text()='${taskTitle}']`)), 10000);
  console.log(`Task created successfully: ${taskTitle}`);

  // 2. Toggle Task Status (Complete/Incomplete)
  // Find the toggle button associated with our newly created task
  // Since the list might contain multiple tasks, we search for the toggle button in the list item containing our task title
  const taskRow = await driver.findElement(
    By.xpath(`//li[.//p[text()='${taskTitle}']]`)
  );
  const toggleBtn = await taskRow.findElement(By.css("button[aria-label='Toggle']"));
  await toggleBtn.click();
  
  // Verify that it is marked completed (the text should get class line-through or similar)
  // Let's wait for the class line-through or text-muted-foreground on the title element
  await driver.wait(
    until.elementLocated(By.xpath(`//p[text()='${taskTitle}' and contains(@class, 'line-through')]`)),
    5000
  );
  console.log("Task marked completed successfully!");

  // Toggle it back to pending
  await toggleBtn.click();
  await driver.wait(
    until.elementLocated(By.xpath(`//p[text()='${taskTitle}' and not(contains(@class, 'line-through'))]`)),
    5000
  );
  console.log("Task marked pending again!");

  // 3. Edit Task Title
  const editBtn = await taskRow.findElement(By.xpath(".//button[./*[contains(@class, 'lucide-pencil')]]"));
  await editBtn.click();
  
  // Wait for edit dialog
  await driver.wait(until.elementLocated(By.xpath("//h2[text()='Edit task']")), 5000);
  
  // Clear and update title
  const editTitleInput = await driver.findElement(By.css("input[placeholder='What do you need to do?']"));
  
  // On Windows, select all and backspace is more reliable than clear() for React inputs
  await editTitleInput.sendKeys(Key.CONTROL, "a");
  await editTitleInput.sendKeys(Key.BACK_SPACE);
  
  const updatedTaskTitle = `${taskTitle} (Updated)`;
  await editTitleInput.sendKeys(updatedTaskTitle);
  
  // Save Changes
  const saveChangesBtn = await driver.findElement(By.xpath("//button[text()='Save changes']"));
  await saveChangesBtn.click();
  
  // Wait for updated title in list
  await driver.wait(until.elementLocated(By.xpath(`//p[text()='${updatedTaskTitle}']`)), 10000);
  console.log(`Task updated successfully to: ${updatedTaskTitle}`);

  // 4. Delete the Task
  const updatedTaskRow = await driver.findElement(
    By.xpath(`//li[.//p[text()='${updatedTaskTitle}']]`)
  );
  const deleteBtn = await updatedTaskRow.findElement(By.xpath(".//button[./*[contains(@class, 'lucide-trash')]]"));
  await deleteBtn.click();
  
  // Wait until task element is no longer visible/exists
  await driver.wait(
    async () => {
      const elements = await driver.findElements(By.xpath(`//p[text()='${updatedTaskTitle}']`));
      return elements.length === 0;
    },
    10000
  );
  console.log("Task deleted successfully!");
}

module.exports = { runTasksTest };
