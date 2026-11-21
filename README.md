# Task Manager

A task management dashboard built with Angular 22, signals and PrimeNG. It was written as the
Senior Angular Developer assignment: a Kanban board with filters and search, create / edit /
delete, a dashboard with statistics, charts and an activity feed, and a mock REST backend.

**Live demo: https://mohamedsayedk.github.io/task-manager-luftborn/**
GitHub Pages hosts static files only, so the demo answers its own `/api` requests inside the
browser (see "The live demo" below). Changes you make last until you reload the page.

## Features

- **Kanban board** with three columns (To Do, In Progress, Done), task counts, overdue
  highlighting, and overdue tasks listed first until you place cards by hand.
- **Drag and drop:** drag a card to another column to change its status, or inside its column to
  reorder it. The order is saved. An empty column shows a short "No tasks here" hint.
- **Filters and search:** status tabs, priority and assignee dropdowns, and a debounced search over
  title and description. All filters combine.
- **Create, edit and delete** in a dialog (Reactive Forms with custom validators and a dynamic tags
  list). Deleting asks for confirmation.
- **Dashboard:** four statistic cards counted from the real tasks, two charts (tasks by priority
  and by status) and a recent activity feed.
- **App shell:** header with search, sidebar navigation, responsive down to phone width.
- **Loading skeletons, error messages with retry**, and HTTP response caching.
- **English and Arabic**, with right-to-left layout. A header button switches the language and the
  choice is remembered.
- **Accessibility:** no axe-core violations on any screen or open state (WCAG 2.1 AA), in English
  and in Arabic.

## Tech stack

| Area         | Choice                                                                     |
| ------------ | -------------------------------------------------------------------------- |
| Framework    | Angular 22, standalone components, signals, `httpResource`, zoneless-ready |
| UI           | PrimeNG 21 (Aura theme) with PrimeIcons, Chart.js through `p-chart`        |
| Drag & drop  | Angular CDK drag-drop (already a PrimeNG peer dependency)                  |
| State        | NgRx Signals and the NgRx Toolkit (`withResource`, `withMutations`)        |
| Forms        | Reactive Forms with custom validators                                      |
| i18n         | Transloco 8 with its ICU plugin (English, Arabic, right-to-left)           |
| Mock backend | JSON Server 1.0 beta                                                       |
| Delivery     | Docker (nginx and JSON Server) with docker-compose, GitHub Actions         |
| Tests        | Vitest through the Angular unit-test builder, jsdom, axe-core              |
| Architecture | Sheriff (module boundaries) and tsarch (naming and dependency rules)       |
| Code quality | ESLint (angular-eslint), Prettier, Husky with lint-staged                  |

## Getting started

**Prerequisites:** Node.js `^22.22.3`, `^24.15.0` or `>=26` (the Angular CLI 22 requirement) and
npm.

```bash
npm install
```

Run the mock API and the app in two terminals:

```bash
npm run mock:api   # JSON Server on http://localhost:3000
npm start          # builds the app and serves it on http://localhost:4200
```

`npm start` serves the **production build** (`scripts/serve-dist.mjs`): files are compressed
(Brotli or gzip), scripts and styles with a hash in their name are cached for a year, unknown
routes fall back to the app, and `/api/*` is forwarded to the mock API. This is what a real host
does, so what you see here, including a Lighthouse run, is what a deployment gives. To work on the
code use the dev server instead, with source maps and live reload:

```bash
npm run start:dev  # Angular dev server on http://localhost:4200
```

The dev server proxies `/api/*` to port 3000 (`proxy.conf.json`), so the app calls relative URLs
such as `/api/tasks`. Do not measure performance on the dev server: it sends the bundle
unminified and uncompressed (3.5 MB instead of 650 kB), and Lighthouse scores it around 60 on
desktop.

JSON Server rewrites `mock-api/db.json` on every write. To reset the data with fresh dates:

```bash
npm run mock:generate
```

### Environment configuration

