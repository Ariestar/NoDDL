interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.css?inline' {
  const styles: string;
  export default styles;
}

declare module '*.png' {
  const source: string;
  export default source;
}

declare const chrome: {
  runtime: {
    lastError?: { message?: string };
    sendMessage(
      message: unknown,
      callback: (response?: { cookie?: string; error?: string; ok?: boolean; status?: number; body?: string }) => void
    ): void;
  };
};
