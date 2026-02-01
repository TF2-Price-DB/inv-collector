import path from "node:path";

export const DATA_DIR = path.join(
  path.dirname(import.meta.dirname!),
  "data",
  "inventories",
);
