import { storyState } from "./state.js";

const STORAGE_KEY = "aiStories";
const API_KEY = "geminiApiKey";

export function saveApiKey(apiKey) {
  localStorage.setItem(API_KEY, apiKey);
}

export function getApiKey() {
  return localStorage.getItem(API_KEY);
}

export function saveStory() {
  const stories = getStories();
  const storyId = storyState.createdAt || new Date().toISOString(); // Use existing or generate new

  const storyData = {
    ...storyState,
    id: storyId,
    title: `${storyState.config.template} story about ${storyState.details.protagonist.name}`,
    savedAt: new Date().toISOString(),
  };

  const existingIndex = stories.findIndex((s) => s.id === storyId);
  if (existingIndex !== -1) {
    stories[existingIndex] = storyData;
  } else {
    stories.push(storyData);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
  return storyId;
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
