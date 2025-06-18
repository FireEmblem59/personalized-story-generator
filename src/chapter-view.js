// src/chapter-view.js
import { initializeGenAI, generateStorySegment } from "./api.js";
import {
  getApiKey,
  saveApiKey,
  getStories,
  saveFullStory,
  deleteStory,
} from "./storage.js";

// --- STATE MANAGEMENT ---
let stories = [];
let currentStoryId = null;
let currentChapterId = null;
let hasUnsavedChanges = false;
let genAIInitialized = false;

// --- DOM ELEMENTS ---
const dom = {};

// --- UTILITY FUNCTIONS ---
function showAlert(message, type = "info", duration = 4000) {
  const alertId = `alert-${Date.now()}`;
  const alertEl = document.createElement("div");
  alertEl.id = alertId;
  alertEl.className = `alert alert-${type}`;
  alertEl.textContent = message;
  document.body.prepend(alertEl);
  setTimeout(() => {
    alertEl.style.opacity = "0";
    setTimeout(() => alertEl.remove(), 500);
  }, duration);
}

function formatAiResponse(text) {
  return text.replace(/\*{1,2}(.*?)\*{1,2}/g, "<b>$1</b>");
}

function updateWordCount() {
  if (!dom.editor || !dom.wordCountDisplay) return;
  const text = dom.editor.innerText || "";
  const wordMatch = text.trim().match(/\S+/g);
  const count = wordMatch ? wordMatch.length : 0;
  dom.wordCountDisplay.textContent = `${count} word${count === 1 ? "" : "s"}`;
}

