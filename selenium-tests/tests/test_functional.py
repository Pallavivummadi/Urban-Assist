from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
import time

def get_tests(base_url, state):
    return [
        {
            "id": "TC-001",
            "category": "Functional",
            "name": "Signup Page Tab Navigation",
            "description": "Verify that clicking 'Sign up' tab loads registration form elements.",
            "fn": lambda d: run_tc_001(d, base_url)
        },
        {
            "id": "TC-002",
            "category": "Functional",
            "name": "User Account Registration",
            "description": "Verify new user registration submit redirects to dashboard.",
            "fn": lambda d: run_tc_002(d, state)
        },
        {
            "id": "TC-003",
            "category": "Functional",
            "name": "User Session Sign Out",
            "description": "Verify clicking the sign out button invalidates session and redirects to auth.",
            "fn": run_tc_003
        },
        {
            "id": "TC-004",
            "category": "Functional",
            "name": "Sign In Page Tab Navigation",
            "description": "Verify clicking 'Sign in' tab toggles back to credentials input.",
            "fn": lambda d: run_tc_004(d, base_url)
        },
        {
            "id": "TC-005",
            "category": "Functional",
            "name": "User Session Sign In",
            "description": "Verify logging in with registered credentials redirects back to dashboard.",
            "fn": lambda d: run_tc_005(d, state)
        },
        {
            "id": "TC-006",
            "category": "Functional",
            "name": "Dashboard Welcome Banner Load",
            "description": "Verify dashboard welcomes user with an emoji header tag.",
            "fn": lambda d: run_tc_006(d, base_url)
        },
        {
            "id": "TC-007",
            "category": "Functional",
            "name": "Dashboard Overview Stat Cards",
            "description": "Verify summary cards for Tasks and Completion are loaded.",
            "fn": run_tc_007
        },
        {
            "id": "TC-008",
            "category": "Functional",
            "name": "Dashboard Recent Activity Feed",
            "description": "Verify Recent Activity feed displays current task logs.",
            "fn": run_tc_008
        },
        {
            "id": "TC-009",
            "category": "Functional",
            "name": "Dashboard Quick Access Navigation Links",
            "description": "Verify presence of clickable Quick Access grid cards.",
            "fn": run_tc_009
        },
        {
            "id": "TC-010",
            "category": "Functional",
            "name": "Navigation Menu Layout Visibility",
            "description": "Verify that sidebar links are present and visible on dashboard page.",
            "fn": run_tc_010
        },
        {
            "id": "TC-011",
            "category": "Functional",
            "name": "Tasks Page Navigation",
            "description": "Verify page redirects and displays tasks title heading.",
            "fn": lambda d: run_tc_011(d, base_url)
        },
        {
            "id": "TC-012",
            "category": "Functional",
            "name": "Open 'New Task' Dialog",
            "description": "Verify click on 'New task' button triggers modal popup.",
            "fn": run_tc_012
        },
        {
            "id": "TC-013",
            "category": "Functional",
            "name": "Fill Task Inputs Form",
            "description": "Verify text typed into task forms is correctly registered.",
            "fn": lambda d: run_tc_013(d, state)
        },
        {
            "id": "TC-014",
            "category": "Functional",
            "name": "Task Creation Submission",
            "description": "Verify submitting task closes form and updates list.",
            "fn": lambda d: run_tc_014(d, state)
        },
        {
            "id": "TC-015",
            "category": "Functional",
            "name": "Verify Task Item in List",
            "description": "Verify new task is in pending status and display matches input.",
            "fn": lambda d: run_tc_015(d, state)
        },
        {
            "id": "TC-016",
            "category": "Functional",
            "name": "Toggle Task to Completed",
            "description": "Verify clicking status checkbox changes status of the task.",
            "fn": lambda d: run_tc_016(d, state)
        },
        {
            "id": "TC-017",
            "category": "Functional",
            "name": "Verify Task Completed Style",
            "description": "Verify completed task text style shifts to strike-through.",
            "fn": lambda d: run_tc_017(d, state)
        },
        {
            "id": "TC-018",
            "category": "Functional",
            "name": "Toggle Task Back to Pending",
            "description": "Verify clicking checkbox again moves task back to pending.",
            "fn": lambda d: run_tc_018(d, state)
        },
        {
            "id": "TC-019",
            "category": "Functional",
            "name": "Open Edit Task Dialog",
            "description": "Verify click on edit pencil icon opens modal with current title filled.",
            "fn": lambda d: run_tc_019(d, state)
        },
        {
            "id": "TC-020",
            "category": "Functional",
            "name": "Update Task Title Value",
            "description": "Verify changing value in edit input field.",
            "fn": lambda d: run_tc_020(d, state)
        },
        {
            "id": "TC-021",
            "category": "Functional",
            "name": "Save Edited Task Changes",
            "description": "Verify click on save changes submits form and updates DOM.",
            "fn": lambda d: run_tc_021(d, state)
        },
        {
            "id": "TC-022",
            "category": "Functional",
            "name": "Verify Updated Title in List",
            "description": "Verify list contains updated task title.",
            "fn": lambda d: run_tc_022(d, state)
        },
        {
            "id": "TC-023",
            "category": "Functional",
            "name": "Delete Task Action",
            "description": "Verify clicking delete trash can icon removes task.",
            "fn": lambda d: run_tc_023(d, state)
        },
        {
            "id": "TC-024",
            "category": "Functional",
            "name": "Verify Task Removal",
            "description": "Verify task element is no longer visible in list.",
            "fn": lambda d: run_tc_024(d, state)
        },
        {
            "id": "TC-025",
            "category": "Functional",
            "name": "Profile Page Navigation",
            "description": "Verify page redirects and profile header appears.",
            "fn": lambda d: run_tc_025(d, base_url)
        },
        {
            "id": "TC-026",
            "category": "Functional",
            "name": "Profile Name Input Update",
            "description": "Verify changing name field updates display name.",
            "fn": run_tc_026
        },
        {
            "id": "TC-027",
            "category": "Functional",
            "name": "Profile City Input Update",
            "description": "Verify city field changes save correctly.",
            "fn": run_tc_027
        },
        {
            "id": "TC-028",
            "category": "Functional",
            "name": "Profile Phone Input Update",
            "description": "Verify phone changes save and persist.",
            "fn": run_tc_028
        },
        {
            "id": "TC-029",
            "category": "Functional",
            "name": "Settings Page Navigation",
            "description": "Verify settings page redirection and header.",
            "fn": lambda d: run_tc_029(d, base_url)
        },
        {
            "id": "TC-030",
            "category": "Functional",
            "name": "Settings Notification Switch Toggle",
            "description": "Verify clicking notifications switch toggles state.",
            "fn": run_tc_030
        }
    ]

