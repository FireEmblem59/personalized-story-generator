import { storyState } from "./state.js";

const STORAGE_KEY = "aiStories";
const API_KEY = "geminiApiKey";

export function saveApiKey(apiKey) {
  localStorage.setItem(API_KEY, apiKey);
}

export function getApiKey() {
  return localStorage.getItem(API_KEY);
}

/**
 * Saves a story from the Guided Generator view (create.html).
 * It converts the turn-by-turn history into a single chapter.
 */
export function saveStoryFromGenerator() {
  const stories = getStories();
  const storyId = storyState.createdAt || new Date().toISOString();

  const existingIndex = stories.findIndex((s) => s.id === storyId);

  if (existingIndex !== -1) {
    // Story exists, likely from a previous 'turn'. Overwrite its content.
    const existingStory = stories[existingIndex];
    if (!existingStory.chapters) existingStory.chapters = [];
    if (existingStory.chapters.length === 0) {
      existingStory.chapters.push({
        id: `ch_${Date.now()}`,
        title: "Chapter 1",
        content: "",
      });
    }
    existingStory.chapters[0].content = storyState.history.join("\n\n");
    existingStory.savedAt = new Date().toISOString();

    // Ensure language and details are carried over
    existingStory.language = storyState.config.language;
    existingStory.details = storyState.details;

    stories[existingIndex] = existingStory;
  } else {
    // This is a brand new story from the generator.
    const newStory = {
      id: storyId,
      title: `${storyState.details.protagonist.name}'s ${storyState.config.template} Adventure`,
      savedAt: new Date().toISOString(),
      // Save language and details for AI context
      language: storyState.config.language || "English",
      details: storyState.details,
      chapters: [
        {
          id: `ch_${Date.now()}`,
          title: "Chapter 1",
          content: storyState.history.join("\n\n"),
        },
      ],
    };
    stories.push(newStory);
    updateStoryState({ createdAt: storyId });
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
  return storyId;
}

/**
 * Saves a complete story object, typically from the Chapter View.
 * @param {object} storyObject The complete story object to save or update.
 */
export function saveFullStory(storyObject) {
  const stories = getStories();
  const existingIndex = stories.findIndex((s) => s.id === storyObject.id);
  storyObject.savedAt = new Date().toISOString();

  if (existingIndex !== -1) {
    stories[existingIndex] = storyObject;
  } else {
    stories.push(storyObject);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
}

export function getStories() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function loadStory(storyId) {
  const stories = getStories();
  const story = stories.find((s) => s.id === storyId);
  if (!story) throw new Error("Story not found");
  return story;
}

export function deleteStory(storyId) {
  const stories = getStories().filter((s) => s.id !== storyId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
}
