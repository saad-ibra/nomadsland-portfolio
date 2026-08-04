# Nomad's Land 🏕️

A fully interactive, top-down 16-bit RPG style portfolio website. Built with React and Vite.

![Nomad's Land Banner](public/screenshots/banner.png)

## 🎮 The Experience

Welcome to **Nomad's Land**, my personal slice of the internet. Rather than scrolling through a traditional website, you can explore my projects, reading list, and thoughts by walking around a vibrant pixel-art world!

### 🗺️ The Zones

- **The Village (Overworld):** The central hub. Walk around and explore different buildings to enter them. 
- **Nomad's Home (1st Floor):** A cozy living space featuring a bed, kitchen, dining area, and TV lounge.
- **Music Room (2nd Floor):** Head upstairs to find a fully equipped music studio with a mixing desk, drum kit, guitars, and vinyl crates!
- **Chemistry Lab:** My GitHub Projects! Walk up to the chalkboards and terminals to dynamically fetch and display my latest GitHub repositories.
- **The Library:** My Reading List! Walk the aisles of the library to explore the books I'm currently reading or have finished, pulled dynamically from my Goodreads data.
- **The Newsroom:** My Blog! Read the latest news and thoughts straight off the printing presses.

<p align="center">
  <img src="public/screenshots/village.png" width="48%" alt="The Village" />
  <img src="public/screenshots/musicroom.png" width="48%" alt="Music Studio" />
</p>

## ✨ Features

- **Dynamic Fluid Aspect Ratios:** No black bars! The camera and map boundaries perfectly adapt to any device width and height, from ultra-wide monitors to mobile phones in portrait mode.
- **Custom Pixel Art Engine:** Built completely from scratch using DOM elements, CSS `image-rendering: pixelated`, and clever absolutely-positioned `<div>` grids to map out the world.
- **Web Audio API Soundscapes:** Procedural footsteps generated on the fly. You'll hear wooden floors when indoors and grass/dirt steps while outside!
- **Interactive UI:** A retro-styled Control Bar to toggle music and adjust walk speeds.
- **API Integrations:** Live data fetching from GitHub and Goodreads.

## 🚀 Quick Start

To run the game locally, you'll need [Node.js](https://nodejs.org/) installed.

```bash
# Clone the repository
git clone https://github.com/saad-ibra/nomadsland-portfolio.git

# Navigate into the directory
cd nomadsland-portfolio

# Install dependencies
npm install

# Start the development server
npm run dev
```

Then, open your browser and navigate to the local server (usually `http://localhost:5173`).

## 🛠️ Architecture

- **Engine:** React 18, Vite.
- **Styling:** Inline CSS and vanilla React styles tailored for high-performance pixel scaling.
- **Routing:** Handled entirely via React State (`App.jsx`), offering seamless, instant transitions between maps.
- **Assets:** Custom React components utilizing Lucide icons for UI elements and purely CSS-based pixel art structures for the environment.

<p align="center">
  <img src="public/screenshots/lab.png" width="48%" alt="Chemistry Lab" />
  <img src="public/screenshots/library.png" width="48%" alt="The Library" />
</p>

## 📸 Adding Screenshots

*(Note: To complete this README, take screenshots of the game using your browser and save them in the `public/screenshots/` folder with the following names:)*
- `banner.png`
- `village.png`
- `nomadshome.png`
- `musicroom.png`
- `lab.png`
- `library.png`
- `newsroom.png`

---
*Crafted with ❤️ in the terminal.*
