// src/ui.js
import { initializeGenAI } from "./api.js";
import { startNewStory, continueStory } from "./story.js";
import { storyState, updateStoryState, resetStoryState } from "./state.js";
import {
  saveApiKey,
  getApiKey,
  saveStoryFromGenerator,
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
    wordCountControls: document.getElementById("word-count-controls"),
    minWordsInput: document.getElementById("min-words-input"),
    maxWordsInput: document.getElementById("max-words-input"),

    // Share Modal
    shareModal: document.getElementById("share-modal"),
    closeModal: document.querySelector(".close-modal"),
    exportTxtBtn: document.getElementById("export-txt-btn"),
    exportPdfBtn: document.getElementById("export-pdf-btn"),
    exportEpubBtn: document.getElementById("export-epub-btn"),
    copyStoryBtn: document.getElementById("copy-story-btn"),
    shareLinkBtn: document.getElementById("share-link-btn"),
    shareLinkContainer: document.getElementById("share-link-container"),
    shareLinkInput: document.getElementById("share-link-input"),
    copyLinkBtn: document.getElementById("copy-link-btn"),
  };

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

  // NOTE: Loading a story from URL into this view is disabled in favor of the Chapter Editor.
  // The 'loadStoryFromUrl' function has been removed as it creates conflicting user experiences.
  // Users will now be directed to the more powerful chapter-view.html for loading stories.

  domElements.storyScreen.style.display = "none";
  if (domElements.fullStoryLogDiv)
    domElements.fullStoryLogDiv.style.display = "none";
  if (domElements.shareModal) domElements.shareModal.style.display = "none";
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
      const button = e.target.closest(".randomize-btn");
      if (!button) return;

      const targetId = button.dataset.target;
      const inputElement = document.getElementById(targetId);
      const inspirationKey = targetId.includes("conflict")
        ? "conflict"
        : targetId;

      if (inputElement && inspiration[inspirationKey]) {
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
      domElements.ApiKeySection.style.display = "none";
    }
  } catch (error) {
    showAlert(`API Error: ${error.message}`, "error");
  }
}

function validateSetup() {
  let isValid = true;
  const requiredFields = [
    domElements.protagonistNameInput,
    domElements.settingLocationInput,
    domElements.conflictDescriptionInput,
  ];

  requiredFields.forEach((field) => {
    if (!field.value.trim()) {
      field.style.borderColor = "red";
      isValid = false;
    } else {
      field.style.borderColor = "";
    }
  });

  return isValid;
}

