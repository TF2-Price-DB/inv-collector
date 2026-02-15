import { TOP_INVENTORIES } from "../src/TOP_INVENTORIES.ts";
import { AsyncSemaphore } from "../src/AsyncSemaphore.ts";
import { FileSystemStorage } from "../src/storage/FileSystemStorage.ts";
import { DenoSqliteStorage } from "../src/storage/DenoSqliteStorage.ts";
import { readEnv } from "../src/readEnv.ts";
import { Failure } from "../src/storage/StorageEngine.ts";

if (!import.meta.main) {
  throw new Error(
    "This is an entrypoint, it cannot be imported from another file",
  );
}

const config = {
  apiKey: readEnv("EXPRESS_LOAD_API_KEY"),
  storageEngine: readEnv("STORAGE_ENGINE"),
  concurrency: readEnv("CONCURRENCY", true),
  retryCount: readEnv("RETRY_COUNT", true),
  failureAgeDays: readEnv("RETRY_DAYS", true),
};

console.log("%cSettings:", "color: yellow");
console.log("%c" + JSON.stringify(config, null, 2), "color: cyan");

const expressLoadApiKey = config.apiKey;
const semaphore = new AsyncSemaphore(config.concurrency);
const errorBoundary = new Date(
  new Date().valueOf() - (config.failureAgeDays * 24 * 60 * 60 * 1000),
);

const storage = await (() => {
  switch (config.storageEngine) {
    case "json-fs":
      return FileSystemStorage.try();
    case "deno-sqlite":
      return DenoSqliteStorage.try();
    default:
      return null;
  }
})();

if (!storage) {
  throw new Error(
    `Could not load the storage engine: ${config.storageEngine}`,
  );
}

let downloadsDone = 0;
let downloadsFailed = 0;

await Promise.allSettled(TOP_INVENTORIES.map(async (steam64) => {
  try {
    await semaphore.with(async () => {
      if (await storage.hasInventory(steam64)) {
        return;
      }

      const relevantFailures = (await storage.loadFailures(steam64))
        .filter((x) => x.at > errorBoundary);
      if (
        relevantFailures.length > config.retryCount ||
        relevantFailures.some((x) => !isRetryable(x))
      ) {
        return;
      }

      const res = await download(steam64);
      if (!res.ok) {
        throw new Error(res.statusText, { cause: res.status });
      }

      const text = await res.text();
      console.log(`%cOK(${++downloadsDone}): ${steam64}`, "color: green");

      // Does it parse?
      void JSON.parse(text);

      storage.storeInventory(steam64, text);
    });
  } catch (e) {
    const err = e as Error;
    const cause = err.cause;
    console.error(
      `%cERR(${++downloadsFailed}): ${steam64} ${err.message}`,
      "color: red",
    );

    await storage.storeFailure(steam64, typeof cause === "number" ? cause : 0);

    if (cause === 429) {
      await enhanceYourChill();
    }
  }
})).finally(() => storage.close());

async function download(steam64: string) {
  const headers = new Headers([["X-API-KEY", expressLoadApiKey]]);
  return await fetch(
    `https://api.express-load.com/inventory/${steam64}/440/2`,
    { headers },
  );
}

function enhanceYourChill() {
  console.error(
    "%cConcurrency too high, forcefully slowing down...",
    "color: cyan",
  );
  return new Promise((res) => setTimeout(res, 30_000));
}

function isRetryable(failure: Failure) {
  return failure.statusCode !== 403;
}
