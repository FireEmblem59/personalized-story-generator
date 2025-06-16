const savedLanguage = localStorage.getItem("language") || "English";

export const storyState = {
  apiKey: null,
  config: {
    language: savedLanguage,
    template: "fantasy",
    storyType: "short-story",
    words: "150-200",
    numChoices: 4,
    maxTurns: 5,
  },
  details: {
    protagonist: { name: "", age: "", occupation: "" },
    setting: { time: "", location: "" },
    conflict: "",
    sidekick: { name: "", personality: "" },
    antagonist: { name: "", traits: "", motivation: "" },
  },
  history: [],
  currentChoices: [],
  turn: 0,
  createdAt: null,
};

export function updateStoryState(updates) {
  Object.assign(storyState, updates);

  // Update timestamps
  if (!storyState.createdAt) {
    storyState.createdAt = new Date().toISOString();
  }
  storyState.updatedAt = new Date().toISOString();
}

export function resetStoryState() {
  Object.assign(storyState, {
    history: [],
    currentChoices: [],
    turn: 0,
    createdAt: null,
    updatedAt: null,
  });
}
