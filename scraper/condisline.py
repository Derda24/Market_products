import time
import re
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from utils.db import insert_product
from utils.logger import log

BASE_URL = "https://www.condisline.com"

# Known working Alimentación category URLs
ALIMENTACION_CATEGORIES = [
    ("Aceite y vinagre", urljoin(BASE_URL, "/Alimentacion_Aceite-y-vinagre_c01_cat00020001_cat_es_ES.jsp")),
    ("Sal, salsas y especias", urljoin(BASE_URL, "/Alimentacion_Sal-salsas-y-especias_c01_cat00020004_cat_es_ES.jsp")),
    ("Arroz, pasta y legumbres", urljoin(BASE_URL, "/Alimentacion_Arroz-pasta-y-legumbres-secas_c01_cat00090001_cat_es_ES.jsp")),
    ("Panes, harinas y masas", urljoin(BASE_URL, "/Alimentacion_Panes-harinas-y-masas_c01_cat00190004_cat_es_ES.jsp")),
    ("Caldo y cremas", urljoin(BASE_URL, "/Alimentacion_Caldos-cremas-y-pures_c01_cat00260001_cat_es_ES.jsp"))
]

HEADLESS = True


def normalize_price(text: str) -> float:
    # Remove currency symbols and normalize decimal comma to dot
    cleaned = re.sub(r"[^0-9,\\.]", "", text)
    cleaned = cleaned.replace('.', '').replace(',', '.')
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def scrape_category(category_name, category_url):
    log(f"🌐 Visiting category: {category_name} → {category_url}")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=HEADLESS)
        page = browser.new_page()
        try:
            page.goto(category_url, timeout=60000, wait_until='domcontentloaded')
            # scroll to bottom to load lazy content
            prev = None
            while True:
                page.keyboard.press('End')
                time.sleep(1)
                curr = page.evaluate('document.body.scrollHeight')
                if curr == prev:
                    break
                prev = curr

            html = page.content()
            # save debug
            fn = f"condisline_{category_name.replace(' ', '_')}_debug.html"
            with open(fn, 'w', encoding='utf-8') as f:
                f.write(html)
            log(f"💾 HTML saved as {fn}")

            soup = BeautifulSoup(html, 'html.parser')
            # new selector: list items in carousel
            items = soup.select('ul.articles_list li.article')
            log(f"🔎 Found {len(items)} products in '{category_name}'")

            for item in items:
                try:
                    # Name and link
                    title_el = item.select_one('a.article_name span[itemprop="name"]')
                    name = title_el.text.strip() if title_el else ''
                    # Brand optional
                    brand_el = item.select_one('span[itemprop="brand"]')
                    brand = brand_el.text.strip() if brand_el else ''
                    # Price
                    price_el = item.select_one('div.article_price_container span.article_price')
                    price = normalize_price(price_el.text) if price_el else 0.0
                    # Unit price / PUM
                    pum_el = item.select_one('div.article_pum span')
                    quantity = pum_el.text.strip() if pum_el else ''

                    full_name = f"{brand} {name}".strip()
                    insert_product(
                        name=full_name,
                        price=price,
                        category=category_name,
                        store_id="condisline",
                        quantity=quantity
                    )
                    log(f"✅ Inserted: {full_name} — {price} [ {quantity} ]")
                except Exception as e:
                    log(f"❌ Failed to parse or insert product: {e}")
        except Exception as e:
            log(f"❌ Error loading or parsing page '{category_name}': {e}")
        finally:
            browser.close()


def main():
    log("🚀 Starting Condisline scraper")
    for name, url in ALIMENTACION_CATEGORIES:
        scrape_category(name, url)

if __name__ == '__main__':
    main()
