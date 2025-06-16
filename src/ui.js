// src/ui.js
import { initializeGenAI } from "./api.js";
import { startNewStory, continueStory } from "./story.js";
import { storyState, updateStoryState, resetStoryState } from "./state.js";
import {
  saveApiKey,
  getApiKey,
  saveStory,
  loadStory,
  getStories,
} from "./storage.js";
import { exportToTxt, exportToPdf, exportToEpub } from "./export.js";
import { inspiration, getRandomItem } from "./randomizer.js";

let domElements = {};

// Alert system
function showAlert(message, type = "info") {
  // Remove existing alerts
  const existingAlert = document.querySelector(".alert");
  if (existingAlert) existingAlert.remove();

  const alertEl = document.createElement("div");
  alertEl.className = `alert alert-${type}`;
  alertEl.textContent = message;

  document.body.prepend(alertEl);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    alertEl.style.opacity = "0";
    setTimeout(() => alertEl.remove(), 500);
  }, 5000);
}

// Initialize UI
export function initUI() {
  // Initialize DOM elements after DOM is ready
  domElements = {
    // Setup Screen
    apiKeyInput: document.getElementById("apiKey"),
    ApiKeySection: document.getElementById("api-key-section"),
    saveApiKeyBtn: document.getElementById("saveApiKey"),
    startStoryBtn: document.getElementById("start-story-btn"),
    languageSelect: document.getElementById("language"),
    storyTemplateSelect: document.getElementById("story-template"),
    storyTypeSelect: document.getElementById("story-type"),
    protagonistNameInput: document.getElementById("protagonist-name"),
    protagonistAgeInput: document.getElementById("protagonist-age"),
    protagonistOccupationInput: document.getElementById(
      "protagonist-occupation"
    ),
    settingTimeInput: document.getElementById("setting-time"),
    settingLocationInput: document.getElementById("setting-location"),
    conflictDescriptionInput: document.getElementById("conflict-description"),
    sidekickNameInput: document.getElementById("sidekick-name"),
    sidekickPersonalityInput: document.getElementById("sidekick-personality"),
    antagonistNameInput: document.getElementById("antagonist-name"),
    antagonistTraitsInput: document.getElementById("antagonist-traits"),
    antagonistMotivationInput: document.getElementById("antagonist-motivation"),
    setupScreen: document.getElementById("setup-screen"),
    requiredInfoText: document.getElementById("required-info"),

    // Story Screen
    storyScreen: document.getElementById("story-screen"),
    storyOutputDiv: document.getElementById("story-output"),
    choicesContainerDiv: document.getElementById("choices-container"),
    customChoiceContainer: document.getElementById("custom-choice-container"),
    customChoiceInput: document.getElementById("custom-choice-input"),
    submitCustomChoiceBtn: document.getElementById("submit-custom-choice-btn"),
    cancelCustomChoiceBtn: document.getElementById("cancel-custom-choice-btn"),
    readAloudBtn: document.getElementById("read-aloud-btn"),
    restartBtn: document.getElementById("restart-btn"),
    shareStoryBtn: document.getElementById("share-story-btn"),
    toggleFullStoryBtn: document.getElementById("toggle-full-story-btn"),
    fullStoryLogDiv: document.getElementById("full-story-log"),
    fullStoryContentDiv: document.getElementById("full-story-content"),

    // Share Modal
    shareModal: document.getElementById("share-modal"),
    closeModal: document.querySelector(".close-modal"),
    saveStoryBtn: document.getElementById("save-story-btn"),
    exportTxtBtn: document.getElementById("export-txt-btn"),
    exportPdfBtn: document.getElementById("export-pdf-btn"),
    exportEpubBtn: document.getElementById("export-epub-btn"),
    copyStoryBtn: document.getElementById("copy-story-btn"),
    shareLinkBtn: document.getElementById("share-link-btn"),
    shareLinkContainer: document.getElementById("share-link-container"),
    shareLinkInput: document.getElementById("share-link-input"),
    copyLinkBtn: document.getElementById("copy-link-btn"),

    // Save/Load
    loadStoryBtn: document.getElementById("load-story-btn"),
    savedStoriesSelect: document.getElementById("saved-stories-select"),
  };

  loadSavedStories();
  registerEventListeners();

  // Load API key if exists
  const savedApiKey = getApiKey();
  if (savedApiKey) {
    domElements.apiKeyInput.value = savedApiKey;
    try {
      initializeGenAI(savedApiKey);
      if (domElements.startStoryBtn) {
        domElements.startStoryBtn.disabled = false;
      }
      showAlert("API Key loaded successfully!", "success");
      domElements.ApiKeySection.style.display = "none";
    } catch (error) {
      showAlert(`Failed to initialize AI: ${error.message}`, "error");
    }
  }

  // Load story from URL if present
  const storyWasLoaded = loadStoryFromUrl();

  if (!storyWasLoaded) {
    domElements.storyScreen.style.display = "none";
  }

  if (domElements.fullStoryLogDiv)
    domElements.fullStoryLogDiv.style.display = "none";
  if (domElements.shareModal) domElements.shareModal.style.display = "none";

  if (
    domElements.savedStoriesSelect &&
    domElements.savedStoriesSelect.options.length <= 1
  ) {
    domElements.savedStoriesSelect.style.display = "none";
  }

  // Hide story screen initially
  if (domElements.storyScreen.style.display !== "block") {
    domElements.storyScreen.style.display = "none";
  }
}