async function startStoryHandler() {
  if (!validateSetup()) {
    showAlert(
      "Please fill in all required fields (marked with red border)",
      "error"
    );
    return;
  }

  resetStoryState();

  const storyType = domElements.storyTypeSelect.value;
  updateStoryState({
    config: {
      language: domElements.languageSelect.value,
      template: domElements.storyTemplateSelect.value,
      storyType: storyType,
      minWords: storyType === "short-story" ? 100 : 400,
      maxWords: storyType === "short-story" ? 150 : 500,
      numChoices: 4,
      maxTurns: storyType === "novel" ? 999999999999999 : 5,
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

  domElements.storyOutputDiv.innerHTML =
    '<div class="loader"></div><p>Creating your story...</p>';
  try {
    const { story, choices } = await startNewStory();
    domElements.setupScreen.style.display = "none";
    domElements.requiredInfoText.style.display = "none";
    domElements.storyScreen.style.display = "block";
    applyTheme(storyState.config.template);
    displayStoryPart(story, choices);
  } catch (error) {
    showAlert(`Story creation failed: ${error.message}`, "error");
    restartStoryHandler();
  }
}

function renderChoices(choices) {
  domElements.choicesContainerDiv.innerHTML = "";
  domElements.wordCountControls.style.display = "flex";
  domElements.minWordsInput.value = storyState.config.minWords;
  domElements.maxWordsInput.value = storyState.config.maxWords;

  if (choices.length > 0) {
    choices.forEach((choice, index) => {
      const button = document.createElement("button");
      button.textContent = `${index + 1}. ${choice}`;
      button.addEventListener("click", () => handleChoice(choice));
      domElements.choicesContainerDiv.appendChild(button);
    });

    const customBtn = document.createElement("button");
    customBtn.textContent = "✍️ Write my own action...";
    customBtn.classList.add("custom-choice-trigger");
    customBtn.addEventListener("click", showCustomChoiceInput);
    domElements.choicesContainerDiv.appendChild(customBtn);
    domElements.readAloudBtn.disabled = false;
  } else {
    domElements.storyOutputDiv.innerHTML += "<p><strong>THE END</strong></p>";
    domElements.choicesContainerDiv.innerHTML =
      '<p style="display: block; text-align: center;">Thank you for playing!</p>';
    domElements.readAloudBtn.disabled = false;
    domElements.wordCountControls.style.display = "none";
  }
}

async function handleChoice(choice) {
  let newMinWords = parseInt(domElements.minWordsInput.value, 10);
  let newMaxWords = parseInt(domElements.maxWordsInput.value, 10);
  if (newMinWords > newMaxWords)
    [newMinWords, newMaxWords] = [newMaxWords, newMinWords];

  if (newMinWords && newMaxWords && newMinWords <= newMaxWords) {
    updateStoryState({
      config: {
        ...storyState.config,
        minWords: newMinWords,
        maxWords: newMaxWords,
      },
    });
  }

  try {
    domElements.storyOutputDiv.innerHTML =
      '<div class="loader"></div><p>Continuing your story...</p>';
    domElements.choicesContainerDiv.innerHTML = "";
    cancelCustomChoice();
    const { story, choices } = await continueStory(choice);
    displayStoryPart(story, choices);
  } catch (error) {
    showAlert(`Error continuing story: ${error.message}`, "error");
  }
}

export function displayStoryPart(storyText, choices = []) {
  domElements.storyOutputDiv.innerHTML = `<p>${storyText.replace(
    /\n/g,
    "<br>"
  )}</p>`;
  updateStoryState({
    history: [...storyState.history, storyText],
    currentChoices: choices,
  });

  saveStoryFromGenerator(); // Auto-save after each part
  renderChoices(choices);
  updateFullStoryLog();
}

function showCustomChoiceInput() {
  domElements.choicesContainerDiv.style.display = "none";
  domElements.customChoiceContainer.style.display = "block";
  domElements.customChoiceInput.focus();
}

function submitCustomChoice() {
  const choice = domElements.customChoiceInput.value.trim();
  if (choice) handleChoice(choice);
  else showAlert("Please enter your action", "error");
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
  if (!storyP || storyState.history.length === 0) return;
  const textToSpeak = storyP.innerText;
  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function toggleFullStory() {
  const isHidden = domElements.fullStoryLogDiv.style.display === "none";
  domElements.fullStoryLogDiv.style.display = isHidden ? "block" : "none";
  domElements.toggleFullStoryBtn.textContent = isHidden
    ? "Hide Full Story"
    : "Show Full Story";
}

function updateFullStoryLog() {
  if (domElements.fullStoryContentDiv) {
    domElements.fullStoryContentDiv.innerHTML = storyState.history
      .map(
        (part, index) => `
        <div class="story-part">
          <h4>Part ${index + 1}</h4>
          <p>${part.replace(/\n/g, "<br>")}</p>
        </div>`
      )
      .join("");
  }
}

function applyTheme(template) {
  document.body.className = `${template}-theme`;
}

function restartStoryHandler() {
  resetStoryState();
  domElements.setupScreen.style.display = "block";
  domElements.requiredInfoText.style.display = "block";
  domElements.storyScreen.style.display = "none";
  domElements.wordCountControls.style.display = "none";
  document
    .querySelectorAll(".invalid")
    .forEach((el) => el.classList.remove("invalid"));
  document.body.className = "";
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

function copyStoryToClipboard() {
  try {
    const storyText = storyState.history.join("\n\n");
    navigator.clipboard
      .writeText(storyText)
      .then(() => {
        showAlert("Story copied to clipboard!", "success");
        hideShareModal();
      })
      .catch((err) => showAlert("Failed to copy story", "error"));
  } catch (error) {
    showAlert(`Error: ${error.message}`, "error");
  }
}

function generateShareableLink() {
  try {
    const storyId = saveStoryFromGenerator(); // Ensure it's saved first
    const url = new URL(window.location.origin + "/chapter-view.html"); // Link to the editor
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

document.addEventListener("DOMContentLoaded", initUI);