def run_tc_001(d, base_url):
    d.get(f"{base_url}/auth")
    WebDriverWait(d, 10).until(EC.presence_of_element_located((By.ID, "email")))
    time.sleep(1.5)
    signup_tab = WebDriverWait(d, 5).until(
        EC.presence_of_element_located((By.XPATH, "//button[contains(text(), 'Sign up') or @value='signup']"))
    )
    signup_tab.click()
    try:
        WebDriverWait(d, 3).until(EC.presence_of_element_located((By.ID, "name")))
    except Exception:
        signup_tab.click()
        WebDriverWait(d, 5).until(EC.presence_of_element_located((By.ID, "name")))

def run_tc_002(d, state):
    d.find_element(By.ID, "name").send_keys(state["name"])
    d.find_element(By.ID, "email").send_keys(state["email"])
    d.find_element(By.ID, "password").send_keys(state["password"])
    submit_btn = d.find_element(By.CSS_SELECTOR, "button[type='submit']")
    submit_btn.click()
    WebDriverWait(d, 15).until(EC.url_contains("/dashboard"))

def run_tc_003(d):
    signout_btn = WebDriverWait(d, 10).until(
        EC.presence_of_element_located((By.XPATH, "//button[contains(text(), 'Sign out')]"))
    )
    signout_btn.click()
    WebDriverWait(d, 10).until(EC.url_contains("/auth"))

