declare module 'culori' {
  export interface Color {
    mode: string;
    [key: string]: number | string | undefined;
  }

  export function parse(color: string): Color | null;
  export function formatHex(color: Color | null): string | null;
}
