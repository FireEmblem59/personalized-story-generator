// script.js

// Import the SDK at the top
import { GoogleGenerativeAI } from "https://cdn.jsdelivr.net/npm/@google/generative-ai@0.11.3/+esm";

// DOM Elements
const apiKeyInput = document.getElementById("apiKey");
const saveApiKeyBtn = document.getElementById("saveApiKey");
const setupScreen = document.getElementById("setup-screen");
const storyScreen = document.getElementById("story-screen");
const languageSelect = document.getElementById("language");
const storyTemplateSelect = document.getElementById("story-template");
const protagonistNameInput = document.getElementById("protagonist-name");
const protagonistAgeInput = document.getElementById("protagonist-age");
const protagonistOccupationInput = document.getElementById(
  "protagonist-occupation"
);
const settingTimeInput = document.getElementById("setting-time");
const settingLocationInput = document.getElementById("setting-location");
const conflictDescriptionInput = document.getElementById(
  "conflict-description"
);
const sidekickNameInput = document.getElementById("sidekick-name");
const sidekickPersonalityInput = document.getElementById(
  "sidekick-personality"
);
const antagonistNameInput = document.getElementById("antagonist-name");
const antagonistTraitsInput = document.getElementById("antagonist-traits");
const antagonistMotivationInput = document.getElementById(
  "antagonist-motivation"
);
const startStoryBtn = document.getElementById("start-story-btn");
const storyOutputDiv = document.getElementById("story-output");
const choicesContainerDiv = document.getElementById("choices-container");
const readAloudBtn = document.getElementById("read-aloud-btn");
const restartBtn = document.getElementById("restart-btn");
const shareStoryBtn = document.getElementById("share-story-btn");
const storyBody = document.getElementById("story-body");
const fullStoryLogDiv = document.getElementById("full-story-log");
const fullStoryContentDiv = document.getElementById("full-story-content");
const toggleFullStoryBtn = document.getElementById("toggle-full-story-btn");

let genAI; // This will hold the initialized GoogleGenerativeAI instance
let currentStoryParts = [];
let protagonistDetails = {};

// --- API Key Handling ---
saveApiKeyBtn.addEventListener("click", () => {
  const apiKey = apiKeyInput.value.trim();
  if (apiKey) {
    localStorage.setItem("geminiApiKey", apiKey);
    initializeGenAI(apiKey);
  } else {
    alert("Please enter a valid API Key.");
    apiKeyInput.style.borderColor = "red";
    genAI = null; // Ensure genAI is null if key is removed/invalid
    if (startStoryBtn) startStoryBtn.disabled = true; // Disable start if no API key
  }
});

function initializeGenAI(apiKey) {
  if (!apiKey) {
    console.warn("API Key not provided for GenAI initialization.");
    alert("API Key is missing. Please save your API Key.");
    apiKeyInput.style.borderColor = "red";
    if (startStoryBtn) startStoryBtn.disabled = true;
    genAI = null;
    return;
  }

  try {
    genAI = new GoogleGenerativeAI(apiKey);
    console.log("Gemini AI Initialized successfully.");
    alert("API Key accepted and AI Initialized!");
    apiKeyInput.style.borderColor = "green";
    if (startStoryBtn) startStoryBtn.disabled = false; // Enable start button
  } catch (error) {
    console.error("Error initializing GenAI:", error);
    alert(
      `Failed to initialize AI: ${error.message}. Check console and ensure your API key is valid.`
    );
    apiKeyInput.style.borderColor = "red";
    if (startStoryBtn) startStoryBtn.disabled = true;
    genAI = null;
  }
}

// --- Story Generation Logic ---
async function generateStorySegment(prompt) {
  if (!genAI) {
    alert(
      "Gemini AI is not initialized. Please save your API Key and ensure it's correct."
    );
    storyOutputDiv.innerHTML = `<p style="color:red;">AI not ready. Please configure API Key.</p>`;
    return null;
  }
  storyOutputDiv.innerHTML =
    '<div class="loader"></div><p>Generating next part of your story...</p>';
  choicesContainerDiv.innerHTML = "";

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (error) {
    console.error("Error generating story:", error);
    storyOutputDiv.innerHTML = `<p style="color:red;">Error generating story: ${error.message}. Check console.</p>`;
    const retryBtn = document.createElement("button");
    retryBtn.textContent = "Try generating again";
    // A simple retry. For a more robust solution, you'd need to know what called this.
    // For now, this will retry the exact same segment.
    retryBtn.onclick = async () => {
      storyOutputDiv.innerHTML = '<div class="loader"></div><p>Retrying...</p>';
      const rawResponse = await generateStorySegment(prompt); // Recursive call for retry
      if (rawResponse) {
        const { story, choices } = parseGeminiResponse(rawResponse);
        displayStoryPart(story, choices);
      }
    };
    choicesContainerDiv.appendChild(retryBtn);
    return null;
  }
}