The app has no `.env` file and no secrets: it always calls the relative URL `/api`, and whatever
serves it decides where that goes. Nothing in the browser bundle changes between environments.

| Where               | How `/api` is reached                                        | Settings                                                                                      |
| ------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `npm run start:dev` | The Angular dev server proxies it to `http://localhost:3000` | Target in `proxy.conf.json`                                                                   |
| `npm start`         | `scripts/serve-dist.mjs` forwards it to the mock API         | Environment variables `PORT` (default `4200`) and `API_URL` (default `http://localhost:3000`) |
| `docker compose up` | nginx forwards it to the `api` container                     | App on port `8080`, set in `docker-compose.yml`; proxy in `docker/nginx.conf`                 |
| GitHub Pages demo   | An interceptor answers it inside the browser                 | `demo` build configuration in `angular.json`                                                  |

Build configurations in `angular.json`: `production` (the default for `ng build`), `development`
(used by `ng serve` and `npm run watch`) and `demo` (production plus the in-browser backend). Node.js
and npm versions are listed under "Prerequisites".

### The live demo

The site above is built by `.github/workflows/pages.yml` on every push to `main`, with the `demo`
configuration of `angular.json`. That configuration replaces `src/app/api-backend.ts`, an empty list
of interceptors, with `api-backend.demo.ts`. Its HTTP interceptor (`src/app/demo/`) answers every
`/api/...` request in the browser from `mock-api/db.json`, with JSON Server's rules for `_where`
filters, `_sort`, paging and writes, and a short delay so loading states show. The normal build does
not contain this code. The data is regenerated by every build, and by a weekly one, so that the
relative dates ("due in 3 days") do not drift. To build it locally:

```bash
npx ng build --configuration demo
```

### With Docker

One command builds and starts everything, the app behind nginx and the mock backend:

```bash
docker compose up --build
```

Then open http://localhost:8080. The `web` image serves the production build and proxies `/api`
to the `api` image (JSON Server), which waits until the API answers before the app starts. nginx
compresses the files and lets browsers keep the content-hashed scripts and styles for a year. The
data lives inside the `api` container, so it starts fresh whenever the container is created again.
`docker compose down` stops it.

## Scripts

| Script                  | What it does                                                           |
| ----------------------- | ---------------------------------------------------------------------- |
| `npm start`             | Build, then serve the production build with the API proxy              |
| `npm run serve`         | Serve the existing build again (without building)                      |
| `npm run start:dev`     | Angular dev server with source maps and live reload                    |
| `npm run mock:api`      | Mock REST API on port 3000                                             |
| `npm run mock:generate` | Regenerate the mock data with fresh dates                              |
| `npm test`              | Unit tests in watch mode                                               |
| `npm run test:coverage` | Unit tests once, with coverage and the 80% threshold                   |
| `npm run test:arch`     | Architecture tests (dependency and naming rules)                       |
| `npm run sheriff`       | Module boundary check                                                  |
| `npm run lint`          | ESLint (`lint:fix` applies fixes)                                      |
| `npm run format`        | Prettier (`format:check` only checks)                                  |
| `npm run build`         | Production build                                                       |
| `npm run ci`            | Everything: Sheriff, arch tests, lint, format check, unit tests, build |

A Husky pre-commit hook runs ESLint and Prettier on the staged files (lint-staged).

## Architecture

### Folders and domains

```
src/app/
  tasks/       task board, filters, create / edit / delete
  dashboard/   statistics cards, charts, activity feed
  shared/      technical code used by more than one domain (HTTP cache)
  app-*.ts, *-page.ts   shell, header, sidebar and the screens that compose the features
```

Each domain is split into layers: `feature-*` (smart components), `ui` (presentational
components), `data` (stores, clients, types) and `util` (pure functions). The import direction is
`feature → ui → data → util`, and a domain only sees itself and `shared`.

Two tools enforce this in `npm run ci`:

