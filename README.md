# Personalized Story Generator (AI-Powered)

Welcome to the AI-Powered Personalized Story Generator! This web application allows users to create unique, customizable stories based on their input, utilizing the Google Gemini API to generate dynamic and coherent narratives.

<picture>
    <source srcset="image.png">
    <img
        alt="Momentum Firmware"
        src="image.png">
</picture>

## Features

- **Customizable Stories:** Define your protagonist, setting, conflict, and an optional sidekick and antagonist.
- **Story Templates:** Choose from predefined templates like Adventure, Mystery, Fantasy, and Sci-Fi.
- **Dynamic AI Generation:** Leverages the Google Gemini API (gemini-pro model) to craft story segments.
- **Branching Narratives:** Make choices that influence the story's direction, leading to different paths and outcomes.
- **Multiple Endings:** The story can conclude in various ways based on user decisions.
- **Themed UI:** The application's background and accents change based on the selected story genre.
- **Text-to-Speech:** Listen to your generated story read aloud by the browser.
- **Full Story Log:** Review the entire story as it unfolds.
- **Story Sharing:** Option to copy the story to the clipboard for sharing.
- **Replayability:** Easily start new stories with different parameters.

## Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES Modules)
- **AI Integration:** Google Gemini API (via `@google/generative-ai` SDK)
- **Text-to-Speech:** Browser's built-in `SpeechSynthesis` API
- **Styling:** Custom CSS with themed backgrounds.

## Setup and Usage

To run this project locally, you'll need a Google Gemini API Key.

**1. Get a Gemini API Key:**

- Visit [Google AI Studio](https://aistudio.google.com/app/apikey) and create an API key.

**2. Clone the Repository (or Download Files):**

- **Option A (Clone):**
  ```bash
  git clone https://github.com/FireEmblem59/personalized-story-generator.git
  cd personalized-story-generator
  ```
- **Option B (Download ZIP):**
  - If you downloaded the project as a ZIP file from GitHub, extract it to a folder on your computer.
  - Open your terminal or command prompt and navigate into this extracted folder.

**3. Configure API Key:**

- When you first open `index.html` in your browser (after starting a local server, see step 4), you will be prompted to enter your Gemini API Key.
- Enter the key you obtained in step 1 into the input field provided at the top of the page.
- Click the "Save Key" button. The key will be stored in your browser's `localStorage` for future sessions on that browser. If the key is valid and the AI initializes, you'll see a confirmation.

**4. Run the Application via a Local Web Server:**

This project uses ES Modules and makes API calls, which require it to be served via a web server (not by directly opening `index.html` with `file:///`).

- **Using VS Code Live Server (Recommended for ease of use):**

  1.  If you have Visual Studio Code, install the "Live Server" extension by Ritwick Dey.
  2.  Open the project folder (`personalized-story-generator`) in VS Code.
  3.  Right-click on the `index.html` file in the VS Code explorer panel.
  4.  Select "Open with Live Server". This will automatically open the application in your default web browser.

- **Using Python's built-in HTTP server:**

  1.  Ensure you have Python installed.
  2.  Open your terminal or command prompt.
  3.  Navigate to the root directory of the project (where `index.html` is located).
  4.  If you have Python 3, run: `python -m http.server`
  5.  If you have Python 2 (older systems), run: `python -m SimpleHTTPServer`
  6.  The terminal will display a message like `Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...`.
  7.  Open your web browser and go to `http://localhost:8000`.

- **Using Node.js (with `serve` package):**
  1.  Ensure you have Node.js and npm installed.
  2.  Open your terminal or command prompt.
  3.  Navigate to the root directory of the project.
  4.  If you haven't used `serve` before, install it globally: `npm install -g serve`
  5.  Run the server: `serve .`
  6.  The terminal will display one or more local addresses (e.g., `http://localhost:3000`).
  7.  Open your web browser and go to one of these addresses.

**5. Create Your Story:**

- Once the application is running in your browser and you have saved your API key:
- Fill in the details for your protagonist (name, age, occupation).
- Define the setting (time period, location).
- Describe the central conflict.
- Optionally, add a sidekick and/or an antagonist with their traits.
- Choose a story template/genre from the dropdown menu.
- Click the "Start My Story!" button.
- The first part of your story will be generated. Interact with the story by clicking on the choice buttons presented to continue the narrative.
- Use the "Read Aloud," "Share Story," and "Show/Hide Full Story" buttons as needed.
- Click "Start New Story" to reset and create a different adventure.

## How It Works

The application constructs prompts based on user inputs (protagonist, setting, conflict, template, etc.) and the current story state (previous story parts and choices made). These prompts are sent to the Google Gemini API. The API processes the prompt and returns a new story segment, typically ending with two distinct choices for the protagonist. The user's selected choice is then used to build the context for the next API call, allowing the narrative to branch and evolve dynamically.

## Future Enhancements (Potential Ideas tho I'm a bit lazy to do some of them and some are really easy to implement)

- Integration with an image generation AI (e.g., DALL-E, Stable Diffusion via API) to create visuals for scenes or characters.
- A backend system for saving and loading stories, allowing users to resume or share persistent story links.
- More sophisticated prompt engineering techniques for even richer, more nuanced, and longer narratives.
- User accounts and a public or private gallery for users to save and share their favorite generated stories.
- More advanced character customization options, perhaps with AI-generated personality descriptions based on traits.
- Support for more than two choices at decision points.

## Contributing

Contributions are welcome! If you have ideas for improvements, find bugs, or want to add new features, please feel free to:

1.  Fork the repository on GitHub.
2.  Create a new branch for your feature or bugfix (`git checkout -b feature/YourAmazingFeature` or `git checkout -b fix/IssueDescription`).
3.  Make your changes and commit them with clear, descriptive messages (`git commit -m 'Add some AmazingFeature'`).
4.  Push your changes to your forked repository (`git push origin feature/YourAmazingFeature`).
5.  Open a Pull Request against the main repository, explaining your changes.

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.
