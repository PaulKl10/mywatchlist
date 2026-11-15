import { CODE_ALPHABET, CODE_LENGTH } from "./constants";

/** Entier uniforme dans [0, maxExclusive), tirage par rejet pour éviter le biais du modulo. */
function secureRandomInt(maxExclusive: number): number {
  const limit = 256 - (256 % maxExclusive);
  const buffer = new Uint8Array(1);
  for (;;) {
    globalThis.crypto.getRandomValues(buffer);
    if (buffer[0] < limit) return buffer[0] % maxExclusive;
  }
}

/** Génère un code de session de CODE_LENGTH caractères tirés de CODE_ALPHABET. */
export function generateMovieNightCode(
  randomInt: (maxExclusive: number) => number = secureRandomInt,
): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return code;
}

/** Met en majuscules, retire espaces et tirets ; `null` si le code est invalide. */
export function normalizeMovieNightCode(input: string): string | null {
  const code = input.toUpperCase().replace(/[\s-]/g, "");
  if (code.length !== CODE_LENGTH) return null;
  for (const char of code) {
    if (!CODE_ALPHABET.includes(char)) return null;
  }
  return code;
}

/** « K7P2QX » → « K7P-2QX ». */
export function formatMovieNightCode(code: string): string {
  const half = Math.floor(code.length / 2);
  return `${code.slice(0, half)}-${code.slice(half)}`;
}
