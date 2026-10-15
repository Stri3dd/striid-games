# STRIID Games

Responsive browser games portal for **games.striid.uk**. Dark game wall, local SVG icons, genres, search, personal favourites, recent games, random selection, and community rankings backed by Cloudflare D1.

## Hosting

The existing `striid-games` Cloudflare Worker is linked to this repository's `main` branch. Its deploy command is `npx wrangler deploy`. `wrangler.jsonc` runs `npm run build` and uploads `dist/`; `worker.mjs` handles `/api/*`. The custom domain is already configured in Cloudflare.

```
npm ci
npm test
npm run build
npx wrangler deploy --dry-run
```

Local preview: Node 22.13+ and `npm run dev`, then http://127.0.0.1:4173. Preview likes use a separate local SQLite database in ignored `.cache/`; they never appear in production rankings.

## Community votes

Create D1 database `striid-games-community`. Declare it in `wrangler.jsonc` under `d1_databases` with binding `COMMUNITY_DB`, database_name, and the real database_id. Redeploy. Tables initialize on the first API request; equivalent schema is in `migrations/0001_votes.sql`.

Likes use a browser cookie and shared counts, with one active like per browser/game, idempotent writes, known-game validation, same-origin POST checks and a basic hourly rate limit. Raw IP addresses are not stored by this application. Anonymous likes are not verified unique-human votes. Optional `VOTE_SALT` may be set as a Worker secret.

If D1 is absent or unavailable, the site reports that voting is not connected. No fabricated rankings are shown. Personal favourites remain available.

## Catalogue

`config/catalogue.json` contains 2,329 entries: 2,132 distinct Classroom 6x listings, 196 non-overlapping existing entries, and the owner-supplied Eaglercraft build. Imported 15 October 2026. Genre classification is heuristic and editable.

Classroom game documents are resolved on demand from known source URLs. They are served in isolated frames without same-origin, pop-up, or top-navigation privileges. Third-party games cannot access portal cookies or local storage. Provider changes, Flash compatibility, offline services and sandbox restrictions can prevent some games from working. Each listing retains a source link. Catalogue inclusion does not mean every game has been tested.

**8 Ball Pool** uses an original local two-player game at `/games/pool/`: ball physics, aiming, power, pockets, group assignment and simplified 8-ball rules. Aim, hold on the table or cue, pull backwards along the cue and release to shoot. Pull distance controls power; a short tap only sets aim. Mouse and touch use pointer capture, and keyboard/button controls remain available below the table. It has no online matchmaking.

Each game has a local icon: 2,303 artwork thumbnails and 26 individual title icons. Artwork sources are recorded in `config/icon-sources.json`, including Classroom 6x, Parcoil and [GN-Math covers](https://github.com/gn-math/covers). Run `python tools/import_icons.py` with Pillow installed to refresh icons. The catalogue importer preserves cached icons.

## Eaglercraft

The supplied ZIP contains a client identifying itself as **26.3**, hosted at `/eagler/`. The original 78,037,659 bytes are split across four files below Cloudflare's per-file limit and streamed through a same-origin client endpoint. Automated packaging checks verify SHA-256 for each part and the complete document. `.gitattributes` prevents newline conversion of those files.

Repackage with `python tools/package_eagler.py path/to/eaglercraft26-3.zip`. The supplied client is otherwise unchanged. Use a modern desktop browser with keyboard and mouse; successful download does not guarantee gameplay on every device.

## Credits

Original template: **a site by [Parcoil Network](https://parcoil.dev)**. Catalogue: [Classroom 6x](https://sites.google.com/view/classroom6x/). Game names, artwork, assets and trademarks belong to their owners. STRIID is independent of those providers and of Mojang/Microsoft. The original template requested retaining its credit, which remains in the footer and about page.