function loadSavedStories() {
  const stories = getStories();

  // Only proceed if the select element exists
  if (domElements.savedStoriesSelect) {
    domElements.savedStoriesSelect.innerHTML =
      '<option value="">Select a story to load</option>';

    stories.forEach((story) => {
      const option = document.createElement("option");
      option.value = story.id;
      option.textContent = story.title;
      domElements.savedStoriesSelect.appendChild(option);
    });
  }
}

function registerEventListeners() {
  // API Key Management
  if (domElements.saveApiKeyBtn) {
    domElements.saveApiKeyBtn.addEventListener("click", handleSaveApiKey);
  }

  // Story Flow
  if (domElements.startStoryBtn) {
    domElements.startStoryBtn.addEventListener("click", startStoryHandler);
  }

  if (domElements.restartBtn) {
    domElements.restartBtn.addEventListener("click", restartStoryHandler);
  }

  // Choices
  if (domElements.submitCustomChoiceBtn) {
    domElements.submitCustomChoiceBtn.addEventListener(
      "click",
      submitCustomChoice
    );
  }

  if (domElements.cancelCustomChoiceBtn) {
    domElements.cancelCustomChoiceBtn.addEventListener(
      "click",
      cancelCustomChoice
    );
  }

  // Read Aloud
  if (domElements.readAloudBtn) {
    domElements.readAloudBtn.addEventListener("click", readAloudHandler);
  }

  // Full Story View
  if (domElements.toggleFullStoryBtn) {
    domElements.toggleFullStoryBtn.addEventListener("click", toggleFullStory);
  }

  // Save/Load Stories
  if (domElements.loadStoryBtn) {
    domElements.loadStoryBtn.addEventListener("click", showLoadStoryOptions);
  }

  if (domElements.savedStoriesSelect) {
    domElements.savedStoriesSelect.addEventListener(
      "change",
      loadSelectedStory
    );
  }

  // Share Modal
  if (domElements.shareStoryBtn) {
    domElements.shareStoryBtn.addEventListener("click", showShareModal);
  }

  if (domElements.closeModal) {
    domElements.closeModal.addEventListener("click", hideShareModal);
  }

  window.addEventListener("click", (e) => {
    if (domElements.shareModal && e.target === domElements.shareModal) {
      hideShareModal();
    }
  });

  // Share Options
  if (domElements.saveStoryBtn) {
    domElements.saveStoryBtn.addEventListener("click", handleSaveStory);
  }

  if (domElements.exportTxtBtn) {
    domElements.exportTxtBtn.addEventListener("click", () => {
      exportToTxt();
      hideShareModal();
    });
  }

  if (domElements.exportPdfBtn) {
    domElements.exportPdfBtn.addEventListener("click", () => {
      exportToPdf();
      hideShareModal();
    });
  }

  if (domElements.exportEpubBtn) {
    domElements.exportEpubBtn.addEventListener("click", () => {
      exportToEpub();
      hideShareModal();
    });
  }

  if (domElements.copyStoryBtn) {
    domElements.copyStoryBtn.addEventListener("click", copyStoryToClipboard);
  }

  if (domElements.shareLinkBtn) {
    domElements.shareLinkBtn.addEventListener("click", generateShareableLink);
  }

  if (domElements.copyLinkBtn) {
    domElements.copyLinkBtn.addEventListener("click", copyShareLink);
  }

  if (domElements.setupScreen) {
    domElements.setupScreen.addEventListener("click", (e) => {
      // Find the button that was clicked, if any
      const button = e.target.closest(".randomize-btn");

      // If the click wasn't on a randomize button, do nothing
      if (!button) {
        return;
      }

      // Get the target input's ID from the button's data-target attribute
      const targetId = button.dataset.target;
      const inputElement = document.getElementById(targetId);

      // The target key in our inspiration object might be different (e.g., 'conflict' instead of 'conflict-description')
      // This is a simple way to map them. You can make this more robust if needed.
      const inspirationKey = targetId.includes("conflict")
        ? "conflict"
        : targetId;

      if (inputElement && inspiration[inspirationKey]) {
        // Get a random item and set the input's value
        inputElement.value = getRandomItem(inspiration[inspirationKey]);
      }
    });
  }
}

