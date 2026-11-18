import { randomUUID, randomInt } from "node:crypto";

// No 0/O, 1/I or L, so a reference is safe to read aloud.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function newId() {
  return randomUUID();
}

// Example: "K7QM-X3TD"
export function newReference() {
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}