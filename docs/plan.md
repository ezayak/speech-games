# Speech-recovery games for Alex (EN / UK / Egyptian Arabic)

## Status
*Last updated: 2026-10-13*

- [x] **1a** Project skeleton, plus a category home screen with a language picker (EN / УКР / مصري / فصحى)
- [x] **1b** Word list (`data/content.json`) and the sentence and audio generator (`tools/gen.mjs`)
  - Produces 271 phrases (1,084 audio files) since the box lost "on"
- [x] **1b-audio** Azure key set up (region `swedencentral`); all 1,132 MP3s generated
- [x] **1c** Audio playback (10-second safety limit), content loading, scene builder
- [x] **1d** **Where Is It?** game, with 3 modes:
  - 📖 *Learn*: the word, a picture and the written sentence, all spoken
  - 👆 *Understand*
  - ✋ *Do it* (drag-and-drop)
  - 3 adaptive levels
  - The furniture is drawn in code (`src/ui/furniture.ts`), so "in", "on" and "under" look right on every device.
  - The box no longer has "on".
- [ ] **1d-check** Try it with Alex, and listen to the Ukrainian and Arabic audio

## Open questions
- Should the Arabic sentence text in Learn mode be bigger? It currently looks smaller than the English.
- For 1e: is there a GitHub account to host the app on (free GitHub Pages)?
- Are any generated words mispronounced, especially in Egyptian Arabic? If so, fix them in `data/content.json` or wait for voice recordings in Stage 5.
- [ ] **1e** Install as an app (PWA, works offline) and deploy online
- [ ] **Stage 2** Read & Match
- [ ] **Stage 3** Follow Instructions and Teacher Says
- [ ] **Stage 4** Big & Small and Taste It
- [ ] **Stage 5** Parent mode: recording your own voice and progress statistics
- [ ] **Later** The remaining games, in the order you choose after seeing how Alex responds

## Context
Alex is a child. He had a hemorrhagic stroke 6 months ago and now has aphasia, with problems both understanding and speaking.

What he can already do:
- Sing songs, count, and do some maths.
- Use his left hand well, so drag-and-drop is fine.
- Attend school, which is taught in English. He is trying to follow what is said in class.

What he needs from the games:
- Practice **understanding**, **speaking** and **reading** in 3 languages.
- **Concept** work: position, size and taste.
- **School** language.

How the app should work:
- It says words out loud. There is no speech recognition: the parent judges whether he said the word.
- It runs on a tablet.
- The games are released one at a time, so each can be tried and improved before the next.
- The games are **grouped into categories**, so you can quickly pick what to practice.

## Therapy principles the games follow
1. **Errorless learning and cueing.** A wrong answer never buzzes. The help steps up instead: the word is repeated, then the wrong choices fade, then the answer is shown.
2. **Graded difficulty.** Every game has levels:
   - Level 1: 2 choices and single words.
   - Level 2: 3–4 choices and short phrases.
   - Level 3: 4–6 choices, full sentences and two-step instructions.
   - The level goes up automatically after 4 of 5 correct and down after repeated misses.
3. **Personal, high-frequency words.** Parents can add their own photos and voice.
4. **Short sessions** of 5–10 minutes, with a calm screen and no timers.
5. **One language per session.** An optional "bridge" mode plays the word in his strongest language and then the target language. *Share the language plan with his speech therapist.*
6. **Reading with sound support.** Every word and sentence on screen can be tapped to hear it.

## Categories and games
The home screen has 5 large category tiles, then a list of games in each one, then the language and level.

