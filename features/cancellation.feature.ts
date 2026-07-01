import { AllowedKeysType } from '@lib/api.config.types.js';

export class RequestCancellationManager {
  private controllers = new Map<string, AbortController>();

  public getSignal(key: AllowedKeysType): AbortSignal {
    const existing = this.controllers.get(key);
    if (existing) return existing.signal;

    const controller = new AbortController();
    this.controllers.set(key, controller);
    return controller.signal;
  }

  public remove(key: string): void {
    this.controllers.delete(key);
  }

  public cancelRequest(key: AllowedKeysType): void {
    const controller = this.controllers.get(key);
    if (controller) {
      controller.abort();
      this.controllers.delete(key);
    }
  }

  public cancelAll(): void {
    this.controllers.forEach((controller) => controller.abort());
    this.controllers.clear();
  }
}
