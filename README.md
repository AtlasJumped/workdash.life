# workdash.life

The work dashboard, clearly labeled Planned (mid to late 2027). Nothing here is built. The story comes from https://claudebomb.com. Start with the personal dashboard at https://personaldash.life.

Static site: `index.html`, `css/style.css`, `js/app.js`, `js/hmr-dock.js`, `favicon.svg`. No build step, no external fonts or CDNs.

- Part of the HMR family of websites: https://hmrfamily.life
- Design picker (bottom left): three looks and a four-level rating, stored in the browser's localStorage. `?design=1` to `?design=3` picks a look.
- `js/hmr-dock.js` is the shared bottom dock (Design, Funsies, React). It is copied from hmrfamily.life and replaced when that file is upgraded.
- Deploy: any static host. `CNAME` is set to `workdash.life`.
- Content comes only from pages that already exist on https://universemodel.ai and https://claudebomb.com. Claims are labeled as established science, HMR's view, or open.
- Join us on Discord: https://discord.gg/gEnC8TpNc