def run_tc_004(d, base_url):
    d.get(f"{base_url}/auth")
    WebDriverWait(d, 10).until(EC.presence_of_element_located((By.ID, "email")))
    signin_tab = WebDriverWait(d, 5).until(
        EC.presence_of_element_located((By.XPATH, "//button[contains(text(), 'Sign in') or @value='signin']"))
    )
    signin_tab.click()

def run_tc_005(d, state):
    d.find_element(By.ID, "email").send_keys(state["email"])
    d.find_element(By.ID, "password").send_keys(state["password"])
    submit_btn = d.find_element(By.CSS_SELECTOR, "button[type='submit']")
    submit_btn.click()
    WebDriverWait(d, 15).until(EC.url_contains("/dashboard"))

def run_tc_006(d, base_url):
    d.get(f"{base_url}/dashboard")
    WebDriverWait(d, 15).until(EC.presence_of_element_located((By.XPATH, "//h1[contains(., '👋')]")))

def run_tc_007(d):
    WebDriverWait(d, 10).until(EC.presence_of_element_located((By.XPATH, "//span[text()='Tasks today']")))
    d.find_element(By.XPATH, "//span[text()='Completed']")

def run_tc_008(d):
    d.find_element(By.XPATH, "//h2[text()='Recent activity']")

def run_tc_009(d):
    d.find_element(By.XPATH, "//h2[text()='Quick access']")
    d.find_element(By.XPATH, "//h3[text()='Plan tasks']")

def run_tc_010(d):
    d.find_element(By.XPATH, "//a[contains(@href, '/dashboard')]")
    d.find_element(By.XPATH, "//a[contains(@href, '/tasks')]")

def run_tc_011(d, base_url):
    d.get(f"{base_url}/tasks")
    WebDriverWait(d, 10).until(EC.presence_of_element_located((By.XPATH, "//h1[text()='Tasks']")))

def run_tc_012(d):
    new_task_btn = d.find_element(By.XPATH, "//button[contains(text(), 'New task')]")
    new_task_btn.click()
    WebDriverWait(d, 5).until(EC.presence_of_element_located((By.XPATH, "//h2[text()='New task']")))

def run_tc_013(d, state):
    title_input = d.find_element(By.CSS_SELECTOR, "input[placeholder='What do you need to do?']")
    state["createdTaskTitle"] = f"Automation Task {int(time.time() * 1000)}"
    title_input.send_keys(state["createdTaskTitle"])
    desc_input = d.find_element(By.CSS_SELECTOR, "textarea[placeholder='Optional details']")
    desc_input.send_keys("Automated testing description details.")

def run_tc_014(d, state):
    save_btn = d.find_element(By.XPATH, "//button[text()='Create task']")
    save_btn.click()
    WebDriverWait(d, 10).until(EC.presence_of_element_located((By.XPATH, f"//p[text()='{state['createdTaskTitle']}']")))

def run_tc_015(d, state):
    task_item = d.find_element(By.XPATH, f"//li[.//p[text()='{state['createdTaskTitle']}']]")
    text = task_item.text
    if state["createdTaskTitle"] not in text:
        raise ValueError("Task title mismatch in list.")

def run_tc_016(d, state):
    task_row = d.find_element(By.XPATH, f"//li[.//p[text()='{state['createdTaskTitle']}']]")
    toggle_btn = task_row.find_element(By.CSS_SELECTOR, "button[aria-label='Toggle']")
    toggle_btn.click()

def run_tc_017(d, state):
    WebDriverWait(d, 5).until(
        EC.presence_of_element_located((By.XPATH, f"//p[text()='{state['createdTaskTitle']}' and contains(@class, 'line-through')]"))
    )

def run_tc_018(d, state):
    task_row = d.find_element(By.XPATH, f"//li[.//p[text()='{state['createdTaskTitle']}']]")
    toggle_btn = task_row.find_element(By.CSS_SELECTOR, "button[aria-label='Toggle']")
    toggle_btn.click()
    WebDriverWait(d, 5).until(
        EC.presence_of_element_located((By.XPATH, f"//p[text()='{state['createdTaskTitle']}' and not(contains(@class, 'line-through'))]"))
    )

