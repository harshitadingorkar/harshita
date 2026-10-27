# Editing the portfolio

## Open edit mode

On the home page or any collection page, add `?edit` to the address. You can also press **Shift + E** to turn edit mode on or off.
After visiting with `?edit` once, a quiet **edit** button stays in the home page’s bottom-right corner.

In edit mode, drag a dot on the map to move it. Click supported text to rewrite it. Use **Save** to keep the changes in this browser. They stay here until you reset them.

## Download your changes

Choose **Download** in the edit toolbar to save an `overrides.json` file to your computer. Keep this file somewhere safe; it contains your edits.

## Publish the edits

To publish the changes with the site:

1. Open the site repository on github.com.
2. Open the `data` folder.
3. Choose **Add file → Upload files**.
4. Upload `overrides.json` and commit the change.

The site reads `data/overrides.json` when each page loads. You can use **Reset** or the **local edits · reset** chip to remove the browser's saved version.

## Comment on the mirror, then go live

A private Claude artifact mirrors this site: https://claude.ai/artifact/W7QyHL9qk37zaCD6dpKH1o

1. Open the mirror, leave comments on the things you want changed, and send them to Claude.
2. Claude makes the changes here, pushes to `main` (GitHub Pages publishes https://harshitadingorkar.github.io/harshita/), and republishes the mirror so it matches.

To rebuild the mirror's page and file lists by hand: `python3 scripts/artifact-page.py` (writes `.artifact/`, which git ignores).
The mirror can't reach outside services, so the live weather and the live Are.na refresh fall back to the saved data there.
