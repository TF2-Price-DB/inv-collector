import * as fs from "node:fs/promises";
import * as path from "node:path";
import { DATA_DIR } from "./DATA_DIR.ts";

export async function getInventoryFiles() {
  return (await fs.readdir(DATA_DIR))
    .filter((f) => path.extname(f) === ".json")
    .map((f) => [f, path.join(DATA_DIR, f)] as const);
}
