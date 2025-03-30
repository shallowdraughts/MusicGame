# MusicGame
This is a fun, web-based music listening game, it challenges players to listen carefully to a melody's contour (the ups and downs of the notes) and recreate it using simple keyboard controls.
# AMIS 2025 Audition Challenge Game

## Overview

Welcome to the AMIS Audition Challenge! This is a fun, web-based music listening game created to celebrate the 50th Festive Season of the AMIS Band Festival in Frankfurt. It challenges players to listen carefully to a melody's contour (the ups and downs of the notes) and recreate it using simple keyboard controls.

This game was developed for enjoyment with significant assistance from AI collaboration.

## How to Play

The goal is to successfully recreate as many melody contours as possible before running out of lives.

**1. Title Screen:**
   *   Enter your **Player Name**.
   *   Enter your **School Initials** (up to 4 characters).
   *   Select your preferred **Hair Length** (Short/Long). This choice determines the appearance of the musician avatar during the game.
   *   Use the **RGB sliders** to choose a custom background color for your game session.
   *   Click the **Start Game** button.

**2. Instrument Selection Screen:**
   *   Displayed at the top: Your current **Lives** (starting at 3) and **Score** (starting at 0). Your Name and School are also shown.
   *   A large animation of a concert band is shown (placeholder).
   *   Along the bottom, you'll see 10 instrument options with icons matching your chosen hair length.
   *   **Choose your instrument** by either:
        *   Clicking on the instrument's icon/name.
        *   Pressing the corresponding number key on your keyboard (1-9, then 0 for Percussion).
   *   Once an instrument is selected, the Audition Stage begins.

**3. Audition Stage Screen:**
   *   **Set Melody Length:**
        *   The game prompts: "Select melody length (3-9 notes) and click 'Set Length'."
        *   Enter a number between 3 and 9 into the input field.
        *   Click the **"Set Length"** button.
        *   **Length Limit:** You can successfully complete each length only **3 times**. After 3 successes at a specific length (e.g., length 5), you'll be prompted to choose a different length.
   *   **Listen:**
        *   The instruction changes to "Listen carefully...".
        *   The game will play a randomly generated melody contour of your chosen length using the sound of the instrument you selected.
   *   **Choose Action:**
        *   After the melody plays, the instruction changes to "Press '1' to Listen Again, or '2' to Play."
   *   **Input Melody Contour:**
        *   If you press '2', the instruction changes to "Get Ready! Press SPACE BAR to start playing."
        *   Press the **Space Bar**. The first note of the melody will play as a starting reference, and the instruction changes to "Use UP ▲, DOWN ▼, or RIGHT ▶ arrow keys...".
        *   Now, listen to the sound and watch the avatar. Press the arrow keys to indicate if the *next* note should be higher, lower, or the same pitch as the *current* note:
            *   **Up Arrow (▲):** Next note is HIGHER than the previous one.
            *   **Down Arrow (▼):** Next note is LOWER than the previous one.
            *   **Right Arrow (▶):** Next note is the SAME PITCH as the previous one.
        *   The central avatar will animate Up, Down, or Neutral based on your arrow key input.
        *   You need to press one arrow key for each step *after* the first note (i.e., for a 5-note melody, you press 4 arrow keys).
   *   **Evaluation:**
        *   Once you've entered the correct number of arrow presses, the game shows "Evaluating...".
        *   **Correct:** If your arrow sequence matches the melody's contour, you score points equal to the melody length (e.g., +5 points for a 5-note melody). Your score updates. You'll be asked "Change Instrument? (Y/N)". Press 'Y' to go back to the Instrument Select screen, or 'N' to continue with the same instrument and choose a new melody length.
        *   **Incorrect:** If your sequence is wrong, you lose one life. Your lives display updates. The game shows "Incorrect! Lives left: X". After a brief pause, you'll be prompted to select a new melody length.
   *   **Game Over:**
        *   If you lose your last life, the "Game Over" screen appears.
        *   It displays your **Final Score**.
        *   It shows a list of the **Top 5 High Scores** achieved during the current browser session.
        *   Press **Enter** to return to the Title Screen and play again.

## How to Run Locally

To play this game on your own computer:

**Method 1: Simple File Opening (Usually Works)**

1.  **Download/Get Files:** Make sure you have the complete project folder, including:
    *   `index.html` (at the root)
    *   `style.css` (at the root)
    *   `script.js` (at the root)
    *   `assets/` (a folder containing all the necessary image and GIF files)
2.  **Asset Files:** Ensure the `assets/` folder contains the required images with the correct filenames (case-sensitive matters on some systems!):
    *   `concert_band_idle.gif`
    *   `judges_idle.gif`
    *   Instrument Icons (GIFs): `male_instrument_idle.gif`, `female_instrument_idle.gif` (e.g., `male_trumpet_idle.gif`, `female_flute_idle.gif` for all 10 instruments)
    *   Audition Avatars (PNGs): `male_instrument_state.png`, `female_instrument_state.png` where `state` is `neutral`, `up`, or `down` (e.g., `male_trombone_up.png`, `female_clarinet_neutral.png` for all 10 instruments, 3 states, 2 hair lengths)
    *   Placeholders (Optional but recommended): `placeholder_icon.png`, `placeholder_avatar_neutral.png`, `placeholder_avatar_up.png`, `placeholder_avatar_down.png`
3.  **Open `index.html`:** Navigate to the project folder on your computer and simply double-click the `index.html` file. It should open in your default web browser (Chrome, Firefox, Edge, Safari recommended).

**Method 2: Using a Local Web Server (More Robust)**

Sometimes, browsers have security restrictions when opening local files directly (especially regarding audio or more advanced features). Running a simple local web server avoids this.

1.  **Get Files:** As above, ensure you have the complete project folder and assets.
2.  **Open Terminal/Command Prompt:**
    *   Navigate to the **root directory** of the project folder (the one containing `index.html`) using the `cd` command.
    *   If you have Python 3 installed (many systems do), run the command:
        ```bash
        python -m http.server
        ```
    *   If you have Python 2, use:
        ```bash
        python -m SimpleHTTPServer
        ```
    *   Alternatively, use extensions like "Live Server" in VS Code.
3.  **Open Browser:** Open your web browser and go to `http://localhost:8000` (or the port number shown in the terminal, often 8000).
4.  **Play:** The game should load.
5.  **Stop Server:** When finished, go back to the terminal and press `Ctrl + C` to stop the server.

## Technologies Used

*   HTML
*   CSS
*   JavaScript
*   Web Audio API (for sound synthesis)

## Acknowledgements

*   Created by [Your Name/Group Name, if desired] for the AMIS 50th Festive Season.
*   Developed with the assistance of AI (ChatGPT).

---

Enjoy the AMIS Audition Challenge!
