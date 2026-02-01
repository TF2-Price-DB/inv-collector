export class AsyncSemaphore {
  #max: number;
  #current = 0;
  #queue: (() => void)[] = [];

  constructor(max: number) {
    this.#max = max;
  }

  async with<T>(fn: () => T): Promise<Awaited<T>> {
    const release = await this.#acquire();
    try {
      return await fn();
    } finally {
      release();
    }
  }

  #acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      if (this.#current < this.#max) {
        this.#current++;
        resolve(() => this.#release());
      } else {
        this.#queue.push(() => {
          this.#current++;
          resolve(() => this.#release());
        });
      }
    });
  }

  #release(): void {
    this.#current--;
    const next = this.#queue.shift();
    if (next) next();
  }
}
