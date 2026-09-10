"""Selenium functional tests for the PulseAlert Angular frontend.

Prerequisites:
    pip install selenium
    Start the backend on http://localhost:3000.
    Start the frontend on http://localhost:4200.

Run:
    python testing/test_pulsealert.py

Environment variables:
    PULSEALERT_URL: frontend URL, default http://localhost:4200
    PULSEALERT_HEADLESS: set to 1 for headless mode, default 0
    PULSEALERT_DRIVER: approved chromedriver.exe path, if Selenium Manager is blocked
    PULSEALERT_BROWSER: chrome.exe path, if Chrome is not on PATH
    PULSEALERT_STEP_DELAY: seconds between visible workflow steps, default 0.35
"""

from __future__ import annotations

import io
import os
import time
import unittest
from typing import Final

from selenium import webdriver
from selenium.common.exceptions import WebDriverException
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


FRONTEND_URL: Final = os.getenv("PULSEALERT_URL", "http://localhost:4200")
HEADLESS: Final = os.getenv("PULSEALERT_HEADLESS", "0") == "1"
DRIVER_PATH: Final = os.getenv("PULSEALERT_DRIVER", "")
CHROME_PATH: Final = os.getenv(
    "PULSEALERT_BROWSER",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
)
STEP_DELAY: Final = float(os.getenv("PULSEALERT_STEP_DELAY", "0.35"))
WAIT_SECONDS: Final = 15


class PulseAlertFunctionalTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        options = Options()
        if HEADLESS:
            options.add_argument("--headless=new")
        options.add_argument("--window-size=1440,1000")
        options.add_argument("--disable-gpu")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        if os.path.isfile(CHROME_PATH):
            options.binary_location = CHROME_PATH

        service = Service(DRIVER_PATH) if DRIVER_PATH else Service()
        try:
            cls.driver = webdriver.Chrome(service=service, options=options)
        except (OSError, WebDriverException) as error:
            raise RuntimeError(
                "ChromeDriver could not start. Windows may be blocking the driver "
                "under Application Control. Set PULSEALERT_DRIVER to an approved "
                "chromedriver.exe path, or ask IT to allowlist the driver."
            ) from error
        cls.wait = WebDriverWait(cls.driver, WAIT_SECONDS)

    @classmethod
    def tearDownClass(cls) -> None:
        cls.driver.quit()

    def setUp(self) -> None:
        self.driver.get(FRONTEND_URL)
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "app-root")))
        time.sleep(STEP_DELAY)

    def wait_for_text(self, text: str):
        return self.wait.until(
            EC.presence_of_element_located((By.XPATH, f"//*[contains(normalize-space(), {self.xpath_literal(text)})]"))
        )

    def click_text(self, text: str) -> None:
        element = self.wait.until(
            EC.element_to_be_clickable((By.XPATH, f"//*[normalize-space()={self.xpath_literal(text)}]"))
        )
        self.driver.execute_script("arguments[0].click();", element)
        time.sleep(STEP_DELAY)

    def click_button_containing(self, text: str) -> None:
        element = self.wait.until(
            EC.element_to_be_clickable(
                (By.XPATH, f"//button[contains(normalize-space(), {self.xpath_literal(text)})]")
            )
        )
        self.driver.execute_script("arguments[0].click();", element)
        time.sleep(STEP_DELAY)

    def navigate(self, path: str) -> None:
        self.driver.get(f"{FRONTEND_URL}{path}")
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "app-root")))
        time.sleep(STEP_DELAY)

    def xpath_literal(self, value: str) -> str:
        if "'" not in value:
            return f"'{value}'"
        if '"' not in value:
            return f'"{value}"'
        parts = value.split("'")
        return "concat(" + ", \"'\", ".join(f"'{part}'" for part in parts) + ")"

    def select_first_alert(self) -> None:
        row = self.wait.until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "tbody tr[app-alert-row]"))
        )
        self.driver.execute_script("arguments[0].click();", row)
        time.sleep(STEP_DELAY)
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "app-alert-detail")))

    def test_dashboard_cards_and_facility_list(self) -> None:
        self.navigate("/dashboard")
        self.wait_for_text("Dashboard")
        for label in ("Total Alerts", "Active Critical Alerts", "Active Alerts", "Closed Alerts"):
            self.assertTrue(self.wait_for_text(label).is_displayed(), f"Missing dashboard card: {label}")
        self.assertGreaterEqual(
            len(self.driver.find_elements(By.XPATH, "//h3")),
            1,
            "Dashboard should show at least one facility",
        )

    def test_facility_management_detail_and_alert_navigation(self) -> None:
        self.navigate("/facilities")
        self.wait_for_text("Facility Management")
        self.click_button_containing("View Facility Details")
        self.wait_for_text("View Facility Alerts")
        self.click_button_containing("View Facility Alerts")
        self.wait.until(EC.url_contains("/alerts"))
        self.assertTrue(self.driver.find_elements(By.XPATH, "//*[contains(normalize-space(), 'at ')]"))

    def test_raise_alert(self) -> None:
        self.navigate("/alerts")
        self.click_button_containing("Raise Alert")
        self.wait_for_text("Raise New Alert")

        title = f"Selenium alert {int(time.time())}"
        self.driver.find_element(By.NAME, "title").send_keys(title)
        self.driver.find_element(By.NAME, "host").send_keys("selenium-test-host")
        self.driver.find_element(By.NAME, "description").send_keys("Created by Selenium functional testing.")
        self.driver.find_element(By.CSS_SELECTOR, "input[name='severity'][value='High']").click()
        self.click_button_containing("Submit & Broadcast Alert")

        self.wait.until(EC.invisibility_of_element_located((By.CSS_SELECTOR, "app-raise-alert-modal")))
        self.wait_for_text(title)

    def test_mark_addressed_and_reopen(self) -> None:
        self.navigate("/alerts")
        self.select_first_alert()
        self.click_button_containing("Mark as addressed")
        self.wait_for_text("Unmark as addressed")
        self.click_button_containing("Unmark as addressed")
        self.wait_for_text("Mark as addressed")

    def test_close_and_reopen_alert(self) -> None:
        self.navigate("/alerts")
        self.select_first_alert()
        self.click_button_containing("Close alert")
        self.wait_for_text("Do you want to close this alert?")
        self.click_button_containing("Confirm Close")
        self.wait_for_text("This alert is closed and resolved")
        self.click_text("Reopen")
        self.wait.until(
            EC.any_of(
                EC.presence_of_element_located((By.XPATH, "//button[contains(normalize-space(), 'Close alert')]")),
                EC.presence_of_element_located((By.XPATH, "//button[contains(normalize-space(), 'Mark as addressed')]")),
            )
        )

    def test_facility_filter_changes_alert_context(self) -> None:
        self.navigate("/alerts")
        facility_select = self.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "header select[aria-label='Filter by facility']"))
        )
        options = facility_select.find_elements(By.TAG_NAME, "option")
        self.assertGreaterEqual(len(options), 2, "Facility selector should contain a facility option")
        facility_id = options[1].get_attribute("value")
        self.driver.execute_script(
            "arguments[0].value = arguments[1]; arguments[0].dispatchEvent(new Event('change', {bubbles: true}));",
            facility_select,
            facility_id,
        )
        self.wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(normalize-space(), 'alert')]")
        ))
        self.assertNotEqual(facility_id, "all")

    def test_facility_names_are_consistent_across_views(self) -> None:
        self.navigate("/dashboard")
        facility_heading = self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "section h3")))
        facility_name = facility_heading.text
        self.navigate("/facilities")
        self.assertTrue(
            self.wait.until(
                EC.presence_of_element_located(
                    (By.XPATH, f"//*[normalize-space()={self.xpath_literal(facility_name)}]")
                )
            ).is_displayed()
        )

    def test_header_filters_are_route_specific(self) -> None:
        self.navigate("/dashboard")
        self.assertFalse(self.driver.find_elements(By.CSS_SELECTOR, "header input[placeholder*='Filter alerts']"))
        self.assertFalse(self.driver.find_elements(By.CSS_SELECTOR, "header select[aria-label='Filter by facility']"))

        self.navigate("/facilities")
        self.assertFalse(self.driver.find_elements(By.CSS_SELECTOR, "header input[placeholder*='Filter alerts']"))
        self.assertFalse(self.driver.find_elements(By.CSS_SELECTOR, "header select[aria-label='Filter by facility']"))

        self.navigate("/alerts")
        self.assertTrue(self.driver.find_elements(By.CSS_SELECTOR, "header input[placeholder*='Filter alerts']"))
        self.assertTrue(self.driver.find_elements(By.CSS_SELECTOR, "header select[aria-label='Filter by facility']"))

    def test_dashboard_metric_values_are_visible(self) -> None:
        self.navigate("/dashboard")
        for label in ("Total Alerts", "Active Critical Alerts", "Active Alerts", "Closed Alerts"):
            card = self.wait.until(
                EC.presence_of_element_located(
                    (By.XPATH, f"//article[.//*[normalize-space()={self.xpath_literal(label)}]]")
                )
            )
            self.assertRegex(card.text, r"\d+", f"Dashboard card has no numeric value: {label}")

    def test_alert_severity_filter_changes_results(self) -> None:
        self.navigate("/alerts")
        all_count = int(
            self.wait.until(
                EC.presence_of_element_located(
                    (By.XPATH, "//button[.//span[normalize-space()='All']]//span[last()]")
                )
            ).text
        )
        self.click_text("Critical")
        critical_count = int(
            self.wait.until(
                EC.presence_of_element_located(
                    (By.XPATH, "//div[contains(@class, 'flex')][.//button[.//span[normalize-space()='Critical']]]")
                )
            ).text.split("Critical")[-1].split()[0]
        )
        self.assertLessEqual(critical_count, all_count)
        self.assertTrue(self.driver.find_elements(By.CSS_SELECTOR, "tbody tr[app-alert-row]"))

    def test_clear_alert_filters_restores_all_results(self) -> None:
        self.navigate("/alerts")
        self.click_text("Closed")
        self.wait_for_text("Clear filter")
        self.click_text("Clear filter")
        self.assertTrue(self.driver.find_elements(By.XPATH, "//button[.//span[normalize-space()='All'] and contains(@class, 'border-2') ]"))

    def test_alert_pagination_controls_are_available(self) -> None:
        self.navigate("/alerts")
        pagination = self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "app-pagination")))
        self.assertTrue(pagination.find_elements(By.XPATH, ".//button[contains(normalize-space(), 'Previous')]"))
        self.assertTrue(pagination.find_elements(By.XPATH, ".//button[contains(normalize-space(), 'Next')]"))
        page_size = pagination.find_element(By.TAG_NAME, "select")
        self.assertGreaterEqual(len(page_size.find_elements(By.TAG_NAME, "option")), 2)

    def test_alert_manual_refresh_control_is_available(self) -> None:
        self.navigate("/alerts")
        refresh = self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button[title='Refresh now']")))
        self.driver.execute_script("arguments[0].click();", refresh)
        time.sleep(STEP_DELAY)
        self.assertTrue(self.driver.find_elements(By.XPATH, "//*[contains(normalize-space(), 'Live') or contains(normalize-space(), 'Syncing') ]"))

    def test_raise_alert_validation_keeps_modal_open(self) -> None:
        self.navigate("/alerts")
        self.click_button_containing("Raise Alert")
        self.click_button_containing("Submit & Broadcast Alert")
        self.wait_for_text("Raise New Alert")
        self.assertTrue(self.driver.find_elements(By.CSS_SELECTOR, "app-raise-alert-modal"))

    def test_zzz_logout_refreshes_page_last(self) -> None:
        """Logout is intentionally named last so it runs after all workflows."""
        self.navigate("/dashboard")
        current_url = self.driver.current_url
        self.click_button_containing("Elena Rostova")
        self.click_button_containing("Logout")

        confirmation = self.wait.until(EC.alert_is_present())
        self.assertIn("log out", confirmation.text.lower())
        confirmation.accept()

        self.wait.until(lambda driver: driver.execute_script("return document.readyState") == "complete")
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "app-root")))
        self.assertEqual(self.driver.current_url, current_url)


class ShortTestResult(unittest.TextTestResult):
    def addSuccess(self, test):
        super().addSuccess(test)
        print(f"PASS  {test.id().split('.')[-1]}")

    def addFailure(self, test, err):
        super().addFailure(test, err)
        print(f"FAIL  {test.id().split('.')[-1]}")

    def addError(self, test, err):
        super().addError(test, err)
        print(f"ERROR {test.id().split('.')[-1]}")


class ShortTestRunner(unittest.TextTestRunner):
    resultclass = ShortTestResult

    def __init__(self, **kwargs):
        super().__init__(stream=io.StringIO(), verbosity=0, **kwargs)


if __name__ == "__main__":
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(PulseAlertFunctionalTests)
    result = ShortTestRunner().run(suite)
    print(
        f"SUMMARY passed={result.testsRun - len(result.failures) - len(result.errors)} "
        f"failed={len(result.failures)} errors={len(result.errors)}"
    )
    raise SystemExit(0 if result.wasSuccessful() else 1)
