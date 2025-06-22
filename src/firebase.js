// src/firebase.js
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCAuwWbPS1qJsJOiPcuU15nW4rV8tcY25M",
  authDomain: "ai-story-weaver-9e9da.firebaseapp.com",
  projectId: "ai-story-weaver-9e9da",
  storageBucket: "ai-story-weaver-9e9da.firebasestorage.app",
  messagingSenderId: "456225563755",
  appId: "1:456225563755:web:f9a8aa3a19bef200bd7d2e",
  measurementId: "G-V4BNNPCRQ2",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storiesCollection = collection(db, "stories");

/**
 * Saves a story to Firestore and returns the unique ID.
 * @param {object} storyObject - The story data to save.
 * @returns {Promise<string>} The unique ID of the saved story.
 */
export async function saveStoryToFirebase(storyObject) {
  storyObject.sharedAt = serverTimestamp();
  const docRef = await addDoc(storiesCollection, storyObject);
  return docRef.id;
}

/**
 * Loads a story from Firestore using its unique ID.
 * @param {string} storyId - The ID of the story to fetch.
 * @returns {Promise<object|null>} The story data, or null if not found.
 */
export async function loadStoryFromFirebase(storyId) {
  const docRef = doc(db, "stories", storyId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const storyData = docSnap.data();
    // The document ID is not part of the data, so we add it back in.
    storyData.id = docSnap.id;
    return storyData;
  } else {
    console.error("No such story found in Firebase!");
    return null;
  }
}
