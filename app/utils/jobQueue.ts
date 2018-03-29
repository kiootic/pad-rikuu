import { Deferred } from "app/utils/deferred";
import { sleep } from "app/utils";

interface Job<T=any> {
  fn(): Promise<T>;
  completion: Deferred<T>;
}

export class JobQueue {
  private running = false;
  private readonly queue: Job[] = [];

  public post<T>(fn: () => Promise<T>): Deferred<T> {
    const completion = new Deferred<T>();
    this.queue.push({ fn, completion });
    if (!this.running)
      this.loop();
    return completion;
  }

  private async loop() {
    if (this.queue.length === 0) {
      this.running = false;
      return;
    }
    else {
      this.running = true;
      const { fn, completion } = this.queue.shift();
      completion.attach(fn());
      await sleep();
      await this.loop();
    }
  }
}