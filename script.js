// script.js

// Import the SDK at the top
import { GoogleGenerativeAI } from "https://cdn.jsdelivr.net/npm/@google/generative-ai@0.11.3/+esm";

// DOM Elements
const apiKeyInput = document.getElementById("apiKey");
const saveApiKeyBtn = document.getElementById("saveApiKey");
const setupScreen = document.getElementById("setup-screen");
const storyScreen = document.getElementById("story-screen");
const apiKeySection = document.getElementById("api-key-section");
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

// Global State
let genAI;
let currentStoryParts = [];
let protagonistDetails = {};
let storyConfig = {}; // Will hold the story rules
let currentTurn = 0;

// --- API Key Handling ---
saveApiKeyBtn.addEventListener("click", () => {
  const apiKey = apiKeyInput.value.trim();
  if (apiKey) {
    localStorage.setItem("geminiApiKey", apiKey);
    initializeGenAI(apiKey);
  } else {
    alert("Please enter a valid API Key.");
    apiKeyInput.style.borderColor = "red";
    genAI = null;
    if (startStoryBtn) startStoryBtn.disabled = true;
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
    if (startStoryBtn) startStoryBtn.disabled = false;
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
    retryBtn.onclick = async () => {
      storyOutputDiv.innerHTML = '<div class="loader"></div><p>Retrying...</p>';
      const rawResponse = await generateStorySegment(prompt);
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
  if (!responseText) {
    return { story: "Error: No response from AI.", choices: [] };
  }
  const choiceRegex = /CHOICE\s*(\d):\s*(.*)/gi;
  const choices = [];
  let storyText = responseText;
  let match;
  while ((match = choiceRegex.exec(responseText)) !== null) {
    const choiceNumber = parseInt(match[1], 10);
    const choiceText = match[2].trim();
    choices[choiceNumber - 1] = choiceText;
  }
  storyText = responseText.replace(/CHOICE\s*\d:\s*.*$/gim, "").trim();
  return {
    story: storyText,
    choices: choices.filter(Boolean),
  };
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

  currentTurn++;

  const language = languageSelect.value;
  const fullStorySoFar = currentStoryParts.join("\n\n");
  const protagonistName = protagonistDetails?.name || "the protagonist";

  const isLastTurn = currentTurn >= storyConfig.maxTurns;
  let continuationInstruction;

  if (isLastTurn) {
    continuationInstruction = `This is the final part of the story. Write a fitting and conclusive ending (approx. 100-150 words) based on the path taken. Do not present any new choices.`;
  } else {
    let choiceInstructions = "";
    for (let i = 1; i <= storyConfig.numChoices; i++) {
      choiceInstructions += `CHOICE ${i}: [Description of choice ${i}]\n`;
    }
    continuationInstruction = `Present exactly ${storyConfig.numChoices} new distinct choices for the protagonist as:\n${choiceInstructions}Do not add any other text after the choices.`;
  }

  const prompt = `You are a creative storyteller continuing a story in ${language}.
The story so far:
${fullStorySoFar}

The protagonist, ${protagonistName}, previously chose to: ${choiceText}

Continue the story (approx. 100-150 words) based on this choice.
${continuationInstruction}`;

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

  // ** SET STORY RULES **
  storyConfig = {
    numChoices: 4, // Number of choices to generate
    maxTurns: 5, // How many times the user can make a choice
  };
  currentTurn = 0; // Reset turn count for new story

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

  let choiceInstructions = "";
  for (let i = 1; i <= storyConfig.numChoices; i++) {
    choiceInstructions += `CHOICE ${i}: [Description of choice ${i}]\n`;
  }

  initialPrompt += `
The story should introduce these elements and end with a clear decision point for the protagonist.
Present exactly ${storyConfig.numChoices} distinct choices for the protagonist as:
${choiceInstructions}Do not add any other text after the choices.`;

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
  storyConfig = {};
  currentTurn = 0;
  updateFullStoryLog();
  if (fullStoryLogDiv) fullStoryLogDiv.style.display = "none";
  if (storyBody) storyBody.className = "";
  if (startStoryBtn && genAI) startStoryBtn.disabled = false;
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
    apiKeySection.style.display = "none";
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
    if (startStoryBtn) startStoryBtn.disabled = true;
    alert("Welcome! Please enter your Gemini API Key to begin.");
  }
  if (storyBody) storyBody.className = "";
  if (fullStoryLogDiv) fullStoryLogDiv.style.display = "none";
});
