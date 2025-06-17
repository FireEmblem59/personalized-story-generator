import { generateStorySegment } from "./api.js";
import { storyState, updateStoryState } from "./state.js";

const PROMPT_TEMPLATE = (
  config,
  details,
  history,
  choice = null,
  isFinal = false
) => {
  const { language, minWords, maxWords, numChoices, template, storyType } =
    config;
  const { protagonist, setting, conflict, sidekick, antagonist } = details;

  let prompt = `You are a creative storyteller writing a ${template} ${storyType} in ${language}. `;

  // Story context
  prompt += `Protagonist: ${protagonist.name}, ${protagonist.age} year old ${protagonist.occupation}. `;
  prompt += `Setting: ${setting.time} in ${setting.location}. `;
  prompt += `Central conflict: ${conflict}. `;

  if (sidekick.name)
    prompt += `Sidekick: ${sidekick.name}, ${sidekick.personality}. `;
  if (antagonist.name)
    prompt += `Antagonist: ${antagonist.name}, ${antagonist.traits}, motivated by ${antagonist.motivation}. `;

  // History management
  if (history.length > 0) {
    prompt += `\n\nSTORY SO FAR:\n${history.join("\n\n")}\n\n`;
  }

  // Action context
  if (choice) {
    prompt += `After this, ${protagonist.name} decides to: ${choice}\n\n`;
  }

  // Generation instructions
  prompt += `Generate the next story segment (between ${minWords} and ${maxWords} words). `;

  if (isFinal) {
    prompt += "Provide a conclusive ending. Do NOT include choices.";
  } else {
    prompt += `End with exactly ${numChoices} choices formatted as:\n`;
    for (let i = 1; i <= numChoices; i++) {
      prompt += `CHOICE ${i}: [Option ${i} description]\n`;
    }
  }

  return prompt;
};

export async function startNewStory() {
  const { config, details } = storyState;
  const prompt = PROMPT_TEMPLATE(config, details, []);
  const rawResponse = await generateStorySegment(prompt);
  return parseGeminiResponse(rawResponse);
}

export async function continueStory(choiceText) {
  const { config, details, history } = storyState;
  const isFinal = history.length >= config.maxTurns - 1;

  const prompt = PROMPT_TEMPLATE(config, details, history, choiceText, isFinal);

  const rawResponse = await generateStorySegment(prompt);
  return parseGeminiResponse(rawResponse);
}

export function parseGeminiResponse(responseText) {
  if (!responseText) throw new Error("Empty response from AI");

  // Extract choices
  const choices = [];
  const choiceRegex = /CHOICE\s*(\d):\s*(.*)/gi;
  let match;

  while ((match = choiceRegex.exec(responseText)) !== null) {
    choices.push(match[2].trim());
  }

  // Remove choices from story text
  const storyText = responseText.replace(choiceRegex, "").trim();

  return {
    story: storyText,
    choices: choices.filter(Boolean),
  };
}
