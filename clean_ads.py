
import os
import re
from bs4 import BeautifulSoup

# Configuration
TARGET_DIR = r"C:\Users\OMU\.gemini\antigravity\scratch\OMNIX EMPIRE PROJECT\OMNIX LIV"
AD_DOMAINS = [
    "troopinvariably.com",
    "checkupoceandip.com",
    "al5sm.com",
    "cutterbewilderedvile.com",
    "disable-devtool"
]

def clean_html_file(filepath):
    """Removes ads and anti-adblock scripts from an HTML file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return

    soup = BeautifulSoup(content, 'html.parser')

    # 1. Remove scripts from known ad domains
    scripts = soup.find_all('script')
    for script in scripts:
        # Check source attribute
        if script.get('src'):
            src = script['src']
            if any(domain in src for domain in AD_DOMAINS):
                print(f"  Removing ad script: {src}")
                script.decompose()
                continue # Skip to next script if removed
        
        # Check script content (for inline scripts loading ads)
        if script.string:
            found_domain = None
            for domain in AD_DOMAINS:
                if domain in script.string:
                    found_domain = domain
                    break
            
            if found_domain:
                print(f"  Removing inline ad script containing {found_domain}")
                script.decompose()

    # 2. Remove scripts with atOptions (inline ad configs)
    # Re-fetch scripts as some might have been removed
    scripts = soup.find_all('script') 
    for script in scripts:
        if script.string and 'atOptions' in script.string:
             print("  Removing atOptions script")
             script.decompose()

    # 3. Remove ad containers
    for div in soup.find_all('div', class_=['ad-container', 'adb']):
        print(f"  Removing ad div: class={div.get('class')}")
        div.decompose()

    # 4. Remove anti-adblock logic (detectAdblock, detectBraveShields)
    scripts = soup.find_all('script')
    for script in scripts:
        if script.string:
            if 'detectAdblock' in script.string or 'detectBraveShields' in script.string:
                 print("  Removing anti-adblock script block")
                 script.decompose()
            elif 'showPopup' in script.string and 'adb' in script.string:
                 print("  Removing popup logic script")
                 script.decompose()

    # 5. Remove specific anti-adblock styles
    styles = soup.find_all('style')
    for style in styles:
        if style.string and ('.adb' in style.string or '.adbs' in style.string):
            print("  Removing anti-adblock styles")
            style.decompose()
            
    # Write back the cleaned file
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(str(soup.prettify()))  # Using prettify might reformat, but ensures valid HTML
        print(f"Successfully cleaned: {os.path.basename(filepath)}")
    except Exception as e:
        print(f"Error writing {filepath}: {e}")

def main():
    print(f"Scanning directory: {TARGET_DIR}")
    for filename in os.listdir(TARGET_DIR):
        if filename.endswith(".html"):
            filepath = os.path.join(TARGET_DIR, filename)
            print(f"Processing {filename}...")
            clean_html_file(filepath)
    print("Done.")

if __name__ == "__main__":
    main()
