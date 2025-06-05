from playwright.sync_api import sync_playwright
from utils.db import insert_product
from utils.proxy_handler import get_browser_with_proxy

def scrape_mercadona():
    with sync_playwright() as p:
        browser = get_browser_with_proxy(p)
        page = browser.new_page()
        
        page.goto("https://tienda.mercadona.es/")
        print("✅ Sayfa başarıyla açıldı!")

        page.wait_for_load_state("networkidle", timeout=120000)

        # Ürün kartlarının yüklenmesini bekle
        page.wait_for_selector('.product-cell', timeout=60000)

        products = page.query_selector_all(".product-cell")
        print(f"🔎 Bulunan ürün sayısı: {len(products)}")

        for product in products:
            try:
                # Ürün adı
                name_element = product.query_selector(".product-cell__description-name")
                if not name_element:
                    print("⚠️ Ürün adı bulunamadı!")
                    continue
                name = name_element.inner_text().strip()

                # Fiyatı farklı biçimlerde aramayı dene
                price_element = product.query_selector(".product-price__unit-price")  # Alternatif fiyat alanı
                if not price_element:
                    price_element = product.query_selector(".product-cell__price-price")  # Eski denediğimiz

                if not price_element:
                    print(f"⚠️ '{name}' ürününün fiyatı bulunamadı!")
                    continue

                price_text = price_element.inner_text().strip()

                if not price_text:
                    print(f"⚠️ '{name}' ürününün fiyatı boş geldi!")
                    continue

                price = float(price_text.replace("€", "").replace(",", ".").strip())

                # Supabase'e kaydet
                insert_product(name, price, "mercadona.es")
                print(f"✅ Ürün: {name}, Fiyat: {price}€")

            except Exception as e:
                print(f"⚠️ Ürün çekilemedi: {e}")
                continue
        
        browser.close()

# Fonksiyonu çalıştır
scrape_mercadona()