function handleSaveApiKey() {
  const apiKey = domElements.apiKeyInput.value.trim();
  if (!apiKey) {
    showAlert("Please enter a valid API Key", "error");
    return;
  }

  try {
    if (initializeGenAI(apiKey)) {
      saveApiKey(apiKey);
      domElements.startStoryBtn.disabled = false;
      showAlert("API Key saved successfully!", "success");
    }
  } catch (error) {
    showAlert(`API Error: ${error.message}`, "error");
  }
}

function validateSetup() {
  let isValid = true;

  // Required fields
  const requiredFields = [
    domElements.protagonistNameInput,
    domElements.settingLocationInput,
    domElements.conflictDescriptionInput,
  ];

  requiredFields.forEach((field) => {
    if (!field.value.trim()) {
      field.classList.add("invalid");
      isValid = false;
    } else {
      field.classList.remove("invalid");
    }
  });

  return isValid;
}

async function startStoryHandler() {
  if (!validateSetup()) {
    showAlert("Please fill in all required fields", "error");
    return;
  }

  setLanguage(domElements.languageSelect.value);

  // Gather story configuration
  updateStoryState({
    config: {
      language: domElements.languageSelect.value,
      template: domElements.storyTemplateSelect.value,
      storyType: domElements.storyTypeSelect.value,
      words:
        domElements.storyTypeSelect.value === "short-story"
          ? "100-150"
          : "400-500",
      numChoices: 4,
      maxTurns: domElements.storyTypeSelect.value === "novel" ? 15 : 5,
    },
    details: {
      protagonist: {
        name: domElements.protagonistNameInput.value.trim() || "A brave soul",
        age: domElements.protagonistAgeInput.value || "ageless",
        occupation:
          domElements.protagonistOccupationInput.value.trim() || "adventurer",
      },
      setting: {
        time:
          domElements.settingTimeInput.value.trim() || "a time beyond memory",
        location:
          domElements.settingLocationInput.value.trim() || "a mysterious land",
      },
      conflict:
        domElements.conflictDescriptionInput.value.trim() ||
        "face an unknown challenge",
      sidekick: {
        name: domElements.sidekickNameInput.value.trim(),
        personality: domElements.sidekickPersonalityInput.value.trim(),
      },
      antagonist: {
        name: domElements.antagonistNameInput.value.trim(),
        traits: domElements.antagonistTraitsInput.value.trim(),
        motivation: domElements.antagonistMotivationInput.value.trim(),
      },
    },
  });

  // Show loading state
  domElements.storyOutputDiv.innerHTML =
    '<div class="loader"></div><p>Creating your story...</p>';

  try {
    const { story, choices } = await startNewStory();

    // Update UI
    domElements.setupScreen.style.display = "none";
    domElements.requiredInfoText.style.display = "none";
    domElements.storyScreen.style.display = "block";
    applyTheme(storyState.config.template);

    // Call display function here
    displayStoryPart(story, choices);
  } catch (error) {
    showAlert(`Story creation failed: ${error.message}`, "error");
  }
}

