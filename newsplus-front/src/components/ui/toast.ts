export type ToastTone = "ok" | "error";
export type ToastItem = { id: number; message: string; tone: ToastTone; leaving: boolean };

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeToasts(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getToasts() {
  return items;
}

export function toast(message: string, tone: ToastTone = "ok", ms = 2200) {
  const id = nextId++;
  // Replace any identical visible toast so repeated copies don't stack.
  items = [...items.filter((item) => item.message !== message), { id, message, tone, leaving: false }].slice(-3);
  emit();
  window.setTimeout(() => {
    items = items.map((item) => (item.id === id ? { ...item, leaving: true } : item));
    emit();
    window.setTimeout(() => {
      items = items.filter((item) => item.id !== id);
      emit();
    }, 220);
  }, ms);
}
