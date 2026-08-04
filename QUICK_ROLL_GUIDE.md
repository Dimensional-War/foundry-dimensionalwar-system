# Quick Roll Access System

Two new features have been added to make accessing character rolls faster and easier!

## Feature 1: Quick Roll HUD Button

**Access rolls directly from the token HUD without opening the actor sheet.**

### How to Use:

1. **Select a token** on the canvas
2. **Right-click the token** to open the Token HUD
3. **Click the dice icon (🎲)** in the left column of the HUD
4. **Choose a roll** from the popup menu

The menu shows:

- Roll name (reason)
- Category (with icon)
- Formula
- MP cost (if any)

Click any roll to execute it immediately!

### Visual Examples:

```
Token HUD Layout:
┌─────────────┐
│  👁️ Vision  │ ← Left column
│  🎯 Target  │
│  🎲 Rolls   │ ← NEW! Click this
│  ⚙️ Config  │
└─────────────┘
```

Roll Menu Example:

```
╔════════════════════════════════════╗
║  Character Name - Quick Rolls      ║
╠════════════════════════════════════╣
║  ⚔️  Power Attack                  ║
║      [Offensive] [1s7+3] [⚡5 MP]  ║
╠════════════════════════════════════╣
║  🛡️  Defensive Stance              ║
║      [Defensive] [1s5+2]           ║
╠════════════════════════════════════╣
║  🏃  Sprint                         ║
║      [Movement] [1s6+1] [⚡3 MP]   ║
╚════════════════════════════════════╝
```

---

## Feature 2: Aggregate Roll Dialog

**See and execute rolls from ALL selected tokens in one unified dialog.**

### How to Use:

#### Method 1: Create a Macro (Recommended)

1. **Create a new Script Macro** in Foundry
2. **Paste this code:**
   ```javascript
   game.dimensionalwar.showAggregateRolls();
   ```
3. **Name it** "Aggregate Rolls" or "Party Rolls"
4. **Add to hotbar** for quick access

#### Method 2: Console Command

1. **Select multiple tokens** on the canvas
2. **Open the console** (F12)
3. **Type:**
   ```javascript
   game.dimensionalwar.showAggregateRolls();
   ```
4. **Press Enter**

### What It Does:

- Shows all custom rolls from all selected tokens
- Groups rolls by character
- Color-coded categories
- Shows formulas and MP costs
- Click any roll to execute it

### Visual Example:

```
╔═══════════════════════════════════════════════════════╗
║  Aggregate Rolls (3 tokens selected)                  ║
╠═══════════════════════════════════════════════════════╣
║  ▼ Character: Warrior Bob                             ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ ⚔️  Heavy Strike                                  │ ║
║  │    [Offensive] [1s8+5] [⚡10 MP]                  │ ║
║  └──────────────────────────────────────────────────┘ ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ 🛡️  Shield Bash                                   │ ║
║  │    [Defensive] [1s6+2]                            │ ║
║  └──────────────────────────────────────────────────┘ ║
╠═══════════════════════════════════════════════════════╣
║  ▼ Character: Mage Alice                              ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ 🔮  Fireball                                      │ ║
║  │    [Offensive] [3d6] [⚡15 MP]                    │ ║
║  └──────────────────────────────────────────────────┘ ║
╠═══════════════════════════════════════════════════════╣
║  ▼ Character: Rogue Charlie                           ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ 👁️  Detect Traps                                  │ ║
║  │    [Perception] [1s7+4]                           │ ║
║  └──────────────────────────────────────────────────┘ ║
╚═══════════════════════════════════════════════════════╝
```

---

## Use Cases

### Quick Roll HUD (Token HUD Button)

- ✅ Fast access to single character's rolls
- ✅ No sheet opening required
- ✅ Perfect for player-controlled tokens
- ✅ Quick perception checks, attacks, etc.

### Aggregate Roll Dialog (Macro)

- ✅ Party-wide actions
- ✅ GM managing multiple NPCs
- ✅ Group perception checks
- ✅ Simultaneous initiative/skill rolls
- ✅ Combat scenarios with multiple actors

---

## Tips & Tricks

### For Players:

1. **Create a hotbar macro** for aggregate rolls
2. **Use Quick HUD** for your main character
3. **Organize rolls by category** in your actor sheet for easier finding

### For GMs:

1. **Select all NPCs** and use aggregate rolls for mass checks
2. **Use Quick HUD** for frequently-used NPC abilities
3. **Color-code categories** to quickly identify roll types

### Category Icons:

- ⚔️ Offensive
- 🛡️ Defensive
- 🏃 Movement
- 👁️ Perception
- 🚗 Vehicle Operation
- 🔧 Non-Combat
- 🎨 Artisan

---

## Technical Details

### Files Added:

- `src/module/utils/aggregate-rolls.ts` - Aggregate roll dialog system
- `src/module/utils/quick-roll-hud.ts` - Token HUD extension

### Integration:

- Hooks into `renderTokenHUD` for HUD button
- Exposed to `game.dimensionalwar.showAggregateRolls()`
- Uses existing `doRoll()` function from `dice-utils.ts`

### Compatibility:

- Works with all actor types (PC, NPC, Ally, Enemy, Boss)
- Only shows tokens with defined custom rolls
- Respects MP costs and deducts from resources
- Fully integrated with Dice So Nice animations
