import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as process from "node:process";
import { getInventoryFiles } from "../src/getInventoryFiles.ts";
import { createInventoryFiles } from "../src/createInventoryFiles.ts";
import { TOP_INVENTORIES } from "../src/TOP_INVENTORIES.ts";
import { AsyncSemaphore } from "../src/AsyncSemaphore.ts";

if (!import.meta.main) {
  throw new Error(
    "This is an entrypoint, it cannot be imported from another file",
  );
}

const semaphore = new AsyncSemaphore(3);

const expressLoadApiKeyMaybeNull = process.env.EXPRESS_LOAD_API_KEY;
if (expressLoadApiKeyMaybeNull == null) {
  throw new Error("No express load api key configured.");
}
const expressLoadApiKey = expressLoadApiKeyMaybeNull;

await createInventoryFiles(TOP_INVENTORIES);
const files = await getInventoryFiles();

await Promise.allSettled(files.map(async ([name, fullPath]) => {
  try {
    await semaphore.with(async () => {
      const stat = await fs.stat(fullPath);
      if (stat.size !== 0) {
        return;
      }

      const steam64 = path.basename(name, path.extname(name));
      const res = await download(steam64);
      if (!res.ok) {
        throw res;
      }

      const text = await res.text();
      console.log(`Finished: ${steam64}`);

      // Does it parse?
      void JSON.parse(text);

      fs.writeFile(fullPath, text);
    });
  } catch (e) {
    console.error(`Error: ${fullPath}`);
    console.error(e);
  }
}));

async function download(steam64: string) {
  const headers = new Headers([["X-API-KEY", expressLoadApiKey]]);
  return await fetch(
    `https://api.express-load.com/inventory/${steam64}/440/2`,
    { headers },
  );
}
