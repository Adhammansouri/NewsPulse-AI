// MobNewVoice (S16 §3) — port of docs/redesign/design/reference/MobNewVoice.dc.html: the listening panel that
// replaces the revise dock — «بسمعك…» with the elapsed time, the live transcript (the part still being heard in
// `--ink-3`, then the caret), the `wave`, «إلغاء» · the stop button (sends what was heard to the editor) · «عدّل
// النص» (moves it into the dock's field), and the note. The panel owns the recognition: it starts when the panel
// mounts and is aborted when it unmounts, so the microphone is never left open. Inline styles are the board's own.
import { useEffect, useRef, useState } from "react";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import {
  composeTranscript,
  elapsedLabel,
  transcriptText,
  VOICE_COPY,
  VOICE_LANG,
  VOICE_MAX_MS,
  VOICE_SILENCE_MS,
  VOICE_WAVE,
  type RecognitionPiece,
  type Transcript,
} from "./voiceModel";

type RecognitionResultList = { length: number; [index: number]: { isFinal: boolean; [alternative: number]: { transcript: string } | undefined } };
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: RecognitionResultList }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  abort(): void;
};
type RecognitionConstructor = new () => Recognition;

function recognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const scope = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

/** The mic shows only where the browser has speech recognition. */
export function voiceSupported(): boolean {
  return recognitionConstructor() !== null;
}

/** How listening ended: «إيقاف» (or the 2s silence / 60s cap) sends, «عدّل النص» (or an error) edits, «إلغاء» drops. */
export type VoiceResult = { action: "send" | "edit" | "cancel"; text: string };

const EMPTY: Transcript = { final: "", interim: "" };
/** The elapsed clock's refresh. */
const TICK_MS = 250;

function readResults(results: RecognitionResultList): RecognitionPiece[] {
  const pieces: RecognitionPiece[] = [];
  for (let index = 0; index < results.length; index += 1) {
    const result = results[index];
    pieces.push({ transcript: result?.[0]?.transcript ?? "", isFinal: Boolean(result?.isFinal) });
  }
  return pieces;
}

function useRecognition(onDone: (result: VoiceResult) => void) {
  const [transcript, setTranscript] = useState<Transcript>(EMPTY);
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(startedAt);
  const finishRef = useRef<((action: VoiceResult["action"]) => void) | null>(null);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });

  useEffect(() => {
    const Constructor = recognitionConstructor();
    let finished = false;
    let latest = EMPTY;
    let silence: number | undefined;
    const tick = window.setInterval(() => setNow(Date.now()), TICK_MS);
    const recognition = Constructor ? new Constructor() : null;

    function release() {
      window.clearInterval(tick);
      window.clearTimeout(silence);
      window.clearTimeout(cap);
      if (!recognition) return;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.abort();
      } catch {
        /* already stopped */
      }
    }

    function finish(action: VoiceResult["action"]) {
      if (finished) return;
      finished = true;
      release();
      doneRef.current({ action, text: transcriptText(latest) });
    }

    const cap = window.setTimeout(() => finish("send"), VOICE_MAX_MS);
    finishRef.current = finish;

    if (!recognition) {
      finish("cancel");
    } else {
      recognition.lang = VOICE_LANG;
      recognition.interimResults = true;
      recognition.continuous = true;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event) => {
        latest = composeTranscript(readResults(event.results));
        setTranscript(latest);
        // Silence counts from the last thing heard (not from the start: the permission prompt may still be up).
        window.clearTimeout(silence);
        silence = window.setTimeout(() => finish("send"), VOICE_SILENCE_MS);
      };
      // Denied microphone, no network…: what was heard (if anything) goes to the field, nothing is sent.
      recognition.onerror = () => finish("edit");
      // The browser stopped listening by itself: as «إيقاف».
      recognition.onend = () => finish("send");
      try {
        recognition.start();
      } catch {
        finish("cancel");
      }
    }

    return () => {
      finishRef.current = null;
      if (!finished) {
        finished = true;
        release();
      }
    };
  }, []);

  return {
    transcript,
    elapsedMs: now - startedAt,
    finish: (action: VoiceResult["action"]) => finishRef.current?.(action),
  };
}

const PANEL_STYLE = {
  flex: "none",
  padding: "18px 18px calc(28px + env(safe-area-inset-bottom))",
  gap: "14px",
  background: "var(--surface)",
  borderTop: "1px solid var(--line)",
  boxShadow: "0 -18px 40px -24px rgb(12 35 64 / .35)",
  borderRadius: "26px 26px 0 0",
} as const;
const LIVE_STYLE = { color: "var(--cyan)", fontWeight: 600 } as const;
const TEXT_STYLE = { fontSize: "17px", lineHeight: 1.8, fontWeight: 500 } as const;
const CARET_STYLE = {
  display: "inline-block",
  width: "2px",
  height: "20px",
  background: "var(--cyan-dot)",
  verticalAlign: "middle",
  marginInlineStart: "2px",
} as const;
const STOP_STYLE = { width: "64px", height: "64px", borderRadius: "22px" } as const;

/** Mounted while listening (in place of the dock); `onDone` closes it. */
export function VoicePanel({ onDone }: { onDone: (result: VoiceResult) => void }) {
  const voice = useRecognition(onDone);
  const stopRef = useRef<HTMLButtonElement>(null);
  const { final, interim } = voice.transcript;

  useEffect(() => {
    stopRef.current?.focus();
  }, []);

  return (
    <section
      className="col"
      aria-label={VOICE_COPY.listening}
      style={PANEL_STYLE}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        voice.finish("cancel");
      }}
    >
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="live" style={LIVE_STYLE}>
          {VOICE_COPY.listening}
        </span>
        <span className="t-meta num">{elapsedLabel(voice.elapsedMs)}</span>
      </div>
      {/* Only the transcript is live: the clock would be read out every second. */}
      <p aria-live="polite" style={TEXT_STYLE}>
        {final}
        {final && interim ? " " : null}
        <span style={{ color: "var(--ink-3)" }}>{interim}</span>
        <span style={CARET_STYLE} />
      </p>
      <div className="wave" style={{ justifyContent: "center" }}>
        {VOICE_WAVE.map((bar, index) => (
          <i key={index} style={{ height: bar.height, animationDelay: bar.delay }} />
        ))}
      </div>
      <div className="row" style={{ justifyContent: "space-between", gap: "10px" }}>
        <Button variant="ghost" onClick={() => voice.finish("cancel")}>
          {VOICE_COPY.cancel}
        </Button>
        <button ref={stopRef} className="send" type="button" aria-label={VOICE_COPY.stopSend} style={STOP_STYLE} onClick={() => voice.finish("send")}>
          <Icon name="stop" size="lg" />
        </button>
        <Button variant="quiet" onClick={() => voice.finish("edit")}>
          {VOICE_COPY.editText}
        </Button>
      </div>
      <p className="t-meta" style={{ textAlign: "center" }}>
        {VOICE_COPY.note}
      </p>
    </section>
  );
}