- **Sheriff** (`sheriff.config.ts`) checks domain and layer boundaries.
- **tsarch tests** (`arch/`) check what Sheriff cannot express: no import cycles, only stores
  use data clients, only smart components and coordinators use stores, stores never use other
  stores, and presentational components never use smart ones.

### State management

- **Signal stores** (`@ngrx/signals`) each have one job: a search store (`TaskSearchStore`), a
  detail and edit store (`TaskDetailStore`), or a lookup store. Reads use `httpResource` through
  `withResource`, writes use `withMutations`.
- **Clients** (`TaskClient`, `DashboardClient`, `ActivityClient`) are stateless. They only describe
  requests, and only stores call them.
- **Coordinator:** `DashboardCoordinator` combines two stores into the views the dashboard shows.
  A store never depends on another store.
- **Smart and dumb components:** smart components (`TaskSearch`, `TaskEdit`,
  `StatisticsOverview`, ...) talk to stores. Dumb ones (`TaskCard`, `TaskColumn`, `TaskForm`,
  `StatCardView`) only take inputs and emit outputs.

### How features talk without importing each other

- **The router is the contract between header and board.** The header search writes `?q=`, the
  board reads it as an input. The sidebar "New Task" link uses `?newTask=true`.
- **The board and the edit dialog** are separate features composed by `TasksPage`. They share
  `TaskDetailStore`, which counts successful writes so the board knows when to reload.
- **The dashboard keeps its own small view of tasks** (status, priority, due date), so the
  `tasks` and `dashboard` domains never import each other. It reloads by itself after a task
  write through a change counter in the shared HTTP cache.
- **Activity log:** every successful create, update or delete records an entry in `/activity`.
  A failed log never fails the task change.

### Decisions

| Decision                                                                                                 | Why                                                                                                                        |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| PrimeNG **21**, not 22                                                                                   | PrimeNG 22 shows a red "Invalid PrimeUI License" banner without a license key. 21 is MIT.                                  |
| `overrides` in `package.json` for PrimeNG's Angular peers                                                | PrimeNG 21 declares Angular 21 peers. It works on Angular 22 here, but it is an unsupported combination (see limitations). |
| Board is Kanban without paging; one request for up to 200 tasks, grouped in the client                   | The design shows all tasks grouped by status with per-column counts.                                                       |
| All filters and the search go into one `_where` JSON parameter                                           | JSON Server 1.0 beta ignores plain filter params once `_where` is present, and `q` and `_start` do not work.               |
| Statistic cards are **counted from the tasks**                                                           | The static `/statistics` file (156 / 89 / 42 / 25) contradicts the board. Its icon, color and change text are still used.  |
| Reactive Forms, never Signal Forms                                                                       | The assignment asks for Reactive Forms with custom validators and dynamic controls.                                        |
| HTTP cache: GET responses for 60 s, a successful write clears that collection                            | Required caching, simple and safe. Errors are never cached.                                                                |
| Overdue tasks first (until cards are placed by hand), disabled Calendar / Team / Settings, header search | Taken from the Figma, not from the assignment text.                                                                        |

## Forms

The task form validates the title (required, 3 to 100 characters), description (up to 500), due
date (required, and not in the past for a new task through a custom validator) and assignee
(required). Tags are a dynamic `FormArray` with add and remove. Errors show after the first
submit or touch, with `role="alert"` and `aria-describedby`.

## Internationalization

The app speaks English and Arabic. Arabic is written right to left.

- **Texts** live in typed catalogs, `src/app/i18n/en.ts` and `ar.ts`. `ar.ts` has the type of
  `en.ts`, so a missing or extra key is a compile error. Plurals and values use the ICU message
  format (the Transloco ICU plugin), which gives Arabic its six plural forms: "مهمتان" for two
  tasks, "مهام" for three to ten.
- **Templates** use the `transloco` pipe. Labels that are data (dropdown options, chart labels)
  use a small `injectTranslate()` helper that translates again after a language change.
  Utilities such as the due-date and activity text return a message key and its values, so they
  stay free of any language.
