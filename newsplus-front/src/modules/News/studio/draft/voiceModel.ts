// S16 §3 «إملاء صوتي» (MobNewVoice): the pure parts of voice dictation — the copy (verbatim), the recognition
// settings, the elapsed clock, and the transcript built from the browser's recognition results.
import { toArabicDigits } from "@/utils/arabic";

export const VOICE_COPY = {
  listening: "بسمعك…",
  cancel: "إلغاء",
  stopSend: "إيقاف وإرسال للمحرّر",
  editText: "عدّل النص",
  note: "بالعربي أو الإنجليزي · هيتبعت للمحرّر أول ما توقف",
  /** The dock's mic button (not on a board: MobNewVoice's title «إملاء صوتي للمحرّر»). */
  mic: "إملاء صوتي",
} as const;

/** Egyptian Arabic; English words come through as spoken. */
export const VOICE_LANG = "ar-EG";
/** Listening stops by itself after this long without new speech… */
export const VOICE_SILENCE_MS = 2_000;
/** …or after this long in all. */
export const VOICE_MAX_MS = 60_000;

/** MobNewVoice's `wave`: bar heights and delays, as drawn on the board. */
export const VOICE_WAVE: ReadonlyArray<{ height: string; delay: string }> = [
  { height: "14px", delay: "0.00s" },
  { height: "26px", delay: "0.10s" },
  { height: "36px", delay: "0.20s" },
  { height: "22px", delay: "0.30s" },
  { height: "32px", delay: "0.15s" },
  { height: "40px", delay: "0.05s" },
  { height: "18px", delay: "0.25s" },
  { height: "30px", delay: "0.35s" },
  { height: "24px", delay: "0.12s" },
  { height: "38px", delay: "0.22s" },
  { height: "16px", delay: "0.32s" },
  { height: "28px", delay: "0.08s" },
  { height: "34px", delay: "0.18s" },
  { height: "20px", delay: "0.28s" },
];

/** «٠:٠٦» — whole minutes and seconds since listening started. */
export function elapsedLabel(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return toArabicDigits(`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`);
}

export type RecognitionPiece = { transcript: string; isFinal: boolean };
export type Transcript = { final: string; interim: string };

function join(a: string, b: string): string {
  return a && b ? `${a} ${b}` : a || b;
}

/**
 * The transcript so far from every recognition result of the session: the settled text and the part still being
 * heard (shown in `--ink-3`). Chrome on Android repeats the whole utterance in each result; a result that only
 * extends (or repeats) the text before it replaces it instead of being added twice.
 */
export function composeTranscript(results: readonly RecognitionPiece[]): Transcript {
  let final = "";
  let interim = "";
  for (const piece of results) {
    const text = piece.transcript.replace(/\s+/g, " ").trim();
    if (!text) continue;
    if (piece.isFinal) {
      if (final && text.startsWith(final)) final = text;
      else if (!final.endsWith(text)) final = join(final, text);
    } else {
      interim = join(interim, text);
    }
  }
  if (final && interim.startsWith(final)) interim = interim.slice(final.length).trim();
  return { final, interim };
}

/** What «إيقاف» sends and «عدّل النص» moves into the field: everything heard, as shown. */
export function transcriptText({ final, interim }: Transcript): string {
  return join(final, interim).trim();
}
