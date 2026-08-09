<div align="center">

<a href="https://github.com/meetduggar23/Lyrics-Finder">
  <img
    src="https://raw.githubusercontent.com/meetduggar23/Lyrics-Finder/main/public/favicon.svg"
    alt="SONGly Logo"
    width="72"
    height="72"
  />
</a>

# SONGly <span style="color:#1D4533">AI</span>

**Find any song. Instantly. By AI.**

A modern, feature-rich song discovery and identification application built with **React 19**, **Vite**, and **TypeScript**. Identify songs playing around you, search by title or artist, preview music, and view lyrics — all in a beautiful, responsive interface.

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)

</div>

---

## Features

- **Multi-source Search** — Search songs, artists, and albums powered by **Deezer**, **iTunes**, and **Last.fm** APIs
- **Smart Lyrics Fetching** — Automatic lyrics lookup with fallback across multiple lyrics APIs
- **Built-in Music Player** — Stream 30-second previews with a full-featured player UI
- **Favorites** — Save songs, artists, and albums to your personal collection
- **Search History** — Automatically tracks your recent searches and views
- **Dark / Light Themes** — Toggle between beautiful dark and light modes
- **Keyboard Navigation** — Full keyboard shortcuts for power users
- **Fully Responsive** — Optimized for mobile, tablet, and desktop
- **Accessible** — ARIA-compliant components and semantic HTML
- **Performance Optimized** — Code-splitting, lazy loading, and manual chunking

## Tech Stack

| Layer      | Technology                                     |
| ---------- | ---------------------------------------------- |
| Framework  | React 19 + TypeScript                          |
| Build Tool | Vite 6                                         |
| Styling    | Tailwind CSS v4 + shadcn-style UI primitives   |
| Data Fetch | Axios + TanStack React Query                   |
| State      | Zustand (favorites, history, player, settings) |
| Routing    | React Router v7                                |
| Animation  | Framer Motion                                  |
| Forms      | React Hook Form + Zod                          |

## Getting Started

### Prerequisites

- **Node.js** 18.0 or later
- **npm** or **yarn**

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/meetduggar23/Lyrics-Finder.git
cd Lyrics-Finder

# 2. Install dependencies
npm install

# 3. Copy the environment file and add your keys (optional)
cp .env.example .env

# 4. Start the development server
npm run dev
```

The app will open automatically at `http://localhost:5173`.

### Available Scripts

| Script            | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the development server         |
| `npm run build`   | Type-check and build for production  |
| `npm run preview` | Preview the production build locally |
| `npm run lint`    | Run ESLint                           |
| `npm run format`  | Format code with Prettier            |

## Environment Variables

Create a `.env` file in the root directory (optional — the app works out of the box with public keys):

```env
# Last.fm API key (optional, a public demo key is used by default)
VITE_LASTFM_API_KEY=your_lastfm_api_key
```

## Deployment

Build the project for production:

```bash
npm run build
```

The output is generated in the `dist/` directory, ready to deploy to any static hosting service like **Vercel**, **Netlify**, **GitHub Pages**, or **Cloudflare Pages**.

---

<div align="center">

Made by **Meet Duggar**

</div>
