# modorin portfolio — instructions for Claude

Personal portfolio of modorin (GitHub: modoriin79), an undergraduate in AI & Information Technology at Sejong University
and an undergraduate researcher at LAIN@Sejong Univ. Live at https://modoriin79.github.io/modorins_project_website/.
The owner writes requests in Korean; reply in Korean.

## How the site is built
- Static site, no build step, no dependencies. Open `index.html` or run `python -m http.server` in the repo.
- `content.js` — **all editable content**: `categories`, `projects`, `awards`, `studies` (each study has `notes`).
  Every field and a copy-paste template is documented in comments at the top of each list.
- `script.js` renders everything from `content.js` (filters, project cards, detail dialog, awards, study folders).
  Don't hardcode content in `index.html`; add a field to `content.js` and render it in `script.js` instead.
- `index.html` — page shell: header nav, hero (title, intro, GitHub/Lab/Email icon links), section containers, footer.
- `style.css` — layered: the original base rules first, then later blocks override them (`/* v2 */`, `/* v3 */`, ...).
  Add new rules in a new block at the end rather than editing the minified first lines.
  Note the global `border-radius: 0 !important` — the design is intentionally square.
- `cursor.js` + `cursor.svg` / `cursor-pointer.svg` — pixel-art cursor and the glowing trail canvas
  (disabled on touch devices and with reduced motion).
- Images: put new screenshots in `images/` and reference them as `./images/name.png`.

## Common requests
- **Add a project**: append an object to `projects` in `content.js` using the template; if the category is new, add it to
  `categories` too. If the user gives a screenshot, save it to `images/`.
- **Add an award**: add to the *front* of `awards` (newest first).
- **Add a study note**: add to the right topic's `notes`. A new topic = a new object in `studies`.
- **Design change**: new CSS block at the end of `style.css`; keep the black/white editorial look unless asked otherwise.

## Before you push
1. Check `content.js` still parses: `node -e "require('vm').runInNewContext(require('fs').readFileSync('content.js','utf8'),{window:{}})"`.
2. Preview locally and check desktop and phone (375px) widths; no horizontal scroll.
3. Commit with a short message and push to `main`. GitHub Actions (`.github/workflows/pages.yml`) deploys every file
   except `.git`, `.github`, `.claude` and `*.md`, so new files need no workflow change. Deploy takes about a minute.