function parseGeminiResponse(responseText) {
  if (!responseText)
    return { story: "Error: No response from AI.", choices: [] };

  const choice1Regex = /CHOICE 1:\s*(.*)/i;
  const choice2Regex = /CHOICE 2:\s*(.*)/i;

  let storyText = responseText;
  const choices = [];

  let choiceStartIndex = -1;
  const choice1MarkerIndex = responseText.toLowerCase().indexOf("choice 1:");
  const choice2MarkerIndex = responseText.toLowerCase().indexOf("choice 2:");

  if (choice1MarkerIndex !== -1 && choice2MarkerIndex !== -1) {
    choiceStartIndex = Math.min(choice1MarkerIndex, choice2MarkerIndex);
  } else if (choice1MarkerIndex !== -1) {
    choiceStartIndex = choice1MarkerIndex;
  } else if (choice2MarkerIndex !== -1) {
    choiceStartIndex = choice2MarkerIndex;
  }

  if (choiceStartIndex !== -1) {
    storyText = responseText.substring(0, choiceStartIndex).trim();
    const choicesPart = responseText.substring(choiceStartIndex);

    const choice1Match = choicesPart.match(choice1Regex);
    const choice2Match = choicesPart.match(choice2Regex);

    if (choice1Match && choice1Match[1]) {
      choices.push(choice1Match[1].trim());
    }
    if (choice2Match && choice2Match[1]) {
      choices.push(choice2Match[1].trim());
    }
  } else {
    storyText = responseText.trim();
  }
  storyText = storyText.replace(/CHOICE [12]:.*$/gim, "").trim();
  return { story: storyText, choices: choices };
}

function displayStoryPart(storyPart, choices) {
  storyOutputDiv.innerHTML = `<p>${storyPart.replace(/\n/g, "<br>")}</p>`;
  currentStoryParts.push(storyPart);
  updateFullStoryLog();

  choicesContainerDiv.innerHTML = "";
  if (choices && choices.length > 0) {
    choices.forEach((choiceText, index) => {
      const choiceButton = document.createElement("button");
      choiceButton.textContent = `${index + 1}. ${choiceText}`;
      choiceButton.addEventListener("click", () => handleChoice(choiceText));
      choicesContainerDiv.appendChild(choiceButton);
    });
    if (readAloudBtn) readAloudBtn.disabled = false;
  } else {
    storyOutputDiv.innerHTML += "<p><strong>THE END.</strong></p>";
    if (readAloudBtn) readAloudBtn.disabled = false;
    choicesContainerDiv.innerHTML = "<p>Thank you for playing!</p>";
  }
}

async function handleChoice(choiceText) {
  if (!genAI) {
    alert("AI is not ready. Please save your API Key.");
    return;
  }
  const language = languageSelect.value;
  const fullStorySoFar = currentStoryParts.join("\n\n");
  const protagonistName =
    protagonistDetails && protagonistDetails.name
      ? protagonistDetails.name
      : "the protagonist";

  const prompt = `You are a creative storyteller continuing a story in ${language}.
The story so far:
${fullStorySoFar}

The protagonist, ${protagonistName}, previously chose to: ${choiceText}

Continue the story (approx. 100-150 words) based on this choice.
If this is a natural point for the story to conclude, write a fitting ending based on the path taken.
Otherwise, present exactly two new distinct choices for the protagonist as:
CHOICE 1: [Description of choice 1]
CHOICE 2: [Description of choice 2]
Do not add any other text after the choices or the ending.`;

  const rawResponse = await generateStorySegment(prompt);
  if (rawResponse) {
    const { story, choices } = parseGeminiResponse(rawResponse);
    displayStoryPart(story, choices);
  }
}

// --- UI and Event Handlers ---
startStoryBtn.addEventListener("click", async () => {
  if (!genAI) {
    alert("AI is not ready. Please save your API Key first.");
    apiKeyInput.focus();
    return;
  }

  const template = storyTemplateSelect.value;
  const language = languageSelect.value;
  protagonistDetails = {
    name: protagonistNameInput.value.trim() || "A brave soul",
    age: protagonistAgeInput.value || "ageless",
    occupation: protagonistOccupationInput.value.trim() || "an adventurer",
  };
  const setting = {
    time: settingTimeInput.value.trim() || "a time beyond memory",
    location: settingLocationInput.value.trim() || "a mysterious land",
  };
  const conflict =
    conflictDescriptionInput.value.trim() || "face an unknown challenge";
  const sidekick = {
    name: sidekickNameInput.value.trim(),
    personality: sidekickPersonalityInput.value.trim(),
  };
  const antagonist = {
    name: antagonistNameInput.value.trim(),
    traits: antagonistTraitsInput.value.trim(),
    motivation: antagonistMotivationInput.value.trim(),
  };

  if (!protagonistDetails.name || !setting.location || !conflict) {
    alert("Please fill in Protagonist Name, Setting Location, and Conflict.");
    return;
  }

  currentStoryParts = [];
  updateFullStoryLog();

  let initialPrompt = `You are a creative storyteller. Generate the beginning of a ${template} story (approx. 100-150 words) in ${language}.
Protagonist: ${protagonistDetails.name}, a ${protagonistDetails.age}-year-old ${protagonistDetails.occupation}.
Setting: In ${setting.time}, at ${setting.location}.
Conflict: They must ${conflict}.`;

  if (sidekick.name) {
    initialPrompt += `\nSidekick: ${sidekick.name}, who is ${
      sidekick.personality || "a loyal companion"
    }.`;
  }
  if (antagonist.name) {
    initialPrompt += `\nAntagonist: ${antagonist.name}, who is ${
      antagonist.traits || "a formidable foe"
    } and wants ${antagonist.motivation || "to achieve their dark goals"}.`;
  }

  initialPrompt += `
The story should introduce these elements and end with a clear decision point for the protagonist.
Present exactly two distinct choices for the protagonist as:
CHOICE 1: [Description of choice 1]
CHOICE 2: [Description of choice 2]
Do not add any other text after the choices.`;

  if (setupScreen) setupScreen.style.display = "none";
  if (storyScreen) storyScreen.style.display = "block";
  applyTheme(template);

  const rawResponse = await generateStorySegment(initialPrompt);
  if (rawResponse) {
    const { story, choices } = parseGeminiResponse(rawResponse);
    displayStoryPart(story, choices);
  }
});