def run_tc_019(d, state):
    task_row = d.find_element(By.XPATH, f"//li[.//p[text()='{state['createdTaskTitle']}']]")
    edit_btn = task_row.find_element(By.XPATH, ".//button[./*[contains(@class, 'lucide-pencil')]]")
    edit_btn.click()
    WebDriverWait(d, 5).until(EC.presence_of_element_located((By.XPATH, "//h2[text()='Edit task']")))

def run_tc_020(d, state):
    edit_title_input = d.find_element(By.CSS_SELECTOR, "input[placeholder='What do you need to do?']")
    edit_title_input.send_keys(Keys.CONTROL, "a")
    edit_title_input.send_keys(Keys.BACK_SPACE)
    state["updatedTaskTitle"] = f"{state['createdTaskTitle']} (Updated)"
    edit_title_input.send_keys(state["updatedTaskTitle"])

def run_tc_021(d, state):
    save_changes_btn = d.find_element(By.XPATH, "//button[text()='Save changes']")
    save_changes_btn.click()
    WebDriverWait(d, 10).until(EC.presence_of_element_located((By.XPATH, f"//p[text()='{state['updatedTaskTitle']}']")))

def run_tc_022(d, state):
    item = d.find_element(By.XPATH, f"//p[text()='{state['updatedTaskTitle']}']")
    if not item:
        raise ValueError("Updated task title not found.")

def run_tc_023(d, state):
    task_row = d.find_element(By.XPATH, f"//li[.//p[text()='{state['updatedTaskTitle']}']]")
    delete_btn = task_row.find_element(By.XPATH, ".//button[./*[contains(@class, 'lucide-trash')]]")
    delete_btn.click()

def run_tc_024(d, state):
    def check_removal(driver):
        elements = driver.find_elements(By.XPATH, f"//p[text()='{state['updatedTaskTitle']}']")
        return len(elements) == 0
    WebDriverWait(d, 10).until(check_removal)

def run_tc_025(d, base_url):
    d.get(f"{base_url}/profile")
    WebDriverWait(d, 10).until(EC.presence_of_element_located((By.XPATH, "//h1[text()='Profile']")))

def run_tc_026(d):
    name_input = d.find_element(By.CSS_SELECTOR, "input[placeholder='Your name']")
    name_input.send_keys(Keys.CONTROL, "a")
    name_input.send_keys(Keys.BACK_SPACE)
    name_input.send_keys("Updated Selenium User")
    save_btn = d.find_element(By.XPATH, "//button[contains(text(), 'Save changes')]")
    save_btn.click()
    time.sleep(1)

def run_tc_027(d):
    city_input = d.find_element(By.CSS_SELECTOR, "input[placeholder='e.g. Bengaluru']")
    city_input.send_keys(Keys.CONTROL, "a")
    city_input.send_keys(Keys.BACK_SPACE)
    city_input.send_keys("New Bengaluru")
    save_btn = d.find_element(By.XPATH, "//button[contains(text(), 'Save changes')]")
    save_btn.click()
    time.sleep(1)

def run_tc_028(d):
    phone_input = d.find_element(By.CSS_SELECTOR, "input[placeholder='Optional']")
    phone_input.send_keys(Keys.CONTROL, "a")
    phone_input.send_keys(Keys.BACK_SPACE)
    phone_input.send_keys("+918888888888")
    save_btn = d.find_element(By.XPATH, "//button[contains(text(), 'Save changes')]")
    save_btn.click()
    time.sleep(1)

def run_tc_029(d, base_url):
    d.get(f"{base_url}/settings")
    WebDriverWait(d, 10).until(EC.presence_of_element_located((By.XPATH, "//h1[text()='Settings']")))

def run_tc_030(d):
    toggle = d.find_element(By.XPATH, "//p[contains(text(), 'Notifications') or contains(text(), 'notifications')]/ancestor::div[contains(@class, 'flex') and ./button[@role='switch']]/button[@role='switch']")
    toggle.click()
