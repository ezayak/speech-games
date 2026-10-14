// The one list of categories and games, used by the home screen and the recording page.
export interface Game {
  id: string; icon: string; name: string; ready: boolean;
  sounds?: string;   // id prefix of this game's audio, for the recording page
}
export interface Category { id: string; icon: string; name: string; games: Game[] }

export const CATEGORIES: Category[] = [
  { id: 'listening', icon: '👂', name: 'Listening', games: [
    { id: 'listen-tap', icon: '👆', name: 'Listen & Tap', ready: false },
    { id: 'follow', icon: '📦', name: 'Follow Instructions', ready: false },
    { id: 'yes-no', icon: '✅', name: 'Yes / No', ready: false },
    { id: 'story', icon: '📚', name: 'Story Time', ready: false },
  ]},
  { id: 'concepts', icon: '🧩', name: 'Concepts', games: [
    { id: 'where', icon: '📍', name: 'Where Is It?', ready: true, sounds: 'where.' },
    { id: 'size', icon: '🐘', name: 'Big & Small', ready: false },
    { id: 'taste', icon: '🍋', name: 'Taste It', ready: false },
  ]},
  { id: 'speaking', icon: '🗣️', name: 'Speaking', games: [
    { id: 'want', icon: '🙋', name: 'I Want…', ready: true, sounds: 'say.' },
    { id: 'say-it', icon: '💬', name: 'Say It', ready: false },
    { id: 'finish', icon: '✏️', name: 'Finish the Sentence', ready: false },
    { id: 'tell-me', icon: '🖼️', name: 'Tell Me About It', ready: false },
  ]},
  { id: 'reading', icon: '📖', name: 'Reading', games: [
    { id: 'read-match', icon: '🔗', name: 'Read & Match', ready: false },
    { id: 'pick-word', icon: '🔤', name: 'Pick the Word', ready: false },
    { id: 'read-sentence', icon: '📝', name: 'Read the Sentence', ready: false },
    { id: 'read-aloud', icon: '🔊', name: 'Read Aloud', ready: false },
  ]},
  { id: 'school', icon: '🏫', name: 'School', games: [
    { id: 'classroom', icon: '✏️', name: 'Classroom Words', ready: false },
    { id: 'teacher-says', icon: '🧑‍🏫', name: 'Teacher Says', ready: false },
    { id: 'questions', icon: '❓', name: 'Question Words', ready: false },
  ]},
];

export const GAMES = CATEGORIES.flatMap(c => c.games);
