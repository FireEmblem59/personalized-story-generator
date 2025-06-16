// src/randomizer.js

/**
 * A collection of inspirational arrays for story generation.
 */
export const inspiration = {
  "protagonist-name": [
    "Kaelen",
    "Seraphina",
    "Jax",
    "Lyra",
    "Orion",
    "Elara",
    "Zane",
    "Aria",
    "Ryker",
    "Nova",
    "Mayline",
  ],
  "protagonist-occupation": [
    "Aether-weaver",
    "Sunken Treasure Hunter",
    "Chrono-Navigator",
    "Void-Cartographer",
    "Dream Architect",
    "Roboticist Monk",
    "Star-charting Librarian",
    "Quantum Biologist",
    "Forgotten God Caretaker",
  ],
  "setting-location": [
    "The Sunken City of Aeridor",
    "The Clockwork Jungle of Technia",
    "The Crystal Spire of Lunara",
    "The Star-Sailor's Graveyard",
    "The Whispering Salt Flats",
    "Neo-Alexandria, the Cyber-Library",
    "The Floating Markets of Xylos",
    "The Obsidian Fortress of Voltar",
  ],
  "setting-time": [
    "The Third Galactic Age",
    "The Age of Shattered Moons",
    "The Era of the Great Silence",
    "The First Electric Century",
    "The Time Before The Stars Faded",
    "The Epoch of Rust and Revival",
  ],
  conflict: [
    "to reverse a cybernetic plague",
    "to find a legendary power source before it falls into the wrong hands",
    "to deliver a secret message that could end a galactic war",
    "to explore a newly discovered, sentient planet",
    "to restore the memories of a dying AI god",
    "to escape a time loop that resets every 24 hours",
    "to find the last seed of a world-tree in a city of steel",
  ],
  "sidekick-name": [
    "Zorp",
    "Glitch",
    "Pip",
    "Echo",
    "Bolt",
    "Unit 734",
    "Cinder",
    "Whisper",
  ],
  "sidekick-personality": [
    "a cynical but loyal robot",
    "a mischievous, shapeshifting alien",
    "a holographic ghost from a forgotten era",
    "a genetically-engineered battle-corgi",
    "an overly optimistic navigation AI",
  ],
  "antagonist-name": [
    "The Void-Chancellor",
    "Mother",
    "The Chrome Tyrant",
    "The Silent King",
    "The Crimson Alchemist",
    "The Architect of Echoes",
    "The Collector",
  ],
  "antagonist-traits": [
    "a being of pure energy",
    "a rogue military AI hive-mind",
    "a corporate entity that has achieved sentience",
    "a psychic entity that feeds on memories",
    "the last survivor of an ancient, vengeful race",
  ],
  "antagonist-motivation": [
    "to consume all stars for power",
    "to enforce perfect, logical order upon the universe",
    "to collect one of every living species, forever",
    "to erase magic from existence",
    "to find its creator by any means necessary",
  ],
};

/**
 * Picks a random item from an array.
 * @param {Array<string>} array The array to pick from.
 * @returns {string} A random item from the array.
 */
export function getRandomItem(array) {
  if (!array || array.length === 0) return "";
  return array[Math.floor(Math.random() * array.length)];
}
