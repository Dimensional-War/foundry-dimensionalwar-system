# Foundry VTT - Dimensional War System Development Guide

## Project Overview

Foundry VTT game system for the Dimensional War RPG. Built with Vue 3 + TypeScript, using Vite as the build tool. No Handlebars templates — 100% Vue.

**Core Stack:** Vue 3 (Composition API, `<script setup>`), TypeScript, Tailwind CSS v4, Vite, Foundry VTT v13 API

---

## Build & Dev Commands

```bash
npm run dev           # Start Vite dev server on port 5173 (symlink-aware)
npm run dev-remote    # Same on port 30001 (matches Rifts/remote pattern)
npm run auto-build    # Smart build: skips if dev server is already running (PREFERRED)
npm run build         # Force production build with vite build
npm run typecheck     # vue-tsc --noEmit (no emit, just type check)
npm run link-dev      # Create symlink: Foundry data dir → project folder
npm run unlink-dev    # Remove symlink
```

**First-time setup:** Run `linkDevEnv.bat` to symlink the project into Foundry's data directory.

**Always use `auto-build`** over `build` — it checks if a dev server is already running on ports 5173/30001 and skips the build to avoid conflicts.

---

## Architecture

```
src/
├── dimensionalwar.ts          # System entry point (Hooks.once "init")
├── dimensionalwar.css         # Global styles (dw-* prefix)
├── libs/
│   ├── utils.ts               # General utilities
│   └── vue/
│       └── VueHelpers.ts      # Handlebars helper wrappers (localize, checked, etc.)
└── module/
    ├── enums.ts               # ActorType enum (Pc, Npc, Ally, Enemy, Boss)
    ├── documents.ts           # SystemActor (prepareDerivedData: clamp HP/MP)
    ├── data-models/           # TypeDataModel subclasses for each actor type
    └── actor/
        ├── DwBaseSheet.ts     # Base sheet (ApplicationV2 + Vue mounting)
        ├── ActorSheets.ts     # Per-type subclasses (minimal, set vueComponent)
        └── shared/
            ├── ActorSheet.vue     # Root component (header + tab switcher)
            ├── StatusTab.vue      # HP/MP, soak, combat state, damage/heal
            ├── ArmorTab.vue       # Armor list management
            ├── StatisticsTab.vue  # Stats + skills
            └── RollsTab.vue       # Configurable roll definitions + execution
```

### Actor Types & Data Models

| Type | Data Model | Extends |
|------|-----------|---------|
| `pc` | `PcDataModel` | `CharacterDataModel` + `customs[]` |
| `npc` | `NpcDataModel` | `CharacterDataModel` |
| `ally` | `AllyDataModel` | `CharacterDataModel` + `customs[]` |
| `enemy` | `EnemyDataModel` | `ActorDataModel` + `rolls[]` |
| `boss` | `BossDataModel` | `CharacterDataModel` |

**Inheritance:** `TypeDataModel → ActorDataModel → CharacterDataModel → {Pc, Npc, Ally, Boss}DataModel`

**`ActorDataModel` schema** (all actors share): `statistics` (6 stats: health/awareness/dexterity/strength/spirit/luck), `resources.hp/mp`, `combat`, `soak`, `gauges`, `elements`, `armors[]`, `actionHistory[]`, `rolls[]`

**`CharacterDataModel` adds:** `skills` schema with 5 categories: `movement`, `utility`, `combat`, `magic`, `artisan`

---

## Sheet Architecture (Vue Integration)

`DwBaseSheet` extends `ActorSheetV2` and manages the Vue lifecycle:

1. `_renderHTML()` — Creates `reactive(JSON.parse(JSON.stringify(actor.system)))` clone, mounts Vue once
2. `_replaceHTML()` — Appends container only on first render; Vue handles DOM thereafter
3. `close()` — Unmounts Vue app, unregisters Foundry hook
4. `#syncReactiveSystem()` — Re-merges fresh `actor.system` into reactive clone on external changes

