from playwright.sync_api import sync_playwright
from utils.db import insert_product
from utils.proxy_handler import get_browser_with_proxy
import time
import random

def scrape_lidl():
    url = "https://www.lidl.es/es/c/comprar-alimentos/c1856"
    subcategories = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        page.goto(url, wait_until="networkidle")

        try:
            page.click('#onetrust-accept-btn-handler', timeout=5000)
        except:
            pass

        # These are the real food category elements
        elements = page.query_selector_all(".navigation-subnode__title")

        for el in elements:
            try:
                title = el.inner_text().strip()
                parent_link = el.evaluate("node => node.closest('a')?.href")
                if parent_link and title:
                    subcategories.append({
                        "title": title,
                        "url": parent_link if parent_link.startswith("http") else "https://www.lidl.es" + parent_link
                    })
            except:
                continue

        browser.close()

    print(f"🍎 Found {len(subcategories)} real food categories:")
    for sub in subcategories:
        print(f"- {sub['title']} → {sub['url']}")
    return subcategories
if __name__ == "__main__":
    scrape_lidl()