- **`Language`** (`src/app/i18n/language.ts`) starts with the saved choice, else the browser
  language, else English. It sets `lang` and `dir` on `<html>` and tells Transloco. Each language is
  its own lazy chunk, so a visitor only downloads the one in use.
- **Also translated:** the browser tab title (`TranslatedTitleStrategy`), PrimeNG's own texts such
  as "No results found" (`PrimeNgTranslation`), and every accessible name.
- **Right to left** uses CSS logical properties (`margin-inline-start`, `border-inline-end`, ...),
  so one stylesheet serves both directions. The mobile drawer slides in from the right.
- **Not translated, by design:** the mock API's data (task titles, descriptions, tags, people).
  They are data, not interface text.

To add a language: add its code to `LANGUAGES` in `language.ts`, create a catalog typed as
`Messages`, add it to `translation-loader.ts` and to `availableLangs` in `app.config.ts` and in
`src/app/testing/translations.ts`.

## Performance

- Every component uses `ChangeDetectionStrategy.OnPush`, `@for` blocks use `track`, and state is
  signals and `computed`.
- Routes are lazy loaded. The initial bundle is about 666 kB (161 kB transferred), which is over
  the 500 kB budget warning in `angular.json` (the build only warns). It was about 572 kB before
  Transloco and its ICU plugin were added. The plugin's `@messageformat/core` is a single 93 kB
  file that is not an ES module (the build warns about that too). The analytics screen, which
  carries Chart.js, is its own chunk (about 217 kB, 65 kB transferred).
- **Start-up weight:** the PrimeNG theme contains only the design tokens of the components the app
  uses (the full Aura preset carries about 90), English is part of the main bundle so the first
  screen does not wait for a second request, and Arabic is a separate chunk.
- **Layout shift:** the header has a fixed height, because PrimeNG adds the styles of the search
  box a moment after the first paint and a header that then grows pushed the page down.
- **Motion** is subtle (cards and screens fade in, hover lifts, color eases) and switched off for
  people who prefer reduced motion.
- GET responses are cached for 60 seconds, and writes invalidate only the collection they change.
  The board and the dashboard ask for the same task list, so the second request is free.
- Search waits 300 ms after typing stops. `httpResource` cancels a request when a newer one
  replaces it.

### Lighthouse

Measured with Lighthouse 13 in headless Chrome against `npm start` (and, with the same result,
the Docker stack), on the dashboard route:

| Profile                         | Performance | Accessibility | Best practices | SEO |
| ------------------------------- | ----------- | ------------- | -------------- | --- |
| Desktop                         | 100         | 100           | 100            | 100 |
| Mobile (slow 4G, 4x slower CPU) | 71 to 73    | 100           | 100            | 100 |

The live site on GitHub Pages scores 99 on desktop and 80 on mobile (100 in the other three
categories), because GitHub's servers are close and fast.

Desktop: first contentful paint 0.2 s, largest contentful paint 0.8 s, blocking time 20 to 60 ms,
layout shift 0.003. On the mobile profile the largest contentful paint is about 3.7 s and the
blocking time about 650 to 760 ms. They come from the weight of Angular, PrimeNG and the board (the
analytics screen, which has no board, scores 83), not from one fixable problem: removing the
per-card menu changed nothing, and without the entrance animations the score was lower. Getting
mobile above 90 would take pre-rendering the shell, dropping the ICU library (about 93 kB) or
rendering fewer cards at first. The first measurement had SEO at 82 (no meta description, no
valid `robots.txt`) and a layout shift of 0.15 on desktop, both fixed.

## Accessibility

