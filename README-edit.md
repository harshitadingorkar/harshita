# Editing the portfolio

## Open edit mode

On the home page or any collection page, add `?edit` to the address. You can also press **Shift + E** to turn edit mode on or off.

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
