# Game-Unicorn-Jump

<img src="https://github.com/SapporoAlex/Game-Unicorn-Jump/blob/main/unicorn_jump.gif" style="max-width:100%; height:auto;">

This is a reskin of the Chrome Dino-Jump game. It has a magical unicorn aesthetic and a parallax scrolling background.

## Table of Contents
- [Requirements](#requirements)
- [Usage](#usage)
- [File Structure](#file-structure)
- [Author](#author)
- [License](#license)

## Requirements
- [Pygame](https://pypi.org/project/pygame/) (for the original `main.py`)
- Any modern web browser (for the web port — no build step or install needed)

## Usage

### Python (original)
1. Install the required Python package:

   ```bash
   pip install pygame
   ```

2. Run the script:

   ```bash
   main.py
   ```

### Web (port)
A faithful HTML5 Canvas port lives at `index.html`. Serve the folder with any
static file server and open it in a browser, e.g.:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

- **Desktop:** Arrow Up / Space / W to jump, Arrow Down / S to duck, or click
  the canvas to jump. Press any key or click to start/restart.
- **Mobile / tablet:** On-screen Jump and Duck buttons appear automatically
  on touch devices; tap the screen to start/restart. Works in both portrait
  and landscape orientation.

## File Structure
- `assets`: Folder with png images
- `main.py`: Python script for running the game
- `index.html`, `style.css`, `game.js`: Web port of the game

## Author
Alex McKinley

## License
This project is licensed under the [MIT License](LICENSE).
