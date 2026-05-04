# Dungeons and Dragons Performance Assistant — Frontend

> A web application for Dungeon Masters to create and run faux D&D 5e 2014 ruleset combat encounters with real-time, ruleset-aware action recommendations for all Creatures.

Built by **MinMaxCollective** 2026.

---

## Overview

When a combat encounter is run in D&D, there are numerous variables a Dungeon Master must keep track of. Existing tools help track creatures, initiative, and HP — but none of them actually *play the NPC's turn for you*. This project closes that gap.

The DND Assistant lets a DM:

- Build encounters with players, monsters, and maps
- Visualize the encounter on an interactive grid map
- Run NPC turns with a Performance Assistant that recommends actions in real time, enforcing D&D 5e rules (spell slots, action economy, concentration, range, movement)

This repository contains the **frontend** — the React application, the Grid Map System, and the UI layer that talks to the backend Core Engine.

For the backend (Core Engine, Performance Assistant, dynamic weighting, FastAPI services), see the companion repository.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | React |
| Motion / Animation | React Bits |
| Routing | React Router (client-side) |
| API Layer | Axios Rest client |
| Map Rendering | Custom Grid Map System |

---

## Features

### Grid Map System
A custom-built, interactive tactical grid for visualizing encounters.

- **Auto-population**: When a map template is selected, all predefined Creature and environmental tokens are instantiated and anchored to their assigned starting coordinates.
- **Map-scale token adjustment**: Token grid footprints (Tiny, Medium, Large, etc.) scale based on the map's pixel-to-foot ratio so tactical proportions stay accurate.
- **Grid occupancy & collision**: Movement is rejected when a destination is occupied by a creature whose size or hostility doesn't allow shared space.
- **Boundary & movement enforcement**: Click and drop placement is blocked outside map dimensions or beyond a creature's movement range.
- **Traversable, fully-visible tiles**: All tiles render as traversable; obstacle and fog-of-war modeling is intentionally out of scope for this iteration.

### Encounter UI
Front-end views for creating encounters, selecting maps, browsing creatures, and running turns. The UI surfaces the active turn's mode (Ruleset vs. Manual) and presents legal actions returned by the Core Engine.

### Performance Assistant Display
Renders real-time recommendations from the backend Performance Assistant — including ranked candidate actions, computed analytics (probability of success, expected damage, impact rating), and the chosen recommendation — at the start-of-turn trigger.

### Customization System UI
Surfaces only legal actions per turn, enforcing the rules computed by the backend:

- Spell slot availability
- Action economy (action / bonus / reaction state)
- Concentration exclusivity
- Pre-turn mode selection and effect handling


---
## Project Structure High Level
 
```
src/
├── api/                 # FastAPI client and request/response handling
├── assets/              # Static assets (images, icons, map tiles)
├── components/          # Reusable UI components (incl. Grid Map System)
├── css/                 # Global styles and design tokens
├── hooks/               # Shared React hooks
├── pages/               # Top-level routed views
├── types/               # TypeScript types for encounter state, creatures, actions
├── utils/               # Helpers (grid math, scaling, validation)
├── index.css            # Global stylesheet entry
├── main.tsx             # App entry point
├── ProtectedRoute.tsx   # Auth-gated route wrapper
└── setupTests.ts        # Test environment setup
```
 
---

## Getting Started

### Prerequisites
- Node.js (LTS recommended)
- npm or yarn
- A running instance of the (https://github.com/PatGally/DND-Performance-Assistant)

### Installation

```bash
git clone <this-repo-url>
cd <repo-folder>
npm install
```

### Environment

Create a `.env` file in the project root:

```
VITE_API_BASE_URL=http://localhost:8000
```

Point `VITE_API_BASE_URL` at the backend FastAPI service. CORS is configured on the backend via `fastapi.middleware.cors.CORSMiddleware`; if you see blocked requests in the browser console, verify the backend's allowed origins include your frontend origin.

### Run

```bash
npm run dev      # local development
npm run build    # production build
npm run preview  # preview production build locally
```

---

## Scope Notes

A few intentional scoping decisions worth flagging:

- **No fog of war / obstacles** in this iteration — all tiles are traversable and visible.
- **Authoritative state lives on the backend.** The frontend renders and submits, but does not own combat state.

---

## License

TBD.
