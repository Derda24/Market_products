from playwright.sync_api import sync_playwright
from utils.db import insert_product
from utils.logger import log
import time
import os

BASE_URL = "https://www.compraonline.bonpreuesclat.cat"
CATEGORY_URL = f"{BASE_URL}/categories/alimentaci%C3%B3/c49d1ef2-bf51-44a7-b631-4a35474a21ac"


def save_debug_html(page, filename="bonpreu_debug.html"):
    html = page.content()
    with open(filename, "w", encoding="utf-8") as f:
        f.write(html)
    log(f"✅ HTML saved as {filename}")


def get_product_links(page):
    try:
        page.wait_for_selector("a[data-test='product-card-name']", timeout=20000)
        product_elements = page.query_selector_all("a[data-test='product-card-name']")
        links = [el.get_attribute("href") for el in product_elements if el.get_attribute("href")]
        return links
    except Exception as e:
        log(f"❌ Failed to fetch product URLs: {e}")
        save_debug_html(page, "bonpreu_debug.html")
        return []


def scrape_product(url, browser):
    context = browser.new_context()
    page = context.new_page()
    try:
        page.goto(url, timeout=30000)
        page.wait_for_selector("[data-test='product-title']", timeout=5000)

        name = page.locator("[data-test='product-title']").inner_text()
        price = page.locator("[data-test='product-price']").inner_text()
        quantity = page.locator("[data-test='product-quantity']").inner_text()

        clean_price = float(price.replace("€", "").replace(",", ".").strip())

        insert_product(
            name=name,
            price=clean_price,
            category="alimentacion",
            store_id="bonpreu",
            quantity=quantity
        )
        log(f"✅ Successfully inserted: {name} — {clean_price}€ ({quantity})")

    except Exception as e:
        log(f"❌ Error extracting data: {e}\nURL: {url}")
    finally:
        context.close()


def scrape_category(category_url):
    log(f"🌐 Visiting {category_url}")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        page.goto(category_url, timeout=60000)
        page.wait_for_timeout(5000)

        product_urls = get_product_links(page)
        log(f"🔗 Found {len(product_urls)} product URLs")

        for url in product_urls:
            full_url = BASE_URL + url if url.startswith("/") else url
            scrape_product(full_url, browser)

        browser.close()


if __name__ == "__main__":
    scrape_category(CATEGORY_URL)
