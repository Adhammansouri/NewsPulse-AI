/** Joins class names, skipping falsy values: `cx("btn", ai && "btn--ai", className)`. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
