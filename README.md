# Daymark

Daymark is a small offline time-box planner for choosing a few meaningful focus blocks and seeing a day through to completion.

It is intentionally local-first: there is no account, server, analytics, or network dependency. Your plan is stored in the browser's local storage on the device where you use it.

## Features

- Add focus blocks with a title, duration, and optional label.
- Mark blocks complete and see planned, finished, and remaining time.
- Remove individual blocks or clear all finished blocks.
- Restore a valid saved plan safely, even if stored data is malformed.
- Responsive, keyboard-friendly interface with no build step.
- Pure JavaScript domain logic covered by automated tests.

## Run it

Open `index.html` directly in a modern browser, or serve this folder locally:

```text
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Test it

The project uses Node's built-in test runner and has no third-party dependencies:

```text
npm test
npm run check
```

## Project shape

- `index.html` — accessible page structure.
- `styles.css` — responsive visual system.
- `app.js` — browser state, rendering, persistence, and interactions.
- `src/daymark.js` — framework-free planner rules.
- `tests/daymark.test.js` — behavior tests for the planner rules.
