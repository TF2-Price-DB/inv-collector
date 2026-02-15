import fs from "node:fs/promises";
import path from "node:path";
import { StorageEngine } from "./StorageEngine.ts";
import { DATA_DIR } from "../DATA_DIR.ts";

export class FileSystemStorage implements StorageEngine {
  static try(): Promise<StorageEngine> {
    return Promise.resolve(new FileSystemStorage());
  }

  close() {
    return Promise.resolve();
  }

  async loadFailures(steam64: string) {
    const file = await fs.readFile(
      await this.#pathFor("inventory-load-errors", steam64),
    ).catch(() => "");
    return file
      .toString("utf-8")
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const json = JSON.parse(line) as unknown;

        if (
          typeof json !== "object" ||
          json === null ||
          !("at" in json) ||
          !("statusCode" in json)
        ) {
          throw new Error(`Cannot parse: ${line}`);
        }

        const { at, statusCode } = json;
        if (typeof at !== "string") {
          throw new Error(`Invalid "at" key: ${line}`);
        }

        if (typeof statusCode !== "number") {
          throw new Error(`Invalid "statusCode" key: ${line}`);
        }

        return { at: new Date(at), statusCode: statusCode };
      });
  }

  async loadInventory(steam64: string) {
    const filePath = await this.#pathFor("inventories", steam64);

    const stats = await fs.stat(filePath);
    const file = await fs.readFile(filePath);

    return { at: new Date(stats.birthtimeMs), body: file.toString("utf-8") };
  }

  async hasInventory(steam64: string) {
    const filePath = await this.#pathFor("inventories", steam64);
    try {
      await fs.stat(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async storeFailure(steam64: string, statusCode: number) {
    await fs.appendFile(
      await this.#pathFor("inventory-load-errors", steam64),
      JSON.stringify({ at: new Date().toISOString(), statusCode }) + "\n",
    );
  }

  async storeInventory(steam64: string, responseBody: string) {
    await fs.writeFile(
      await this.#pathFor("inventories", steam64),
      responseBody,
    );
  }

  async #pathFor(
    kind: "inventory-load-errors" | "inventories",
    steam64: string,
  ) {
    const dir = path.join(DATA_DIR, kind, steam64.slice(steam64.length - 3));
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch {
      // already exists
    }

    const ext = kind === "inventory-load-errors" ? ".jsonl" : ".json";
    return path.join(dir, steam64 + ext);
  }
}
