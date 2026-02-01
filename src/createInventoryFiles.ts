import fs from "node:fs/promises";
import path from "node:path";
import { DATA_DIR } from "./DATA_DIR.ts";

export async function createInventoryFiles(steam64s: string[]) {
  for (const id of steam64s) {
    const fullPath = path.join(DATA_DIR, `${id}.json`);
    const file = await fs.open(fullPath, "a");
    await file.close();
  }
}