restartBtn.addEventListener("click", () => {
  if (setupScreen) setupScreen.style.display = "block";
  if (storyScreen) storyScreen.style.display = "none";
  if (storyOutputDiv) storyOutputDiv.innerHTML = "<p>Loading story...</p>";
  if (choicesContainerDiv) choicesContainerDiv.innerHTML = "";
  currentStoryParts = [];
  protagonistDetails = {};
  updateFullStoryLog();
  if (fullStoryLogDiv) fullStoryLogDiv.style.display = "none";
  if (storyBody) storyBody.className = "";
  if (startStoryBtn && genAI) startStoryBtn.disabled = false; // Re-enable if AI is ready
});

readAloudBtn.addEventListener("click", () => {
  if (!("speechSynthesis" in window)) {
    alert("Your browser doesn't support text-to-speech.");
    return;
  }
  const storyP = storyOutputDiv.querySelector("p");
  if (!storyP || currentStoryParts.length === 0) {
    alert("No story content to read aloud.");
    return;
  }
  const textToSpeak = storyP.innerText;
  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
});

shareStoryBtn.addEventListener("click", () => {
  if (currentStoryParts.length === 0) {
    alert("No story to share yet!");
    return;
  }
  const fullStoryText = currentStoryParts.join("\n\n");
  const storyTitle = `My ${storyTemplateSelect.value} story about ${
    protagonistDetails.name || "a hero"
  }`;

  if (navigator.share) {
    navigator
      .share({
        title: storyTitle,
        text: `Check out this story I generated:\n\n${fullStoryText}\n\nCreated with the AI Story Generator!`,
      })
      .then(() => console.log("Successful share"))
      .catch((error) => console.log("Error sharing", error));
  } else {
    navigator.clipboard
      .writeText(`${storyTitle}\n\n${fullStoryText}`)
      .then(() =>
        alert("Story copied to clipboard! You can now paste it to share.")
      )
      .catch((err) => {
        console.error("Failed to copy: ", err);
        alert(
          "Could not copy to clipboard. You can manually copy the story from the 'Full Story' view."
        );
      });
  }
});

function applyTheme(template) {
  if (storyBody) {
    storyBody.className = "";
    storyBody.classList.add(`${template}-theme`);
  }
}

function updateFullStoryLog() {
  if (fullStoryContentDiv) {
    fullStoryContentDiv.innerHTML = currentStoryParts
      .map((part) => `<p>${part.replace(/\n/g, "<br>")}</p>`)
      .join('<hr style="margin: 10px 0; border-top: 1px solid #ccc;">');
  }
}

if (toggleFullStoryBtn) {
  toggleFullStoryBtn.addEventListener("click", () => {
    if (fullStoryLogDiv.style.display === "none") {
      fullStoryLogDiv.style.display = "block";
      toggleFullStoryBtn.textContent = "Hide Full Story";
    } else {
      fullStoryLogDiv.style.display = "none";
      toggleFullStoryBtn.textContent = "Show Full Story";
    }
  });
}

// --- Initialization on page load ---
window.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Content Loaded. Initializing application state.");
  const savedApiKey = localStorage.getItem("geminiApiKey");
  if (savedApiKey) {
    apiKeyInput.value = savedApiKey;
    initializeGenAI(savedApiKey);
  } else {
    console.warn("Gemini API Key not found in localStorage. Please enter it.");
    if (startStoryBtn) startStoryBtn.disabled = true; // Disable if no key on load
    alert("Welcome! Please enter your Gemini API Key to begin.");
  }

  if (storyBody) storyBody.className = "";
  if (fullStoryLogDiv) fullStoryLogDiv.style.display = "none";
});
