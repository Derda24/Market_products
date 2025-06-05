import asyncio
from playwright.async_api import async_playwright
from scraper.utils.db import insert_product
from scraper.utils.logging import log_debug_message

# Fake user-agent and locale to appear more human
STEALTH_CONTEXT_CONFIG = {
    "user_agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "locale": "es-ES",
    "viewport": {"width": 1280, "height": 800},
    "timezone_id": "Europe/Madrid"
}

# Optional proxy config (replace with your proxy if needed)
PROXY = {
    "server": "http://your-proxy-address:port",  # ← UPDATE THIS
    "username": "your-username",                 # ← if needed
    "password": "your-password"                  # ← if needed
}

def get_categories_by_store(store_id):
    return [
        {"name": "Fruits", "url": "https://www.carrefour.es/supermercado/fruta/cat20010/c"},
        {"name": "Vegetables", "url": "https://www.carrefour.es/supermercado/verdura/cat20011/c"},
    ]

async def scroll_page(page, times=5, delay=1):
    for i in range(times):
        await page.mouse.wheel(0, 3000)
        await asyncio.sleep(delay)
        log_debug_message(f"🔄 Scroll {i + 1}/{times} completed...")

async def scrape_category(page, category_url, category_name):
    await page.goto(category_url, timeout=60000)
    await page.wait_for_load_state("domcontentloaded")
    await scroll_page(page)

    html = await page.content()
    with open(f"{category_name.lower()}_dump.html", "w", encoding="utf-8") as f:
        f.write(html)

    products = await page.query_selector_all("li.product-card")

    log_debug_message(f"🛒 Found {len(products)} products in {category_name}")

    for product in products:
        try:
            name_el = await product.query_selector("h2")
            price_el = await product.query_selector(".product-card-price__price")

            name = await name_el.inner_text() if name_el else "N/A"
            price_text = await price_el.inner_text() if price_el else "0"

            try:
                price = float(price_text.replace("€", "").replace(",", ".").strip())
            except ValueError:
                price = 0.0

            await insert_product(
                name=name.strip(),
                price=price,
                category=category_name,
                store_id="carrefour",
                quantity="1"
            )
            log_debug_message(f"✅ Inserted: {name} - {price}€")

        except Exception as e:
            log_debug_message(f"❌ Product parse error: {e}")

async def scrape_carrefour():
    categories = get_categories_by_store("carrefour")

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,
            proxy=PROXY  # remove or customize if not using proxy
        )

        context = await browser.new_context(**STEALTH_CONTEXT_CONFIG)
        page = await context.new_page()

        for cat in categories:
            log_debug_message(f"🔎 Scraping category: {cat['name']}")
            try:
                await scrape_category(page, cat["url"], cat["name"])
            except Exception as e:
                log_debug_message(f"❌ Failed to scrape {cat['name']}: {e}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(scrape_carrefour())
