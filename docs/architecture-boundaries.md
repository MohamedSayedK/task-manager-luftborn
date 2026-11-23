# Architecture Rules

## Goal

This document defines the architecture rules for this repository. Both agents and
developers are required to adhere to these rules whenever they modify application code.

## Reference Implementations

- Model new features after `TaskSearch` and `TaskEdit` in terms of structure and style.
  These are the first features to be built. Until they exist, follow the rules in this
  document and in `docs/architecture-state-management.md`.

## Domains and Folder Structure

- Layout: `src/app/<domain>/<layer>`, where `<layer>` is `feature-<name>`, `ui`, `data` or `util`.
- Every component lives in a folder named after it, inside its layer folder
  (e.g., `tasks/ui/task-card/`), together with its template (`.html`), styles (`.scss`) and spec.
  A store used by one smart component only sits in that component's folder.
  Root components follow the same naming: `src/app/feature-shell/<name>/` (header, sidebar) and
  `src/app/feature-pages/<name>/` (screens). `app.ts`, `app.config.ts` and `app.routes.ts` stay in
  `src/app`, other root code gets a folder (`theme/`, `i18n/`, `backend/`).
  Never create a `feature-*` folder inside another folder of `src/app` that is not a domain:
  Sheriff would read the outer folder as a domain.
- Domains:
  - `tasks`: task CRUD, search, filtering, drag and drop, assignee lookup.
  - `dashboard`: statistics cards, analytics charts, recent activity feed.
  - `shared`: technical code reused across domains (e.g., HTTP caching interceptor).
- The app root (`src/app/*.ts`: shell, routes, config) may import any domain.
- Domain and layer rules are encoded in `sheriff.config.ts`. Run `npm run sheriff` to verify them.
- Rules Sheriff cannot express live in `arch/` (tsarch + Vitest) and run with
  `npm run test:arch`: no cycles, suffix-based access rules (only stores use `*-client.ts`,
  only smart components and coordinators use stores, stores never use other stores, dumb
  components never use smart components). Update `arch/` when these docs change.
- The suffix patterns (`-store.ts`, `-client.ts`, `-coordinator.ts`, smart and dumb suffixes)
  are defined at the top of `arch/access-rules.spec.ts`. A misnamed file escapes the rules.
- Spec files are excluded from the checks (`tsconfig.arch.json`).
- See the README for the product scope.

## Domain Boundaries

- Add a new domain only when the user explicitly requests it. The agent may always propose a
  new domain, but such a proposal must be accepted by the user before it is created.
- Respect the existing domain boundaries enforced by Sheriff.
- Never import implementation details from the private internals of another feature or domain.
- Cross-domain communication must occur exclusively through the public APIs configured in
  Sheriff or through dedicated parts of the shared area.
- A domain may access another domain when the latter exposes a dedicated API that publishes
  only selected details. No such API is configured yet.
  Consult the user before choosing this approach.

## Layering

- Apply _relaxed_ layering.
- Permit only the following import direction: `feature → ui → data → util`.

## Changing the Sheriff Configuration

- Modify the Sheriff configuration only when explicitly instructed to do so.
- Never change the Sheriff configuration merely to relax existing boundaries.

## Locality

- Keep code that is used and changed together in close proximity (e.g., within the same folder).

## Single Responsibility

- Each file should have a single, well-defined responsibility.
- Adding helper constructs (functions, etc.) that are used only within the current file is acceptable.

## Signals

- Computed signals whose computation exceeds a single line should delegate to pure functions.
  - If such a function is used only once, place it at the end of the current file.

## Feature Slicing

- If code is used by a single feature only, place it in the corresponding feature folder.
- If code from one feature must be reused by another feature within the same domain,
  move it down to a lower layer.
- If technical code from one feature must be reused by a feature in a different domain,
  move it down to a lower layer of the shared area.
  - If the code might be domain-specific, the agent MUST ask for explicit user approval
    before moving it to `shared`.
  - Explicit approval means a clear confirmation in the current chat.
  - Without explicit approval, keep the code in the current domain and propose alternatives.

## Data Access Services

- Use the suffix `Client` (e.g., `TaskClient`).
- Follow `TaskClient` as the reference implementation once it exists.
- Data access services must be stateless.
- Components must never call a data access service directly. They obtain data through a
  store or through a coordinator that combines several stores (see
  `docs/architecture-state-management.md`).
- Only stores may access a data access service directly. Exception: files inside an `ai`
  layer (any `ai/` folder) may access data access services directly.

## Shared Code

- Promote code to a shared area only when at least two independent features require it.
- Avoid premature shared abstractions.

## Pre-Change Checklist (Shared Moves)

- Before moving code to `shared`, verify cross-domain reuse is truly required.
- Classify the code as technical or domain-specific, and state that classification explicitly.
- If there is any domain-specific ambiguity, obtain explicit user approval first.
- Record the chosen option and rationale in the response.

## State Management

- Follow `docs/architecture-state-management.md` where applicable.
