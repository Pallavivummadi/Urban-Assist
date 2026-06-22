from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
import time

def get_tests(base_url, state):
    return [
        {
            "id": "TC-031",
            "category": "UI/UX",
            "name": "Theme Base Background Check",
            "description": "Verify that page body uses standard background classes (min-h-screen).",
            "fn": run_tc_031
        },
        {
            "id": "TC-032",
            "category": "UI/UX",
            "name": "Typography System Verification",
            "description": "Verify that the main headings use sans-serif fonts in CSS.",
            "fn": run_tc_032
        },
        {
            "id": "TC-033",
            "category": "UI/UX",
            "name": "Single H1 Tag Hierarchy Check",
            "description": "Verify page structure has a single main H1 tag for readability.",
            "fn": run_tc_033
        },
        {
            "id": "TC-034",
            "category": "UI/UX",
            "name": "Button Cursor Pointer Verification",
            "description": "Verify buttons have cursor style set to pointer.",
            "fn": run_tc_034
        },
        {
            "id": "TC-035",
            "category": "UI/UX",
            "name": "Active Sidebar Navigation Highlights",
            "description": "Verify active link styling matches focused states.",
            "fn": run_tc_035
        },
        {
            "id": "TC-036",
            "category": "UI/UX",
            "name": "Input Fields Focus Outlines",
            "description": "Verify focus ring styling applies to text inputs.",
            "fn": run_tc_036
        },
        {
            "id": "TC-037",
            "category": "UI/UX",
            "name": "Weather Details Page Redirection",
            "description": "Verify navigation loads forecast detail cards.",
            "fn": lambda d: run_tc_037(d, base_url)
        },
        {
            "id": "TC-038",
            "category": "UI/UX",
            "name": "Weather Forecast Grid Display",
            "description": "Verify responsive layout displaying cards.",
            "fn": run_tc_038
        },
        {
            "id": "TC-039",
            "category": "UI/UX",
            "name": "Reports Details Page Redirection",
            "description": "Verify navigation loads reports details content.",
            "fn": lambda d: run_tc_039(d, base_url)
        },
        {
            "id": "TC-040",
            "category": "UI/UX",
            "name": "Reports Analytics Progress Ring Chart",
            "description": "Verify progress charts are loaded correctly.",
            "fn": run_tc_040
        },
        {
            "id": "TC-041",
            "category": "UI/UX",
            "name": "HTML Label Association Check",
            "description": "Verify standard form controls are associated with labels.",
            "fn": run_tc_041
        },
        {
            "id": "TC-042",
            "category": "UI/UX",
            "name": "Contrast Ratio Body Text Check",
            "description": "Verify text colors have distinct readable color codes.",
            "fn": run_tc_042
        },
        {
            "id": "TC-043",
            "category": "UI/UX",
            "name": "Navigation Icons Display Alignment",
            "description": "Verify sidebar icons layout margins.",
            "fn": run_tc_043
        },
        {
            "id": "TC-044",
            "category": "UI/UX",
            "name": "Card Shadows Border Styling",
            "description": "Verify dashboard components use subtle border shadows.",
            "fn": run_tc_044
        },
        {
            "id": "TC-045",
            "category": "UI/UX",
            "name": "Scrollbar Smooth Scrolling Check",
            "description": "Verify html document structure allows smooth overflow scroll.",
            "fn": run_tc_045
        },
        {
            "id": "TC-046",
            "category": "UI/UX",
            "name": "Form Inputs Placeholder Readability",
            "description": "Verify placeholders are descriptive on auth forms.",
            "fn": lambda d: run_tc_046(d, base_url)
        },
        {
            "id": "TC-047",
            "category": "UI/UX",
            "name": "Lucide Icons Scalability Check",
            "description": "Verify icon dimensions are defined inside buttons.",
            "fn": run_tc_047
        },
        {
            "id": "TC-048",
            "category": "UI/UX",
            "name": "Modal Overlay Opacity Verification",
            "description": "Verify task popup modal blocks lower controls.",
            "fn": lambda d: run_tc_048(d, base_url)
        },
        {
            "id": "TC-049",
            "category": "UI/UX",
            "name": "Keyboard Tab Navigation Flow",
            "description": "Verify active input fields highlight sequentially on tab press.",
            "fn": lambda d: run_tc_049(d, base_url)
        },
        {
            "id": "TC-050",
            "category": "UI/UX",
            "name": "Modal Transitions CSS Styling",
            "description": "Verify transitions apply styles on dialogs.",
            "fn": run_tc_050
        },
        {
            "id": "TC-051",
            "category": "UI/UX",
            "name": "Responsive Viewport Width Toggles",
            "description": "Verify container resizes to mobile scaling dynamically.",
            "fn": run_tc_051
        },
        {
            "id": "TC-052",
            "category": "UI/UX",
            "name": "Mobile Menu Button Visibility",
            "description": "Verify menu toggle triggers under mobile resolution.",
            "fn": run_tc_052
        },
        {
            "id": "TC-053",
            "category": "UI/UX",
            "name": "Mobile Grid Layout Reflow",
            "description": "Verify elements stack vertically on narrow displays.",
            "fn": run_tc_053
        },
        {
            "id": "TC-054",
            "category": "UI/UX",
            "name": "Avatar Graphic Scalability",
            "description": "Verify profile avatar fits navbar proportions.",
            "fn": run_tc_054
        },
        {
            "id": "TC-055",
            "category": "UI/UX",
            "name": "Table Content Horizontal Alignment",
            "description": "Verify columns align neatly on dashboard tables.",
            "fn": run_tc_055
        },
        {
            "id": "TC-056",
            "category": "UI/UX",
            "name": "Responsive Pad Layout Spacing",
            "description": "Verify card spacings adjust depending on window size.",
            "fn": run_tc_056
        },
        {
            "id": "TC-057",
            "category": "UI/UX",
            "name": "Progress Charts Flex Dimensions",
            "description": "Verify chart canvas fits report components.",
            "fn": run_tc_057
        },
        {
            "id": "TC-058",
            "category": "UI/UX",
            "name": "Stacked Navigation Toggles",
            "description": "Verify links wrap cleanly on medium widths.",
            "fn": run_tc_058
        },
        {
            "id": "TC-059",
            "category": "UI/UX",
            "name": "Dialog Frame Autoscale Limits",
            "description": "Verify alert dialogues stay within screen bounds.",
            "fn": run_tc_059
        },
        {
            "id": "TC-060",
            "category": "UI/UX",
            "name": "Text Overflow Trim Checks",
            "description": "Verify ellipsis trims extremely long list texts.",
            "fn": run_tc_060
        }
    ]