function renderChoices(choices) {
  domElements.choicesContainerDiv.innerHTML = "";

  if (choices.length > 0) {
    choices.forEach((choice, index) => {
      const button = document.createElement("button");
      button.textContent = `${index + 1}. ${choice}`;
      button.addEventListener("click", () => handleChoice(choice));
      domElements.choicesContainerDiv.appendChild(button);
    });

    // Add custom choice option
    const customBtn = document.createElement("button");
    customBtn.textContent = "✍️ Write my own action...";
    customBtn.classList.add("custom-choice");
    customBtn.addEventListener("click", showCustomChoiceInput);
    domElements.choicesContainerDiv.appendChild(customBtn);

    domElements.readAloudBtn.disabled = false;
  } else {
    domElements.storyOutputDiv.innerHTML += "<p><strong>THE END</strong></p>";
    domElements.choicesContainerDiv.innerHTML = "<p>Thank you for playing!</p>";
    domElements.readAloudBtn.disabled = false;
  }
}

async function handleChoice(choice) {
  try {
    // Show loading state
    domElements.storyOutputDiv.innerHTML =
      '<div class="loader"></div><p>Continuing your story...</p>';
    domElements.choicesContainerDiv.innerHTML = "";

    const { story, choices } = await continueStory(choice);

    // Call display function here
    displayStoryPart(story, choices);
  } catch (error) {
    showAlert(`Error continuing story: ${error.message}`, "error");
  }
}

// The display function implementation
export function displayStoryPart(storyText, choices = []) {
  // Display story text
  domElements.storyOutputDiv.innerHTML = `<p>${storyText.replace(
    /\n/g,
    "<br>"
  )}</p>`;

  // Add to history
  updateStoryState({
    history: [...storyState.history, storyText],
    currentChoices: choices,
  });

  // Show choices
  renderChoices(choices);

  // Update full story log
  updateFullStoryLog();
}

/**
 * This is used when loading a story from the library or a URL.
 * @param {object} loadedStoryState - The complete story state object.
 */

function renderLoadedStory(loadedStoryState) {
  // 1. Update the UI screens and theme
  domElements.setupScreen.style.display = "none";
  domElements.requiredInfoText.style.display = "none";
  domElements.storyScreen.style.display = "block";
  applyTheme(loadedStoryState.config.template);

  // --- THIS IS THE CRITICAL FIX ---
  // 2. Combine the ENTIRE story history into one block of text.
  const fullStoryText = loadedStoryState.history
    .map((part) => `<p>${part.replace(/\n/g, "<br>")}</p>`)
    .join(""); // Join all parts into one HTML string

  // 3. Display the FULL story in the main output div.
  domElements.storyOutputDiv.innerHTML = fullStoryText;
  domElements.storyOutputDiv.style.textAlign = "left";

  // 4. Render the choices that were available at the end of the loaded story.
  renderChoices(loadedStoryState.currentChoices);

  // 5. We no longer need the separate "Full Story Log" for this view,
  //    as the main output now contains everything. We can hide it.
  domElements.fullStoryLogDiv.style.display = "none";
  domElements.toggleFullStoryBtn.textContent = "Show Full Story";
}

/**
 * Checks the URL for a 'story' parameter and loads it if found.
 * @returns {boolean} - True if a story was loaded, otherwise false.
 */
function loadStoryFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const storyId = urlParams.get("story");

  if (storyId) {
    try {
      // 1. Get the story data from storage
      const storyToLoad = loadStory(storyId);

      // 2. Update the application's central state
      updateStoryState(storyToLoad);

      // 3. Render the entire loaded story
      renderLoadedStory(storyState);

      showAlert("Story loaded successfully from link!", "success");

      // 4. Clean the URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return true; // Indicate that a story was loaded
    } catch (error) {
      console.error("Failed to load story from URL:", error);
      showAlert(
        `Error: Could not load the story. It may have been deleted.`,
        "error"
      );
    }
  }
  return false; // No story ID found in URL
}

function showCustomChoiceInput() {
  domElements.choicesContainerDiv.style.display = "none";
  domElements.customChoiceContainer.style.display = "block";
  domElements.customChoiceInput.focus();
}

function submitCustomChoice() {
  const choice = domElements.customChoiceInput.value.trim();
  if (choice) {
    handleChoice(choice);
  } else {
    showAlert("Please enter your action", "error");
  }
}

