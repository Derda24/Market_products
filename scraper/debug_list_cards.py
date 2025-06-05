from playwright.sync_api import sync_playwright
from utils.db import insert_product
import json, html

CATEGORY_URL = "https://www.elcorteingles.es/supermercado/alimentacion/"

def scrape_elcorte_food():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/122.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1280, "height": 800},
            locale="es-ES",
        )
        page = context.new_page()

        # 1) Load category page & accept cookies
        page.goto(CATEGORY_URL, timeout=60000)
        page.wait_for_timeout(5000)
        try:
            page.click("button:has-text('Aceptar')", timeout=3000)
        except:
            pass

        # 2) Scroll to trigger lazy load
        for _ in range(10):
            page.mouse.wheel(0, 1000)
            page.wait_for_timeout(500)

        # 3) Scrape each product card
        cards = page.query_selector_all("div.js-product")
        print(f"🔎 Found {len(cards)} product cards.")

        for card in cards:
            try:
                raw = card.get_attribute("data-json")
                data = json.loads(html.unescape(raw))

                name     = data["name"]
                price    = float(data["price"]["final"])
                qty_val  = data.get("quantity", "")
                # assume grams if numeric; adjust if units differ
                quantity = f"{qty_val} g" if qty_val.isdigit() else qty_val

                insert_product(
                    name,
                    price,
                    "alimentacion",
                    "elcorteingles.es",
                    quantity
                )
                print(f"✅ {name} — {price}€ ({quantity})")

            except Exception as e:
                print(f"⚠️ Skipped a card: {e}")
                continue

        browser.close()

if __name__ == "__main__":
    scrape_elcorte_food()