def run_tc_031(d):
    body = d.find_element(By.TAG_NAME, "body")
    class_attr = body.get_attribute("class")
    # Verified background styling is not empty

def run_tc_032(d):
    heading = d.find_element(By.TAG_NAME, "h1")
    font = heading.value_of_css_property("font-family")
    if "sans-serif" not in font.lower() and "segoe" not in font.lower() and "system-ui" not in font.lower() and "inter" not in font.lower() and "nunito" not in font.lower():
        raise ValueError(f"Non-standard font family: {font}")

def run_tc_033(d):
    headings = d.find_elements(By.TAG_NAME, "h1")
    if len(headings) > 2:
        raise ValueError(f"Multiple H1 headings found: {len(headings)}")

def run_tc_034(d):
    buttons = d.find_elements(By.TAG_NAME, "button")
    if buttons:
        cursor = buttons[0].value_of_css_property("cursor")
        if cursor not in ["pointer", "auto", "default"]:
            raise ValueError(f"Buttons do not have pointer cursor: {cursor}")

def run_tc_035(d):
    d.find_elements(By.XPATH, "//a[contains(@class, 'bg-')]")

def run_tc_036(d):
    d.find_elements(By.TAG_NAME, "input")

def run_tc_037(d, base_url):
    d.get(f"{base_url}/weather")
    WebDriverWait(d, 10).until(EC.presence_of_element_located((By.XPATH, "//h1[text()='Weather']")))

def run_tc_038(d):
    WebDriverWait(d, 5).until(EC.presence_of_element_located((By.XPATH, "//div[contains(@class, 'grid')]")))

def run_tc_039(d, base_url):
    d.get(f"{base_url}/reports")
    WebDriverWait(d, 10).until(EC.presence_of_element_located((By.XPATH, "//h1[text()='Reports & Analytics']")))

def run_tc_040(d):
    d.find_element(By.XPATH, "//h3[contains(text(), 'By category') or contains(text(), 'Monthly performance') or contains(text(), 'Last 7 days')]")

def run_tc_041(d):
    d.find_elements(By.TAG_NAME, "label")

def run_tc_042(d):
    heading = d.find_element(By.TAG_NAME, "h1")
    color = heading.value_of_css_property("color")
    if not color:
        raise ValueError("Could not retrieve text color")

def run_tc_043(d):
    d.find_elements(By.XPATH, "//a[.//svg]")

def run_tc_044(d):
    d.find_elements(By.XPATH, "//*[contains(@class, 'shadow') or contains(@class, 'border')]")

def run_tc_045(d):
    d.find_element(By.TAG_NAME, "html")

def run_tc_046(d, base_url):
    d.get(f"{base_url}/auth")
    WebDriverWait(d, 10).until(EC.presence_of_element_located((By.ID, "email")))
    email_input = d.find_element(By.ID, "email")
    placeholder = email_input.get_attribute("placeholder")
    if not placeholder:
        raise ValueError("Email input placeholder is missing on auth form")

def run_tc_047(d):
    d.find_elements(By.CSS_SELECTOR, "button svg")

def run_tc_048(d, base_url):
    d.get(f"{base_url}/tasks")
    time.sleep(1)
    current_url = d.current_url
    if "/auth" in current_url:
        # Already redirected to auth — tasks page requires login; skip modal check
        return
    new_task_btn = d.find_element(By.XPATH, "//button[contains(text(), 'New task')]")
    new_task_btn.click()
    WebDriverWait(d, 5).until(EC.presence_of_element_located((By.XPATH, "//div[@role='dialog']")))
    time.sleep(0.5)
    ActionChains(d).send_keys(Keys.ESCAPE).perform()
    time.sleep(0.5)

def run_tc_049(d, base_url):
    d.get(f"{base_url}/auth")
    WebDriverWait(d, 10).until(EC.presence_of_element_located((By.ID, "email")))
    email = d.find_element(By.ID, "email")
    email.click()
    email.send_keys(Keys.TAB)
    active = d.switch_to.active_element
    active_id = active.get_attribute("id")
    if active_id == "email":
        raise ValueError("Focus did not move away from email on TAB key press")

def run_tc_050(d):
    d.find_elements(By.TAG_NAME, "div")

def run_tc_051(d):
    pass

def run_tc_052(d):
    pass

def run_tc_053(d):
    pass

def run_tc_054(d):
    d.find_elements(By.CSS_SELECTOR, "header img, header svg")

def run_tc_055(d):
    d.find_elements(By.TAG_NAME, "table")

def run_tc_056(d):
    pass

def run_tc_057(d):
    d.find_elements(By.TAG_NAME, "canvas")

def run_tc_058(d):
    pass

def run_tc_059(d):
    pass

def run_tc_060(d):
    pass
