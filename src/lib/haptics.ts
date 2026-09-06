/** Piccola vibrazione di conferma — no-op silenzioso su desktop o browser
 * senza supporto (iOS Safari non lo espone affatto). */
export function vibrataConferma() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(15);
  }
}

export function vibrataErrore() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([20, 40, 20]);
  }
}