| Category | Game | What he does |
|---|---|---|
| 👂 **Listening** | Listen & Tap | Hears a phrase ("the big red ball") and taps the right picture. |
| | Follow Instructions | "Put the apple in the box, then give the pencil to the teacher." He drags items to follow the instruction. |
| | Yes / No | "Is the cat under the table?" Big ✓ and ✗ buttons. |
| | Story Time | Hears a short 3–5 sentence story with pictures, then answers who / what / where questions by tapping. |
| 🧩 **Concepts** | Where Is It? ✅ | Position words: on, under, in, behind, in front of, next to (*between* comes later). Three modes: 📖 *Learn* (word + picture + written sentence, all spoken), 👆 *Understand* (tap the matching scene), ✋ *Do it* (drag the object to that place). |
| | Big & Small | Sizes: big and small, then bigger and biggest, then sorting 3–5 objects by size by dragging. |
| | Taste It | Sweet, sour, salty, bitter and spicy. He drags foods into taste baskets, or answers "Which one is sour?" |
| | Opposites *(later)* | Hot and cold, full and empty, long and short. |
| 🗣 **Speaking** | Say It | Shows a picture, waits, then steps through the hints: meaning hint, first sound, whole word. He says it aloud and the parent taps 😀 / 🙂 / ➡. |
| | Finish the Sentence | "I drink…" → water. He says it, and picture choices are offered as a backup. |
| | Tell Me About It | Shows a scene and prompts "What is he doing? Where is it? Is it big?" |
| 📖 **Reading** | Read & Match | Drags the written word onto its picture. |
| | Pick the Word | Sees a picture and chooses the right written word from 2–4. |
| | Read the Sentence | Reads a sentence and taps the matching picture ("The cat is on the box"). |
| | Read Aloud | Reads a word or sentence aloud, then taps 🔊 to hear the model and compare. |
| 🏫 **School** (English first) | Classroom Words | Pencil, book, teacher, board, bag and so on, played through the Listening and Reading game types. |
| | Teacher Says | Common classroom instructions: "Open your book", "Line up", "Raise your hand". He taps or drags the matching action. |
| | Question Words | Who, what, where, when, explained with pictures. |

The categories reuse the same game engines with different word sets, so adding content later doesn't require new code.

## Languages
- **Spoken audio:** English (`en`), Ukrainian (`uk`), Egyptian Arabic (`arz`).
- **Reading text:** English, Ukrainian, Egyptian Arabic spelled as spoken at home, and Standard Arabic as at school (`ar`).
- **Arabic layout:** both Arabic variants are shown right-to-left, with optional vowel marks (harakat).
- **Standard Arabic audio** uses the same Egyptian voice.
- **Checking:** you check the Ukrainian and both Arabic wordings in `data/content.json` before each release.

## Technical solution
- **App type:** an installable web app (PWA) that works **offline** on iPad and Android. Hosted for free on GitHub Pages or Netlify.
- **Stack:** Vite + TypeScript, written as plain DOM code with no framework. It uses Node 22 (`nvm use`, set by `.nvmrc`).
- **Drag-and-drop:** works with finger or stylus. Drop zones are generous, items snap into place, and tap-then-tap also works.
- **Voices (two layers):**
  1. **Generated voices from the Azure Speech free tier (F0)**, created ahead of time as MP3 files. The free `edge-tts` service was blocked (403) on 2026-10-13, so it isn't used.
     - English: `en-US-AnaNeural` (a child voice)
     - Ukrainian: `uk-UA-PolinaNeural`
     - Egyptian Arabic: `ar-EG-SalmaNeural`, used for both the Egyptian and Standard Arabic text
     - Speech is set 15% slower than normal.
     - The key is kept only in your terminal (`AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`) and is never saved in the project.
  2. **Family recordings** (Stage 5). In parent mode, record a word. The recording stays on the tablet and replaces the generated voice for that word.
- **Pictures:**
  - Emoji for the objects that move (cat, dog, ball, teddy, apple, book).
  - The **furniture is drawn in code** (`src/ui/furniture.ts`), not with emoji. Emoji look different on each device and don't show where the surfaces are, which made "on" float and "under" hidden.
  - Each scene is drawn in 5 layers: behind/under objects → inside of box or bag → "in" objects → front of furniture → on / in front / next-to objects. That is what makes "in" look inside and "behind" look behind.
  - Picture cards are 300–340 px and centred; the Learn picture is up to 440 px.
  - Sizes are drawn by scaling the same picture.
  - ARASAAC pictograms for actions, plus your own photos.
- **Content:**
  - `data/content.json` is the file you edit. It holds:
    - the words, with Ukrainian case forms and the Arabic "the" form;
    - the position words;
    - the sentence patterns.
  - `tools/gen.mjs` builds every sentence into `data/phrases.json`. It makes MP3s only for new or changed sentences and records which text each MP3 was made from in `public/audio/manifest.json`.
- **Progress:** the tablet keeps a record per game and per word: tries, correct answers, hints and level.

