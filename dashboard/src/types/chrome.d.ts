export {};

declare global {
  interface Window {
    chrome?: {
      runtime?: {
        sendMessage: (message: unknown) => Promise<any>;
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
