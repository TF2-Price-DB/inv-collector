export type Failure = { at: Date; statusCode: number };

export interface StorageEngine {
  close(): Promise<void>;
  loadFailures(steam64: string): Promise<{ at: Date; statusCode: number }[]>;
  loadInventory(steam64: string): Promise<{ at: Date; body: string } | null>;
  hasInventory(steam64: string): Promise<boolean>;
  storeFailure(steam64: string, statusCode: number): Promise<void>;
  storeInventory(steam64: string, body: string): Promise<void>;
}