// --- INITIALIZATION ---
function init() {
  // Main Elements
  dom.apiKeyInput = document.getElementById("apiKey-cv");
  dom.saveApiKeyBtn = document.getElementById("saveApiKey-cv");
  dom.storySelect = document.getElementById("story-select");
  dom.languageControls = document.querySelector(".story-language-controls");
  dom.languageSelect = document.getElementById("story-language-select");
  dom.newStoryBtn = document.getElementById("new-story-btn");
  dom.renameStoryBtn = document.getElementById("rename-story-btn");
  dom.deleteStoryBtn = document.getElementById("delete-story-btn");
  dom.chapterList = document.getElementById("chapter-list");
  dom.chapterListTitle = document.getElementById("chapter-list-title");
  dom.addChapterBtn = document.getElementById("add-chapter-btn");
  dom.generateFirstChapterBtn = document.getElementById(
    "generate-first-chapter-btn"
  );
  dom.editorPanel = document.getElementById("main-editor-panel");
  dom.welcomePanel = document.getElementById("welcome-panel");
  dom.editorChapterTitle = document.getElementById("editor-chapter-title");
  dom.saveChapterBtn = document.getElementById("save-chapter-btn");
  dom.editor = document.getElementById("editor");

  dom.wordCountDisplay = document.getElementById("word-count-display");
  dom.aiGuidanceModal = document.getElementById("ai-guidance-modal");
  dom.closeGuidanceModalBtn = document.getElementById("close-guidance-modal");
  dom.guidanceInput = document.getElementById("ai-guidance-input");
  dom.minWordsInput = document.getElementById("ai-min-words");
  dom.maxWordsInput = document.getElementById("ai-max-words");
  dom.generateContinuationBtn = document.getElementById(
    "generate-continuation-btn"
  );

  // AI Toolbar
  dom.aiRewriteBtn = document.getElementById("ai-rewrite-btn");
  dom.aiContinueBtn = document.getElementById("ai-continue-btn");
  dom.aiTitleBtn = document.getElementById("ai-title-btn");
  dom.aiNextChapterBtn = document.getElementById("ai-next-chapter-btn");

  loadAndRenderStories();
  registerEventListeners();
  checkApiKey();
  loadStoryFromURL();

  window.addEventListener("beforeunload", (e) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
}

function checkApiKey() {
  const key = getApiKey();
  if (key) {
    dom.apiKeyInput.value = key;
    try {
      initializeGenAI(key);
      genAIInitialized = true;
      showAlert("AI functions are ready!", "success");
      document.querySelector(".ai-toolbar").style.display = "flex";
    } catch (e) {
      showAlert("Failed to initialize AI with saved key.", "error");
      genAIInitialized = false;
    }
  } else {
    showAlert("Enter a Gemini API Key to enable AI features.", "info");
    document.querySelector(".ai-toolbar").style.display = "none";
  }
}

// --- RENDERING & UI ---
function loadAndRenderStories() {
  stories = getStories().sort(
    (a, b) => new Date(b.savedAt) - new Date(a.savedAt)
  );
  dom.storySelect.innerHTML = '<option value="">-- Select a Story --</option>';
  stories.forEach((story) => {
    const option = document.createElement("option");
    option.value = story.id;
    option.textContent = story.title;
    dom.storySelect.appendChild(option);
  });
}

function renderChapterList() {
  dom.chapterList.innerHTML = "";
  const story = stories.find((s) => s.id === currentStoryId);
  if (!story || !story.chapters) {
    dom.chapterListTitle.textContent = "No Chapters";
    return;
  }

  dom.chapterListTitle.textContent = `Chapters (${story.chapters.length})`;
  story.chapters.forEach((chapter) => {
    const li = document.createElement("li");
    li.dataset.chapterId = chapter.id;
    li.innerHTML = `
        <span class="chapter-title-text">${chapter.title}</span>
        <div class="chapter-actions">
            <button class="rename-chapter-btn" title="Rename">✏️</button>
            <button class="delete-chapter-btn" title="Delete">🗑️</button>
        </div>
    `;
    if (chapter.id === currentChapterId) {
      li.classList.add("active");
    }
    dom.chapterList.appendChild(li);
  });
}

// --- EVENT LISTENERS ---
function registerEventListeners() {
  dom.saveApiKeyBtn.addEventListener("click", handleSaveApiKey);
  dom.storySelect.addEventListener("change", handleStorySelect);
  dom.languageSelect.addEventListener("change", handleLanguageChange);
  dom.newStoryBtn.addEventListener("click", handleNewStory);
  dom.renameStoryBtn.addEventListener("click", handleRenameStory);
  dom.deleteStoryBtn.addEventListener("click", handleDeleteStory);
  dom.addChapterBtn.addEventListener("click", handleAddChapter);
  dom.generateFirstChapterBtn.addEventListener(
    "click",
    handleGenerateFirstChapter
  );
  dom.saveChapterBtn.addEventListener("click", saveCurrentChapter);

  dom.editor.addEventListener("input", () => {
    hasUnsavedChanges = true;
    updateWordCount();
  });

  dom.chapterList.addEventListener("click", (e) => {
    const targetLi = e.target.closest("li");
    if (!targetLi) return;
    const chapterId = targetLi.dataset.chapterId;
    if (e.target.classList.contains("rename-chapter-btn"))
      handleRenameChapter(chapterId);
    else if (e.target.classList.contains("delete-chapter-btn"))
      handleDeleteChapter(chapterId);
    else handleChapterSelect(chapterId);
  });

  // AI Buttons & Modal
  dom.aiRewriteBtn.addEventListener("click", handleAiRewrite);
  dom.aiContinueBtn.addEventListener("click", showGuidanceModal); // Opens modal
  dom.aiTitleBtn.addEventListener("click", handleAiTitle);
  dom.aiNextChapterBtn.addEventListener("click", handleAiNextChapter);
  dom.closeGuidanceModalBtn.addEventListener("click", hideGuidanceModal);
  dom.generateContinuationBtn.addEventListener(
    "click",
    handleGenerateContinuation
  ); // Runs AI

  // Close modal if clicking outside of it
  dom.aiGuidanceModal.addEventListener("click", (e) => {
    if (e.target === dom.aiGuidanceModal) hideGuidanceModal();
  });
}

function handleSaveApiKey() {
  const key = dom.apiKeyInput.value.trim();
  if (!key) {
    showAlert("Please enter an API key.", "error");
    return;
  }
  saveApiKey(key);
  checkApiKey();
}

function loadStoryFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const storyId = urlParams.get("story");
  if (storyId) {
    if (stories.some((s) => s.id === storyId)) {
      dom.storySelect.value = storyId;
      handleStorySelect();
    } else {
      showAlert("Story from link not found.", "error");
    }
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

// --- STORY & CHAPTER LOGIC ---

function handleStorySelect() {
  if (
    hasUnsavedChanges &&
    !confirm("Unsaved changes will be lost. Continue?")
  ) {
    dom.storySelect.value = currentStoryId;
    return;
  }
  currentStoryId = dom.storySelect.value;
  currentChapterId = null;
  hasUnsavedChanges = false;

  if (currentStoryId) {
    const story = stories.find((s) => s.id === currentStoryId);
    dom.languageControls.style.display = "block";
    dom.languageSelect.value = story.language || "English";
    dom.editorPanel.style.display = "none";
    dom.welcomePanel.style.display = "flex";
    renderChapterList();
    if (story?.chapters?.length > 0) handleChapterSelect(story.chapters[0].id);
  } else {
    dom.languageControls.style.display = "none";
    dom.chapterList.innerHTML = "";
    dom.chapterListTitle.textContent = "Chapters";
    dom.editorPanel.style.display = "none";
    dom.welcomePanel.style.display = "flex";
  }
  updateWordCount(); // Reset word count to 0
}

function handleChapterSelect(chapterId) {
  if (hasUnsavedChanges && !confirm("Unsaved changes will be lost. Continue?"))
    return;

  const story = stories.find((s) => s.id === currentStoryId);
  const chapter = story.chapters.find((c) => c.id === chapterId);
  if (chapter) {
    currentChapterId = chapterId;
    dom.editor.innerHTML = formatAiResponse(chapter.content).replace(
      /\n/g,
      "<br>"
    );
    dom.editorChapterTitle.textContent = chapter.title;
    dom.editorPanel.style.display = "flex";
    dom.welcomePanel.style.display = "none";
    hasUnsavedChanges = false;
    renderChapterList();
    updateWordCount(); // Update word count for new chapter
  }
}

function saveCurrentChapter() {
  if (!currentStoryId || !currentChapterId) return;
  const story = stories.find((s) => s.id === currentStoryId);
  const chapter = story.chapters.find((c) => c.id === currentChapterId);

  const contentToSave = dom.editor.innerHTML
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<b>/g, "*")
    .replace(/<\/b>/g, "*");
  chapter.content = contentToSave;

  saveFullStory(story);
  hasUnsavedChanges = false;
  showAlert("Chapter saved!", "success", 2000);
}

function handleNewStory() {
  const title = prompt("Enter a title for your new story:");
  if (!title) return;
  const newStory = {
    id: `story_${Date.now()}`,
    title: title,
    savedAt: new Date().toISOString(),
    language: "English",
    details: {
      protagonist: { name: "" },
      setting: { location: "" },
      conflict: "",
    },
    chapters: [{ id: `ch_${Date.now()}`, title: "Chapter 1", content: "" }],
  };
  saveFullStory(newStory);
  loadAndRenderStories();
  dom.storySelect.value = newStory.id;
  handleStorySelect();
}

function handleLanguageChange() {
  if (!currentStoryId) return;
  const story = stories.find((s) => s.id === currentStoryId);
  story.language = dom.languageSelect.value;
  saveFullStory(story);
  showAlert(`Story language set to ${story.language}.`, "success");
}

// Other handlers (rename, delete, add chapter) remain largely the same...
function handleRenameStory() {
  if (!currentStoryId) {
    showAlert("Select a story to rename.", "info");
    return;
  }
  const story = stories.find((s) => s.id === currentStoryId);
  const newTitle = prompt("Enter new story title:", story.title);
  if (newTitle && newTitle !== story.title) {
    story.title = newTitle;
    saveFullStory(story);
    loadAndRenderStories();
    dom.storySelect.value = currentStoryId;
  }
}
function handleDeleteStory() {
  if (!currentStoryId) {
    showAlert("Select a story to delete.", "info");
    return;
  }
  const story = stories.find((s) => s.id === currentStoryId);
  if (
    confirm(
      `Are you sure you want to delete the story "${story.title}"? This cannot be undone.`
    )
  ) {
    deleteStory(currentStoryId);
    currentStoryId = null;
    currentChapterId = null;
    loadAndRenderStories();
    handleStorySelect();
  }
}
function handleAddChapter() {
  if (!currentStoryId) {
    showAlert("Select a story first.", "info");
    return;
  }
  const story = stories.find((s) => s.id === currentStoryId);
  const chapterTitle = prompt(
    "Enter new chapter title:",
    `Chapter ${story.chapters.length + 1}`
  );
  if (chapterTitle) {
    const newChapter = {
      id: `ch_${Date.now()}`,
      title: chapterTitle,
      content: "",
    };
    story.chapters.push(newChapter);
    saveFullStory(story);
    renderChapterList();
    handleChapterSelect(newChapter.id);
  }
}
function handleRenameChapter(chapterId) {
  const story = stories.find((s) => s.id === currentStoryId);
  const chapter = story.chapters.find((c) => c.id === chapterId);
  const newTitle = prompt("Enter new chapter title:", chapter.title);
  if (newTitle && newTitle !== chapter.title) {
    chapter.title = newTitle;
    saveFullStory(story);
    renderChapterList();
    if (chapter.id === currentChapterId) {
      dom.editorChapterTitle.textContent = newTitle;
    }
  }
}
function handleDeleteChapter(chapterId) {
  const story = stories.find((s) => s.id === currentStoryId);
  if (story.chapters.length <= 1) {
    showAlert("Cannot delete the last chapter.", "error");
    return;
  }
  const chapter = story.chapters.find((c) => c.id === chapterId);
  if (confirm(`Are you sure you want to delete chapter "${chapter.title}"?`)) {
    story.chapters = story.chapters.filter((c) => c.id !== chapterId);
    saveFullStory(story);
    if (chapterId === currentChapterId) {
      currentChapterId = null;
      dom.editorPanel.style.display = "none";
      dom.welcomePanel.style.display = "flex";
    }
    renderChapterList();
  }
}

// --- AI FEATURE HANDLERS ---
async function performAiAction(promptText, loadingMessage) {
  if (!genAIInitialized) {
    showAlert("Please save a valid API Key first.", "error");
    return null;
  }

  const story = stories.find((s) => s.id === currentStoryId);
  const language = story.language || "English";
  const fullPrompt = `You are a creative writer writing in ${language}. ${promptText}`;

  showAlert(loadingMessage, "info", 10000);
  try {
    const result = await generateStorySegment(fullPrompt);
    document.querySelector(".alert-info")?.remove();
    return result;
  } catch (e) {
    showAlert(`AI generation failed: ${e.message}`, "error");
    return null;
  }
}

function showGuidanceModal() {
  const currentText = dom.editor.innerText;
  if (!currentText.trim()) {
    showAlert("Please write some content first.", "info");
    return;
  }
  dom.guidanceInput.value = ""; // Clear previous input
  dom.aiGuidanceModal.style.display = "block";
}

function hideGuidanceModal() {
  dom.aiGuidanceModal.style.display = "none";
}

async function handleGenerateContinuation() {
  const guidance = dom.guidanceInput.value.trim();
  const minWords = dom.minWordsInput.value;
  const maxWords = dom.maxWordsInput.value;
  const currentText = dom.editor.innerText;

  let promptText = `Continue the following story segment, writing between ${minWords} and ${maxWords} words.`;
  if (guidance) {
    promptText += ` The user wants the following to happen: "${guidance}".`;
  }
  promptText += `\n\nSTORY SO FAR:\n${currentText}`;

  hideGuidanceModal(); // Hide modal immediately
  const result = await performAiAction(promptText, "Continuing story...");

  if (result) {
    dom.editor.innerHTML += `<br>${formatAiResponse(result).replace(
      /\n/g,
      "<br>"
    )}`;
    hasUnsavedChanges = true;
    updateWordCount();
  }
}

async function handleAiRewrite() {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  if (!selectedText) {
    showAlert("Please select some text to rewrite.", "info");
    return;
  }

  const promptText = `Rewrite the following text in a more engaging or descriptive way: "${selectedText}"`;
  const result = await performAiAction(promptText, "Rewriting text...");

  if (result) {
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const formattedNode = document.createElement("span");
    formattedNode.innerHTML = formatAiResponse(result);
    range.insertNode(formattedNode);
    hasUnsavedChanges = true;
    updateWordCount();
  }
}

async function handleAiTitle() {
  const currentText = dom.editor.innerText;
  if (currentText.trim().length < 50) {
    showAlert("Not enough content to suggest a title.", "info");
    return;
  }
  const promptText = `Based on the following text, suggest a short, compelling chapter title (title only, no extra text):\n\n${currentText.substring(
    0,
    1000
  )}`;
  const result = await performAiAction(promptText, "Generating title...");

  if (result) {
    const cleanTitle = result.replace(/["*]/g, "").trim();
    if (confirm(`Suggest title: "${cleanTitle}".\n\nUse this title?`)) {
      const story = stories.find((s) => s.id === currentStoryId);
      const chapter = story.chapters.find((c) => c.id === currentChapterId);
      chapter.title = cleanTitle;
      dom.editorChapterTitle.textContent = cleanTitle;
      hasUnsavedChanges = true;
      renderChapterList();
    }
  }
}

async function handleAiNextChapter() {
  if (!currentStoryId) return;
  saveCurrentChapter();

  const story = stories.find((s) => s.id === currentStoryId);
  const nextChapterNumber = story.chapters.length + 1;

  const storyContext = story.chapters
    .map((c, i) => `Chapter ${i + 1} - "${c.title}":\n${c.content}`)
    .join("\n\n---\n\n");

  const promptText = `You are an assistant helping write a story chapter by chapter.
  
  The story so far contains ${story.chapters.length} chapter(s). Your job is to write Chapter ${nextChapterNumber}.
  Use the previous chapters as context and continue the story naturally.
  
  STORY CONTEXT:
  ${storyContext}
  
  Begin Chapter ${nextChapterNumber} now.`;

  const result = await performAiAction(promptText, "Drafting next chapter...");

  if (result) {
    const newChapterTitle = `Chapter ${nextChapterNumber}`;
    const newChapter = {
      id: `ch_${Date.now()}`,
      title: newChapterTitle,
      content: result,
    };
    story.chapters.push(newChapter);
    saveFullStory(story);
    renderChapterList();
    handleChapterSelect(newChapter.id); // Also updates word count
    showAlert(`Started ${newChapterTitle}!`, "success");
  }
}

async function handleGenerateFirstChapter() {
  if (!currentStoryId) {
    showAlert("Please select or create a story first.", "info");
    return;
  }
  const story = stories.find((s) => s.id === currentStoryId);
  const chapter = story.chapters[0];

  if (
    chapter.content.trim() !== "" &&
    !confirm("This will replace Chapter 1 content. Are you sure?")
  )
    return;

  const protagonist = prompt(
    "Who is the main character?",
    story.details?.protagonist?.name
  );
  if (protagonist === null) return;
  const setting = prompt(
    "Where and when does the story take place?",
    story.details?.setting?.location
  );
  if (setting === null) return;
  const conflict = prompt(
    "What is the main goal or conflict?",
    story.details?.conflict
  );
  if (conflict === null) return;

  story.details = {
    protagonist: { name: protagonist },
    setting: { location: setting },
    conflict,
  };
  const promptText = `Write the opening for a story. Protagonist: ${protagonist}. Setting: ${setting}. Main Conflict: ${conflict}. Make it engaging and set the scene well.`;
  const result = await performAiAction(
    promptText,
    "Generating first chapter..."
  );

  if (result) {
    chapter.content = result;
    saveFullStory(story);
    handleChapterSelect(chapter.id); // Also updates word count
    showAlert("First chapter generated!", "success");
  }
}

// --- STARTUP ---
document.addEventListener("DOMContentLoaded", init);
