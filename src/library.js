// src/library.js

import { getStories, deleteStory } from "./storage.js";

// --- DOM Elements ---
const storyGrid = document.getElementById("story-library-grid");
const noStoriesMessage = document.getElementById("no-stories-message");
const storyCardTemplate = document.getElementById("story-card-template");

/**
 * Fetches stories from storage and displays them on the page.
 */
function displayStories() {
  // Clear any existing stories from the grid
  storyGrid.innerHTML = "";

  const stories = getStories();

  if (stories.length === 0) {
    // Show the "no stories" message if the library is empty
    noStoriesMessage.style.display = "block";
    storyGrid.style.display = "none";
  } else {
    // Hide the message and show the grid
    noStoriesMessage.style.display = "none";
    storyGrid.style.display = "grid";

    // Sort stories by most recently saved
    stories.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));

    // Create and append a card for each story
    stories.forEach(createStoryCard);
  }
}

/**
 * Creates a story card element from a story object and appends it to the grid.
 * @param {object} story - The story data object from storage.
 */
function createStoryCard(story) {
  // Clone the template content
  const cardClone = storyCardTemplate.content.cloneNode(true);

  // Get elements from the cloned card
  const cardElement = cardClone.querySelector(".story-card");
  const titleEl = cardClone.querySelector(".story-card-title");
  const excerptEl = cardClone.querySelector(".story-card-excerpt");
  const dateEl = cardClone.querySelector(".story-card-date");
  const loadBtn = cardClone.querySelector(".load-btn");
  const deleteBtn = cardClone.querySelector(".delete-btn");

  // Populate the card with story data
  titleEl.textContent = story.title || "Untitled Story";

  // Create a short excerpt from the first part/chapter of the story
  let excerptText = "No content available.";
  if (story.chapters && story.chapters[0] && story.chapters[0].content) {
    excerptText = story.chapters[0].content;
  } else if (story.history && story.history[0]) {
    // Backwards compatibility for old format
    excerptText = story.history.join("\n\n");
  }
  excerptEl.textContent =
    excerptText.length > 150
      ? excerptText.substring(0, 150) + "…"
      : excerptText;

  // Format the saved date for display
  dateEl.textContent = `Saved: ${new Date(story.savedAt).toLocaleDateString()}`;

  // --- Event Listeners for Card Buttons ---

  // Load Button: Navigates to the chapter view with a URL parameter
  loadBtn.addEventListener("click", () => {
    // This tells chapter-view.html which story to load upon arrival
    window.location.href = `chapter-view.html?story=${story.id}`;
  });

  // Delete Button: Asks for confirmation before deleting
  deleteBtn.addEventListener("click", () => {
    const isConfirmed = confirm(
      `Are you sure you want to permanently delete "${
        story.title || "this story"
      }"?`
    );
    if (isConfirmed) {
      deleteStory(story.id);
      // Re-render the entire library to reflect the deletion
      displayStories();
    }
  });

  // Append the finished card to the grid
  storyGrid.appendChild(cardClone);
}

// --- Initial Setup ---
// When the page is fully loaded, display the stories.
document.addEventListener("DOMContentLoaded", displayStories);
