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

declare function GM_xmlhttpRequest(details: {
  method: string;
  url: string;
  headers?: Record<string, string>;
  data?: string;
  onload?: (response: { status: number; responseText: string }) => void;
  onerror?: (error: any) => void;
}): void;

declare function GM_notification(details: {
  text: string;
  title: string;
  image?: string;
  highlight?: boolean;
  timeout?: number;
  onclick?: () => void;
}): void;

declare function GM_setValue(name: string, value: any): void;
declare function GM_getValue<T>(name: string, defaultValue?: T): T;
declare function GM_setClipboard(data: string, info?: string): void;
