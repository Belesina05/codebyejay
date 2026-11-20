# Personal Portfolio Website

A responsive portfolio website built with HTML, CSS, and vanilla JavaScript. No build step or database required.

## Run in Visual Studio Code

1. Extract the ZIP.
2. Open the `frontier-portfolio` folder in Visual Studio Code (**File → Open Folder**).
3. Install the **Live Server** VS Code extension (optional but recommended).
4. Right-click `index.html` → **Open with Live Server**, or open `index.html` directly in a browser.

## Customize before publishing

- `index.html`: Replace **Your Name**, the placeholder biography, job history, sample projects, and social URLs.
- `index.html` and `script.js`: Replace **hello@example.com** with your actual email address. Both files contain this placeholder.
- `index.html`: Replace example project links (`#contact`) with real live demos or GitHub repository links when available.
- `styles.css`: Edit the `:root` color variables for your brand.
- `script.js`: Edit the `roles` array to change rotating hero text.

**Important:** The four example projects are concepts, not claims of completed work. Replace them with your actual projects before sharing your portfolio.

## Contact form

The contact form validates fields and opens the visitor's default email application using `mailto:`. It does not submit to a server, send email automatically, or store any messages. For production server-side delivery, integrate a form service or a secure backend.

## Files

- `index.html` — content and page structure
- `styles.css` — responsive layout, colors, typography, animations
- `script.js` — mobile menu, theme toggle, project filtering, animations, contact form

## Publish

Upload the files to GitHub Pages, Netlify, or any static website host. Ensure you replace placeholders and test contact links first.
