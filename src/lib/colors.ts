export function normalizeHexColor(input: string | null | undefined): string | null {
  const raw = input?.trim();

  if (!raw) {
    return null;
  }

  const match = /^#?([a-f\d]{3}|[a-f\d]{6})$/i.exec(raw);

  if (!match) {
    return null;
  }

  const hex =
    match[1].length === 3
      ? match[1]
          .split('')
          .map((char) => char + char)
          .join('')
      : match[1];

  return `#${hex.toLowerCase()}`;
}

export function resolveHexColor(
  input: string | null | undefined,
  fallback: string,
): string {
  return normalizeHexColor(input) ?? normalizeHexColor(fallback) ?? '#000000';
}
