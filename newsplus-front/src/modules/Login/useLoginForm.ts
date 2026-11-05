import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { isApiError } from "@/services/apiError";
import { loginWithCredentials } from "@/services/authService";

/** S03 §3 states of the sign-in form. `ok` is the 600 ms welcome before navigating. */
export type LoginPhase = "idle" | "validation" | "loading" | "error" | "network" | "locked" | "ok";

/** «باقي N محاولات» is shown only from this many attempts left down to 1 (S03 §3). */
const ATTEMPTS_WARNING_FROM = 5;
/** How long the button shows the check + «أهلاً {displayName}» before navigating (S03 §3). */
export const SUCCESS_HOLD_MS = 600;

const REMEMBER_KEY = "newsplus-login-remember";
const REMEMBER_ID_KEY = "newsplus-login-identifier";

type LoginState = {
  phase: LoginPhase;
  /** validation: which fields were submitted empty. */
  idMissing: boolean;
  pwMissing: boolean;
  /** error: attempts left, only when the API sent `X-RateLimit-Remaining` within the warning range. */
  attemptsLeft?: number;
  /** locked: epoch ms when the API lets the next attempt through (`Retry-After`); absent if not sent. */
  lockedUntil?: number;
  /** ok: the signed-in user's name for the welcome label. */
  displayName?: string;
  /** Bumped on every submit outcome, so the notice re-mounts (re-animates and is announced again). */
  outcome: number;
};

const IDLE: LoginState = { phase: "idle", idMissing: false, pwMissing: false, outcome: 0 };

function readRemember() {
  try {
    return localStorage.getItem(REMEMBER_KEY) === "1";
  } catch {
    return false;
  }
}

function readRememberedIdentifier() {
  try {
    if (localStorage.getItem(REMEMBER_KEY) !== "1") return "";
    return localStorage.getItem(REMEMBER_ID_KEY) || "";
  } catch {
    return "";
  }
}

function persistRemember(remember: boolean, identifier: string) {
  try {
    if (remember) {
      localStorage.setItem(REMEMBER_KEY, "1");
      localStorage.setItem(REMEMBER_ID_KEY, identifier);
    } else {
      localStorage.removeItem(REMEMBER_KEY);
      localStorage.removeItem(REMEMBER_ID_KEY);
    }
  } catch {
    /* private mode */
  }
}

function secondsUntil(at: number) {
  return Math.max(0, Math.ceil((at - Date.now()) / 1000));
}

/**
 * Failure → state: 429 → locked (countdown from `Retry-After`); 401 and 400 (credentials the API rejects,
 * incl. its length validation) → error; anything else — fetch failure, the login timeout, 5xx, an
 * unexpected status or body — → network.
 */
function failureState(error: unknown, outcome: number): LoginState {
  const base = { ...IDLE, outcome };
  if (!isApiError(error)) return { ...base, phase: "network" };

  if (error.status === 429) {
    const wait = error.retryAfterSeconds;
    return { ...base, phase: "locked", lockedUntil: wait ? Date.now() + wait * 1000 : undefined };
  }

  if (error.status === 401 || error.status === 400) {
    const left = error.rateLimitRemaining;
    const attemptsLeft = left !== undefined && left >= 1 && left <= ATTEMPTS_WARNING_FROM ? left : undefined;
    return { ...base, phase: "error", attemptsLeft };
  }

  return { ...base, phase: "network" };
}

export type LoginForm = ReturnType<typeof useLoginForm>;

/** Sign-in form state shared by the desktop and mobile layouts. */
export function useLoginForm(onSignedIn: () => void) {
  const [identifier, setIdentifier] = useState(readRememberedIdentifier);
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(readRemember);
  const [state, setState] = useState<LoginState>(IDLE);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const idRef = useRef<HTMLInputElement>(null);
  const pwRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  /** The keyboard-focused element when the last outcome arrived (before the lock disables the button). */
  const keyboardFocused = useRef<Element | null>(null);
  const onSignedInRef = useRef(onSignedIn);
  const mounted = useRef(true);

  useEffect(() => {
    onSignedInRef.current = onSignedIn;
  }, [onSignedIn]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const { phase, lockedUntil, outcome } = state;

  // Locked: tick the countdown on each second boundary; at 0 the form is usable again.
  useEffect(() => {
    if (phase !== "locked" || lockedUntil === undefined) return undefined;
    let timer: number | undefined;

    const tick = () => {
      const left = secondsUntil(lockedUntil);
      setSecondsLeft(left);
      if (left === 0) {
        setState((prev) => (prev.phase === "locked" ? { ...IDLE, outcome: prev.outcome } : prev));
        return;
      }
      timer = window.setTimeout(tick, lockedUntil - Date.now() - (left - 1) * 1000);
    };

    tick();
    return () => window.clearTimeout(timer);
  }, [phase, lockedUntil]);

  // Focus after an outcome: the first field in error. A keyboard user on the submit button that the lock
  // just disabled is moved to the password field instead of being dropped to the page.
  useEffect(() => {
    if (outcome === 0) return;
    const submitButton = submitRef.current;
    if (phase === "validation") {
      (state.idMissing ? idRef : pwRef).current?.focus();
    } else if (phase === "error") {
      idRef.current?.focus();
    } else if (phase === "locked" && lockedUntil !== undefined && submitButton && keyboardFocused.current === submitButton) {
      pwRef.current?.focus();
    }
    // Runs once per outcome; the other values read here belong to that same outcome.
  }, [outcome]);

  // Success: hold the welcome label, then leave.
  useEffect(() => {
    if (phase !== "ok") return undefined;
    const timer = window.setTimeout(() => onSignedInRef.current(), SUCCESS_HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  const isLocked = phase === "locked" && lockedUntil !== undefined && secondsLeft > 0;
  const isBusy = phase === "loading" || phase === "ok";

  const submit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isBusy || isLocked) return;

      const id = identifier.trim();
      const pw = password.trim();
      const next = outcome + 1;

      if (!id || !pw) {
        setState({ ...IDLE, phase: "validation", idMissing: !id, pwMissing: !pw, outcome: next });
        return;
      }

      setState({ ...IDLE, phase: "loading", outcome });
      persistRemember(remember, id);

      try {
        const user = await loginWithCredentials(id, pw, remember);
        if (mounted.current) setState({ ...IDLE, phase: "ok", displayName: user.displayName, outcome: next });
      } catch (error) {
        if (!mounted.current) return;
        const active = document.activeElement;
        keyboardFocused.current = active?.matches(":focus-visible") ? active : null;
        const failed = failureState(error, next);
        if (failed.lockedUntil !== undefined) setSecondsLeft(secondsUntil(failed.lockedUntil));
        setState(failed);
      }
    },
    [identifier, password, remember, isBusy, isLocked, outcome],
  );

  return {
    identifier,
    setIdentifier,
    password,
    setPassword,
    remember,
    setRemember,
    phase,
    idInvalid: (phase === "validation" && state.idMissing) || phase === "error",
    pwInvalid: (phase === "validation" && state.pwMissing) || phase === "error",
    idMissing: phase === "validation" && state.idMissing,
    pwMissing: phase === "validation" && state.pwMissing,
    attemptsLeft: state.attemptsLeft,
    displayName: state.displayName ?? "",
    /** locked with a countdown: the button is disabled and the «m:ss» hint shows. */
    isLocked,
    secondsLeft,
    isBusy,
    outcome,
    submit,
    idRef,
    pwRef,
    submitRef,
  };
}
