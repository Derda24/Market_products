from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
from utils.db import insert_product
import time, os

BASE_URL = "https://www.alcampo.es"
CATEGORY_URL = f"{BASE_URL}/supermercado/verduras-y-hortalizas"
OUTPUT_HTML = "alcampo_debug.html"

def extract_product_data(page, category):
    try:
        # Ürün kartlarının görünmesini bekle
        page.wait_for_selector('article[data-test="product-card"]', timeout=10000)
    except PlaywrightTimeout:
        with open(OUTPUT_HTML, "w", encoding="utf-8") as f:
            f.write(page.content())
        print(f"❌ Timeout — HTML saved as {OUTPUT_HTML}")
        return []

    cards = page.query_selector_all('article[data-test="product-card"]')
    print(f"🔎 Found {len(cards)} product cards.")

    results = []
    for card in cards:
        try:
            name = card.query_selector("h2").inner_text().strip()

            price_text = card.query_selector('[data-test="product-card-price"]').inner_text()
            price = float(price_text.replace("€", "").replace(",", ".").strip())

            quantity_el = card.query_selector('[data-test="product-card-quantity"]')
            quantity = quantity_el.inner_text().strip() if quantity_el else ""

            results.append({
                "name": name,
                "price": price,
                "quantity": quantity,
                "category": category,
            })
        except Exception as e:
            print(f"⚠️ Skipped card: {e}")

    return results

def scrape_alcampo():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        print(f"🌐 Visiting {CATEGORY_URL}")

        try:
            page.goto(CATEGORY_URL, timeout=60000)
            time.sleep(2)  # sayfanın yüklenmesi için küçük bekleme

            products = extract_product_data(page, "verduras-y-hortalizas")
            if not products:
                print("No products found.")
                return

            for product in products:
                insert_product(
                    product["name"],
                    product["price"],
                    product["category"],
                    "alcampo.es",
                    product["quantity"]
                )
                print(f"✅ {product['name']} — {product['price']}€ ({product['quantity']})")

        except Exception as e:
            print(f"❌ Failed: {e}")

        browser.close()

if __name__ == "__main__":
    scrape_alcampo()
