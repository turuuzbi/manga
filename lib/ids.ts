import { randomBytes } from "node:crypto";

// Same URL-safe alphabet and length as Prisma's `@default(nanoid())`, so an id
// minted here is indistinguishable from one the client generates.
const ALPHABET =
  "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";

/**
 * A row id generated ahead of the insert. Used where a file has to be stored
 * under its manga/chapter folder before that row exists — the browser uploads
 * straight to R2, then the server action creates the row with this id.
 */
export function generateId(size = 21): string {
  const bytes = randomBytes(size);
  let id = "";

  for (let index = 0; index < size; index += 1) {
    id += ALPHABET[bytes[index] & 63];
  }

  return id;
}