### Injections Available in All Components

```typescript
const reactiveSystem = inject("reactiveSystem"); // Reactive clone of actor.system (mutate for UI)
const actor = inject("actor");                   // Real Foundry Actor document
const sheet = inject("sheet");                   // Sheet instance
```

**Critical:** Always use the real `actor` (not `reactiveSystem`) for:
- Calling `actor.update(...)` to persist data
- Reading `actor.name`, `actor.img`, `actor.type`
- Any Foundry document method

### Data Flow Pattern

```typescript
// 1. Mutate reactiveSystem for immediate UI reactivity
reactiveSystem.resources.hp.value = newValue;

// 2. Persist to Foundry
await actor.update({ "system.resources.hp.value": newValue });

// OR use sheet.saveSystem() which auto-prefixes "system."
await sheet.saveSystem({ "resources.hp.value": newValue });
```

### Saving Arrays (Avoid Reactive Proxy Issues)

When saving arrays (`rolls`, `armors`, `actionHistory`), always serialize first:

```typescript
// ✅ CORRECT: serialize to avoid reactive proxy issues
await actor.update({
  "system.rolls": JSON.parse(JSON.stringify(reactiveSystem.rolls))
});

// ❌ WRONG: passing reactive proxy directly
await actor.update({ "system.rolls": reactiveSystem.rolls });
```

---

## CRITICAL: Hooks Pattern (No HookManager)

This system uses **direct `Hooks.on/off`** — there is no HookManager like in the Rifts system.

```typescript
// Store the callback reference for cleanup
const myHookCallback = (actor: any) => { /* ... */ };

onMounted(() => {
  Hooks.on("updateActor", myHookCallback);
});

onUnmounted(() => {
  Hooks.off("updateActor", myHookCallback); // Must use same function reference
});
```

**Do NOT** store the return value of `Hooks.on()` — it does not return an ID to pass to `Hooks.off()`.

---

## CRITICAL: Roll Creation

Always use `Roll.create()` (async factory), never `new Roll()`:

```typescript
// ✅ CORRECT
const roll = await Roll.create("1d20 + @bonus", { bonus: 5 });
await roll.evaluate();

// ❌ WRONG
const roll = new Roll("1d20 + 5");
```

---

## Conventions

- **CSS prefix:** All classes use `dw-` prefix (`dw-sheet`, `dw-btn`, `dw-row`, `dw-label`, etc.)
- **No PrimeVue components in use** — sheets use plain HTML elements with Tailwind classes (PrimeVue resolver is configured but unused)
- **No `.hbs` templates** — all UI is Vue
- **No compendium packs yet** — `packs: []` in system.json
- **Tabs:** manual `ref<string>` tab state in `ActorSheet.vue` — no tab library
- **Vue imports:** Always consolidate into a single import statement
- **Path alias:** `@/` = `src/` in Vite; `~/` in tsconfig paths
- **Dev mode shortcut:** In `dimensionalwar.ts`, `import.meta.env.DEV` causes `initHandler()` to run immediately (no waiting for Foundry's `init` hook) for faster dev iteration
- **`@ts-expect-error`** over `@ts-ignore` when suppressing type errors; use specific type casts over `any` when possible
- **HP clamping:** `min = -(max × 3)` — negative HP represents the death threshold, not zero

## Skill Schema Types

Three kinds of skills exist in `CharacterDataModel`:

| Kind | Schema Helper | Notes |
|------|--------------|-------|
| Simple | `Skill(fields)` | Just a `level` field |
| With statistics | `SkillWithStatistics(fields)` | Level + array of per-stat bonus entries |
| With specifier | `SkillWithSpecifier(fields)` | Level + string specifier; used as arrays for multi-instance skills (e.g. Breath Weapon) |

## No Socket Implementation Yet

`"socket": true` is set in `system.json` and `pusher-js` is installed, but no socket handling exists yet. Socket code will go in a new file in `src/module/`.
