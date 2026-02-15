import path from "node:path";
import { DATA_DIR } from "../DATA_DIR.ts";
import { StorageEngine } from "./StorageEngine.ts";

export class DenoSqliteStorage implements StorageEngine {
  constructor(
    private db: InstanceType<typeof import("@deno.land/sqlite").DB>,
  ) {
    db.execute(
      `CREATE TABLE IF NOT EXISTS inventories
       (steam64 text PRIMARY KEY, timestamp int NOT NULL, response_body text NOT NULL)`,
    );
    db.execute(
      `CREATE TABLE IF NOT EXISTS inventory_load_failures
       (steam64 text, timestamp int NOT NULL, status_code int NOT NULL)`,
    );
    db.execute(
      `CREATE INDEX IF NOT EXISTS
       idx_inventory_load_failures_steam64
       ON inventory_load_failures(steam64)`,
    );
  }

  static async try(): Promise<StorageEngine> {
    const { DB } = await import("@deno.land/sqlite");
    return new DenoSqliteStorage(new DB(path.join(DATA_DIR, "sqlite3.db")));
  }

  close() {
    this.db.close();
    return Promise.resolve();
  }

  loadFailures(steam64: string) {
    const stmt = this.db.prepareQuery<
      [number, number]
    >(
      `SELECT datetime(timestamp, 'auto'), status_code
       FROM inventory_load_failures
       WHERE steam64 = :steam64`,
    );
    const result = stmt.all({ steam64 });
    stmt.finalize();

    return Promise.resolve(result.map((x) => ({
      at: new Date(x[0]),
      statusCode: x[1],
    })));
  }

  loadInventory(steam64: string) {
    const stmt = this.db.prepareQuery<[string, string]>(
      `SELECT datetime(timestamp, 'auto'), response_body
       FROM inventories
       WHERE steam64 = :steam64`,
    );
    const result = stmt.first({ steam64 });
    stmt.finalize();

    if (result === undefined) {
      return Promise.resolve(null);
    }

    return Promise.resolve({ at: new Date(result[0]), body: result[1] });
  }

  hasInventory(steam64: string) {
    const stmt = this.db.prepareQuery<[number]>(
      `SELECT COUNT(*)
       FROM inventories
       WHERE steam64 = :steam64`,
    );
    const result = stmt.first({ steam64 });
    stmt.finalize();

    return Promise.resolve(result != null && result[0] !== 0);
  }

  storeFailure(steam64: string, statusCode: number) {
    const stmt = this.db.prepareQuery(
      `INSERT INTO inventory_load_failures
       (steam64, timestamp, status_code)
       VALUES (:steam64, unixepoch(), :statusCode)`,
    );
    stmt.execute({ steam64, statusCode });
    stmt.finalize();

    return Promise.resolve();
  }

  storeInventory(steam64: string, responseBody: string) {
    const stmt = this.db.prepareQuery(
      `INSERT INTO inventories
       (steam64, timestamp, response_body)
       VALUES (:steam64, unixepoch(), :responseBody)`,
    );
    stmt.execute({ steam64, responseBody });
    stmt.finalize();

    return Promise.resolve();
  }
}
