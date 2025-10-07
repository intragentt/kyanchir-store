import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { chromium } from 'playwright';

interface ScreenshotOptions {
  url: string;
  out: string;
  width: number;
  height: number;
  waitFor?: number;
  fullPage: boolean;
}

function parseArgs(argv: string[]): ScreenshotOptions {
  const defaults: ScreenshotOptions = {
    url: '',
    out: 'artifacts/screenshot.png',
    width: 1440,
    height: 900,
    waitFor: 0,
    fullPage: false,
  };

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];

    if (!arg.startsWith('--')) {
      continue;
    }

    const [rawKey, rawValue] = arg.includes('=') ? arg.slice(2).split('=', 2) : [arg.slice(2), undefined];
    const key = rawKey.trim();
    const value = rawValue ?? argv[index + 1];

    switch (key) {
      case 'url':
        if (value) {
          defaults.url = value;
          if (!rawValue) index++;
        }
        break;
      case 'out':
      case 'output':
        if (value) {
          defaults.out = value;
          if (!rawValue) index++;
        }
        break;
      case 'width':
        if (value) {
          defaults.width = Number.parseInt(value, 10) || defaults.width;
          if (!rawValue) index++;
        }
        break;
      case 'height':
        if (value) {
          defaults.height = Number.parseInt(value, 10) || defaults.height;
          if (!rawValue) index++;
        }
        break;
      case 'wait':
      case 'waitFor':
        if (value) {
          defaults.waitFor = Number.parseInt(value, 10) || defaults.waitFor;
          if (!rawValue) index++;
        }
        break;
      case 'fullPage':
        defaults.fullPage = true;
        break;
      case 'noFullPage':
        defaults.fullPage = false;
        break;
      default:
        break;
    }
  }

  return defaults;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (!options.url) {
    console.error('⚠️  Укажите URL через флаг --url. Например: npm run screenshot -- --url https://kyanchir.ru');
    process.exitCode = 1;
    return;
  }

  const outputPath = resolve(process.cwd(), options.out);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: options.width, height: options.height } });

  try {
    await page.goto(options.url, { waitUntil: 'networkidle' });

    if (options.waitFor && options.waitFor > 0) {
      await page.waitForTimeout(options.waitFor);
    }

    await mkdir(dirname(outputPath), { recursive: true });
    await page.screenshot({ path: outputPath, fullPage: options.fullPage });

    console.log(`✅ Скриншот сохранён: ${outputPath}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error('❌ Не удалось снять скриншот:', error);
  process.exitCode = 1;
});
