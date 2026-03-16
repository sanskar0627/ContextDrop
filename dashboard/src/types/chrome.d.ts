export {};

declare global {
  interface Window {
    chrome?: {
      runtime?: {
        sendMessage: (message: unknown) => Promise<unknown>;
      };
      storage?: {
        local?: {
          set: (payload: Record<string, unknown>) => Promise<void>;
          get: (key: string) => Promise<Record<string, unknown>>;
        };
      };
    };
  }
}
