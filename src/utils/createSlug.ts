const CYRILLIC_TO_LATIN: Record<string, string> = {
  'а': 'a',
  'б': 'b',
  'в': 'v',
  'г': 'g',
  'д': 'd',
  'е': 'e',
  'ё': 'e',
  'ж': 'zh',
  'з': 'z',
  'и': 'i',
  'й': 'y',
  'к': 'k',
  'л': 'l',
  'м': 'm',
  'н': 'n',
  'о': 'o',
  'п': 'p',
  'р': 'r',
  'с': 's',
  'т': 't',
  'у': 'u',
  'ф': 'f',
  'х': 'h',
  'ц': 'ts',
  'ч': 'ch',
  'ш': 'sh',
  'щ': 'shch',
  'ъ': '',
  'ы': 'y',
  'ь': '',
  'э': 'e',
  'ю': 'yu',
  'я': 'ya',
};

const EXTRA_SYMBOLS: Record<string, string> = {
  'æ': 'ae',
  'œ': 'oe',
  'ø': 'o',
  'å': 'a',
  'ä': 'a',
  'ö': 'o',
  'ü': 'u',
  'ß': 'ss',
};

const FALLBACK_SLUG = 'product';

const replaceCyrillic = (value: string) =>
  value
    .split('')
    .map((char) => {
      const lowerChar = char.toLowerCase();
      if (CYRILLIC_TO_LATIN[lowerChar]) {
        const replacement = CYRILLIC_TO_LATIN[lowerChar];
        return char === lowerChar
          ? replacement
          : replacement.charAt(0).toUpperCase() + replacement.slice(1);
      }

      if (EXTRA_SYMBOLS[lowerChar]) {
        const replacement = EXTRA_SYMBOLS[lowerChar];
        return char === lowerChar
          ? replacement
          : replacement.charAt(0).toUpperCase() + replacement.slice(1);
      }

      return char;
    })
    .join('');

const sanitize = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const createSlug = (value: string) => {
  if (!value || typeof value !== 'string') {
    return FALLBACK_SLUG;
  }

  const transliterated = replaceCyrillic(value);
  const slug = sanitize(transliterated);

  if (slug.length === 0) {
    const alphanumeric = value.replace(/[^a-z0-9]/gi, '');
    return alphanumeric.length > 0
      ? alphanumeric.toLowerCase()
      : `${FALLBACK_SLUG}-${Date.now()}`;
  }

  return slug;
};

export const ensureUniqueSlug = async (
  slug: string,
  isTaken: (candidate: string) => Promise<boolean>,
) => {
  let candidate = slug;
  let suffix = 1;

  while (await isTaken(candidate)) {
    candidate = `${slug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
};