## Where Is It? in detail
- **Session:** 10 rounds, then an end screen with ⭐ for each round right first time, and ↻ / ← buttons.
- **Top bar:** ← back, the mode buttons 📖 👆 ✋, a level indicator ●○○ (for the parent), 🔊 replay, and a progress bar.
- **Learn:** one screen per preposition (on → under → in → behind → in front of → next to).
  - It says the word, pauses, then says the example sentence.
  - Tap the word, picture or sentence to hear it again.
  - ◀ ▶ move between prepositions; 🔄 shows another example.
  - Arabic text is right-to-left; the arrows always keep left = back.
  - Not scored.
- **Understand:** he hears "The cat is under the table" and taps the matching picture.
  - A wrong picture fades out, the game says "Listen again", and the sentence repeats.
- **Do it:** he hears "Put the cat under the table" and drags the object from the tray, or taps it and then taps the place.
  - The object snaps to the nearest allowed spot; a drop far from any spot just returns it to the tray.
  - A wrong spot shows for about 1 second, then that option is removed and the sentence repeats.
- **Levels** (saved per language): up after 4 of the last 5 right first time, down after 2 misses in a row.

| Level | Positions used | Understand | Do it |
|---|---|---|---|
| 1 | on, under, in | 2 pictures | 2 places |
| 2 | + behind, in front of | 3 pictures | 3 places |
| 3 | + next to | 4 pictures | every place the furniture allows |

- **Furniture and allowed positions:**
  - table: on, under, behind, in front of, next to
  - chair: on, under, behind, in front of, next to
  - bed: on, under, next to
  - box: in, behind, in front of, next to ("on" was removed because it looked too much like "in")
  - bag: in, behind, in front of, next to

## File layout
```
package.json, tsconfig.json, .nvmrc       # done
index.html, src/style.css, src/main.ts    # done: home screen + categories
data/content.json                         # done: words, positions, sentence patterns
data/phrases.json                         # generated: every sentence in 4 languages
tools/gen.mjs                             # done: sentence expansion + Azure audio
public/audio/{en,uk,arz,ar}/*.mp3         # generated by tools/gen.mjs
src/core/audio.ts                         # done: play(id, lang), 10 s safety limit
src/core/content.ts                       # done: words, phrases, shuffle/pick
src/core/drag.ts                          # done: drag + tap-then-tap
src/core/level.ts                         # done: adaptive levels, saved per game + language
src/ui/dom.ts                             # done: el() helper
src/ui/furniture.ts                       # done: furniture drawings + surface positions
src/ui/scene.ts                           # done: builds position scenes, finds nearest drop spot
src/games/where.ts                        # done: Where Is It? (Learn / Understand / Do it)
public/img/table.svg                      # table picture (not used by scenes any more)
src/core/progress.ts                      # later: per-word progress log
src/core/parent.ts                        # Stage 5: recordings + statistics
```

## How to generate audio
Run these **one at a time**, not pasted together. If they're pasted together, `read` takes the next line as the key and Azure answers 401.
```bash
cd ~/projects/alex-stroke-game && nvm use
read -s -p "Azure key: " AZURE_SPEECH_KEY; echo; export AZURE_SPEECH_KEY
echo ${#AZURE_SPEECH_KEY}          # should print 32 or 84
export AZURE_SPEECH_REGION=swedencentral
node tools/gen.mjs
```
- After changing `data/content.json`, run `node tools/gen.mjs` again. Only new or changed sentences are sent to Azure. Without the key it just updates `data/phrases.json`.
- The free tier allows about 20 requests a minute, so a full run takes about an hour.
- Ctrl+C is safe: the next run continues where it stopped.
- **Azure set-up notes:**
  - West Europe refused new customers, so the resource is in **Sweden Central**.
  - The "user account does not exist in tenant" error means the Azure sign-up wasn't finished. Fix it at signup.azure.com in a private window.

## Verification
- Test page for pictures: in the browser console on the dev server, import `/src/ui/scene.ts` and draw every furniture × position combination. This is how the "in", "on" and "under" problems were found and fixed.
- Run `npm run dev` and open the app on the tablet. Check:
  - Sound plays in each language.
  - Drag-and-drop is easy with his left hand.
  - Arabic text displays right-to-left.
  - Levels go up and down as expected.
- Listen to the generated Ukrainian and Arabic audio, and replace bad words with a recording.
- After deploying, use "Add to Home Screen" and check that the app works in airplane mode.
