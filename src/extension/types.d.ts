interface ImportMetaEnv {
  readonly VITE_EMAIL_API_BASE_URL?: string;
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
    sendMessage(message: unknown, callback: (response?: { cookie?: string; error?: string }) => void): void;
  };
};
