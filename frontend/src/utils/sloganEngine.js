import { SLOGAN_TREASURE } from '../data/slogans';

const HISTORY_KEY = 'bunkbites_slogan_history';
const MAX_HISTORY = 75;

export const getNextSlogan = () => {
  let history = [];
  try {
    const stored = sessionStorage.getItem(HISTORY_KEY);
    if (stored) {
      history = JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to parse slogan history", e);
  }

  let availableSlogans = SLOGAN_TREASURE.filter((slogan) => !history.includes(slogan));

  if (availableSlogans.length === 0) {
    history = [];
    availableSlogans = [...SLOGAN_TREASURE];
  }

  const randomIndex = Math.floor(Math.random() * availableSlogans.length);
  const selectedSlogan = availableSlogans[randomIndex];

  history.push(selectedSlogan);
  
  if (history.length > MAX_HISTORY) {
    history = history.slice(history.length - MAX_HISTORY);
  }

  try {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.error("Failed to save slogan history", e);
  }

  return selectedSlogan;
};

const SUB_SLOGANS = [
  "maybe food will help.",
  "you know what to do.",
  "we've got you.",
  "worth the break.",
  "probably a food problem.",
  "consider this your sign.",
  "the answer is delicious.",
  "future you will understand.",
  "problem solved.",
  "this feels fixable.",
  "one bite should do it.",
  "you know the drill.",
  "food might help.",
  "let's call it self-care.",
  "you deserve the break."
];

export const getNextSubSlogan = () => {
  return SUB_SLOGANS[Math.floor(Math.random() * SUB_SLOGANS.length)];
};