function cancelCustomChoice() {
  domElements.customChoiceContainer.style.display = "none";
  domElements.choicesContainerDiv.style.display = "grid";
  domElements.customChoiceInput.value = "";
}

function readAloudHandler() {
  if (!("speechSynthesis" in window)) {
    showAlert("Your browser doesn't support text-to-speech", "error");
    return;
  }

  const storyP = domElements.storyOutputDiv.querySelector("p");
  if (!storyP || storyState.history.length === 0) {
    showAlert("No story content to read aloud", "error");
    return;
  }

  const textToSpeak = storyP.innerText;
  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function toggleFullStory() {
  if (domElements.fullStoryLogDiv.style.display === "none") {
    domElements.fullStoryLogDiv.style.display = "block";
    domElements.toggleFullStoryBtn.textContent = "Hide Full Story";
  } else {
    domElements.fullStoryLogDiv.style.display = "none";
    domElements.toggleFullStoryBtn.textContent = "Show Full Story";
  }
}

function updateFullStoryLog() {
  if (domElements.fullStoryContentDiv) {
    domElements.fullStoryContentDiv.innerHTML = storyState.history
      .map(
        (part, index) => `
        <div class="story-part">
          <h4>Part ${index + 1}</h4>
          <p>${part.replace(/\n/g, "<br>")}</p>
        </div>
      `
      )
      .join("");
  }
}

function applyTheme(template) {
  document.body.className = `${template}-theme`;
}

function restartStoryHandler() {
  resetStoryState();

  // Reset UI
  domElements.setupScreen.style.display = "block";
  domElements.requiredInfoText.style.display = "block";
  domElements.storyScreen.style.display = "none";
  domElements.storyOutputDiv.innerHTML = "<p>Loading story...</p>";
  domElements.choicesContainerDiv.innerHTML = "";
  domElements.customChoiceContainer.style.display = "none";
  domElements.customChoiceInput.value = "";
  domElements.fullStoryLogDiv.style.display = "none";

  // Clear input highlights
  document.querySelectorAll(".invalid").forEach((el) => {
    el.classList.remove("invalid");
  });
}

function showShareModal() {
  if (storyState.history.length === 0) {
    showAlert("No story to share yet!", "error");
    return;
  }

  domElements.shareModal.style.display = "block";
  domElements.shareLinkContainer.style.display = "none";
}

function hideShareModal() {
  domElements.shareModal.style.display = "none";
}

function handleSaveStory() {
  try {
    const storyId = saveStory();
    showAlert("Story saved successfully!", "success");
    loadSavedStories();
    hideShareModal();
  } catch (error) {
    showAlert(`Failed to save story: ${error.message}`, "error");
  }
}

function setLanguage(lang) {
  storyState.config.language = lang;
  localStorage.setItem("language", lang);
}

function copyStoryToClipboard() {
  try {
    const storyText = storyState.history.join("\n\n");
    navigator.clipboard
      .writeText(storyText)
      .then(() => {
        showAlert("Story copied to clipboard!", "success");
        hideShareModal();
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
        showAlert("Failed to copy story to clipboard", "error");
      });
  } catch (error) {
    showAlert(`Error: ${error.message}`, "error");
  }
}

function generateShareableLink() {
  try {
    const storyId = saveStory();
    const url = new URL(window.location.href);
    url.searchParams.set("story", storyId);

    domElements.shareLinkInput.value = url.toString();
    domElements.shareLinkContainer.style.display = "flex";
  } catch (error) {
    showAlert(`Failed to generate link: ${error.message}`, "error");
  }
}

function copyShareLink() {
  domElements.shareLinkInput.select();
  document.execCommand("copy");
  showAlert("Link copied to clipboard!", "success");
}

function showLoadStoryOptions() {
  domElements.savedStoriesSelect.style.display =
    domElements.savedStoriesSelect.style.display === "block" ? "none" : "block";
}

function loadSelectedStory() {
  const storyId = domElements.savedStoriesSelect.value;
  if (!storyId) return;

  try {
    // 1. Get the story data
    const storyToLoad = loadStory(storyId);

    // 2. Update the central state
    updateStoryState(storyToLoad);

    // 3. Render the entire story using our new function
    renderLoadedStory(storyState);

    showAlert("Story loaded successfully!", "success");
  } catch (error) {
    showAlert(`Failed to load story: ${error.message}`, "error");
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", initUI);