axe-core 4.14 reports no violations on the Dashboard, Tasks and Analytics screens, nor on the card
menu, filter dropdowns, create / edit dialog and delete confirmation, including color contrast.
Dialogs close on Esc and return focus to the button that opened them. Charts come with a text
legend that holds the same numbers. axe also runs inside the unit tests (everything except color
contrast, which needs a real browser), on every screen in Arabic as well. In a real browser axe
also found nothing in Arabic on the three screens, the select overlay, the card menu, the delete
confirmation, the create dialog with errors and the open mobile drawer, in light and dark mode.
A screen reader pass has not been done.

## Testing strategy

- **Test first.** New behavior was built red, green, refactor, one test at a time.
- **Through the DOM, with HTTP as the only mock.** Component tests render the real component with
  real stores and answer requests through `HttpTestingController`. They check what a user sees and
  what is sent, not internals.
- **Pure logic** (due dates, counting, validators, activity text, the HTTP cache) has direct unit
  tests.
- **Architecture tests** guard the dependency and naming rules.
- **Accessibility tests** run axe on whole screens and open dialogs.
- **Continuous integration:** a GitHub Actions workflow (`.github/workflows/ci.yml`) runs `npm run ci`
  on every push and pull request (boundaries, architecture tests, ESLint, Prettier, unit tests with
  the 80% threshold, production build), checks that the static server answers, keeps the coverage
  report, and has a second job that builds the Docker images, starts the stack and checks that the
  app and the API answer. Its first run on GitHub found a real test-isolation bug (a test that
  switched to Arabic leaked the choice through `localStorage` on Node 24 only), now fixed.
- **Coverage** (`npm run test:coverage`, 349 tests): 97.9% statements, 95.3% branches, 98.3%
  functions, 97.8% lines. The build fails below 80%. `app.config.ts` and `app.routes.ts` (pure
  configuration) and test helpers are excluded.

## Code quality

- ESLint with angular-eslint (including template accessibility rules). The rules add OnPush on
  every component and no `any`.
- Prettier, with `npm run format:check` in `npm run ci`.
- Husky and lint-staged run ESLint and Prettier on staged files before each commit.
- `CLAUDE.md` and the two architecture documents in `docs/` hold the rules the code follows. The project was built
  with an AI coding assistant working under those rules, with the architecture checks as a safety
  net.

## Known limitations and future improvements

**Known limitations**

- **PrimeNG 21 runs on Angular 22 through `overrides` in `package.json`.** That combination is not
  officially supported. It works in the tests and in the browser for every component the app uses.
  PrimeNG 22 would need a license key. The fallback would be Angular Material.
- **The board has no paging.** It asks for up to 200 tasks at once and groups them in the client.
  Beyond 200 tasks the board would need paging or a column-by-column load.
- **Drag and drop has no keyboard or screen-reader way to reorder cards.** The status of a task can
  still be changed in the edit dialog. Touch dragging (a card starts moving after a short press)
  was not tried on a real touch device.
- **A screen reader pass has not been done.** The accessibility checks are automated (axe-core and
  Lighthouse).
- **Mobile Lighthouse performance is 71 to 73 locally and 80 on the live site.** Desktop is 100
  (see "Lighthouse").
- **The initial bundle is about 666 kB**, over the 500 kB warning in `angular.json`. The build
  warns and does not fail.
- **The backend is a mock.** JSON Server 1.0 is a beta, there is no authentication, and the data
  has no owner. In the live demo, changes last until the page is reloaded.
- **Calendar, Team and Settings** appear in the sidebar as disabled items, as in the design.
- **`injectTranslate()` exists twice** (`tasks/util` and `dashboard/util`), because two domains may
  not import each other.

**Future improvements**

- A card menu with Move up, Move down and Move to column, which gives drag and drop a keyboard
  alternative and helps touch screens.
- Pre-render the app shell and drop the ICU library to lift the mobile score above 90.
- End-to-end tests (for example Playwright) on top of the unit and architecture tests.
- A real backend with authentication, so tasks belong to users, and server-side paging.
- Move `injectTranslate()` into `shared` and remove the copy.

## More documentation

- `docs/architecture-boundaries.md` and `docs/architecture-state-management.md`: the rules.
