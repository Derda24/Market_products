def get_browser_with_proxy(p):
    return p.chromium.launch(headless=True)
