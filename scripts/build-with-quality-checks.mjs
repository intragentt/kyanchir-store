#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');
const reportPath = resolve(projectRoot, 'data', 'build-reports.json');

const resolveBin = (name) => {
  const extension = process.platform === 'win32' ? '.cmd' : '';
  return resolve(projectRoot, 'node_modules', '.bin', `${name}${extension}`);
};

const shouldSkipMigrations = ['1', 'true', 'yes'].includes(
  (process.env.SKIP_DB_MIGRATIONS ?? '').toLowerCase(),
);

const rawSteps = [
  {
    key: 'test',
    label: 'Unit tests',
    command: resolveBin('tsx'),
    args: ['--test', 'tests/**/*.test.*'],
    enabled: true,
  },
  {
    key: 'prismaMigrate',
    label: 'Prisma migrate deploy',
    command: process.execPath,
    args: [resolve(projectRoot, 'scripts', 'prisma-migrate-deploy-with-retry.mjs')],
    enabled: !shouldSkipMigrations,
  },
  {
    key: 'prismaGenerate',
    label: 'Prisma generate',
    command: resolveBin('prisma'),
    args: ['generate'],
    enabled: true,
  },
  {
    key: 'nextBuild',
    label: 'Next.js build',
    command: resolveBin('next'),
    args: ['build'],
    enabled: true,
  },
];

const steps = rawSteps.filter((step) => step.enabled !== false);

const runStep = (step) =>
  new Promise((resolveStep) => {
    const startedAt = Date.now();
    const child = spawn(step.command, step.args, {
      stdio: 'inherit',
      env: process.env,
    });

    const finalize = (status, code, signal, error) => {
      const durationMs = Date.now() - startedAt;
      resolveStep({
        key: step.key,
        label: step.label,
        status,
        code,
        signal,
        durationMs,
        error,
      });
    };

    child.on('error', (error) => {
      finalize('failed', 1, null, error.message);
    });

    child.on('close', (code, signal) => {
      if (code === 0) {
        finalize('success', code, signal, undefined);
        return;
      }

      const reason = signal
        ? `Process exited with signal ${signal}`
        : `Process exited with code ${code}`;
      finalize('failed', code ?? 1, signal, reason);
    });
  });

const readExistingReport = async () => {
  if (!existsSync(reportPath)) {
    return [];
  }

  try {
    const raw = await readFile(reportPath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('[build-report] Не удалось прочитать прошлые отчёты', error);
    return [];
  }
};

const getCurrentCommit = () => {
  try {
    const result = spawnSync('git', ['rev-parse', '--short', 'HEAD'], {
      cwd: projectRoot,
      encoding: 'utf8',
    });

    if (result.status === 0) {
      return result.stdout.trim() || null;
    }
  } catch (error) {
    console.warn('[build-report] Не удалось получить текущий коммит', error);
  }

  return null;
};

const writeReport = async (status, stepsResults, error) => {
  await mkdir(dirname(reportPath), { recursive: true });
  const history = await readExistingReport();
  const commit = getCurrentCommit();
  const entry = {
    timestamp: new Date().toISOString(),
    status,
    commit,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? null,
    steps: stepsResults.map(({ key, label, status: stepStatus, durationMs, error: stepError }) => ({
      key,
      label,
      status: stepStatus,
      durationMs,
      ...(stepError ? { error: stepError } : {}),
    })),
    ...(error ? { error } : {}),
  };

  if (status === 'failed') {
    const failedStep = stepsResults.find((step) => step.status === 'failed');
    entry.failedStep = failedStep ? failedStep.key : null;
  }

  const nextHistory = [entry, ...history].slice(0, 5);
  await writeFile(reportPath, `${JSON.stringify(nextHistory, null, 2)}\n`, 'utf8');
};

const appendDisabledSteps = (collection) => {
  for (const skipped of rawSteps) {
    if (skipped.enabled === false) {
      collection.push({
        key: skipped.key,
        label: skipped.label,
        status: 'skipped',
        code: null,
        signal: null,
        durationMs: 0,
      });
    }
  }
};

const main = async () => {
  process.env.NODE_ENV = 'production';

  const results = [];

  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index];
    const result = await runStep(step);
    results.push(result);

    if (result.status === 'failed') {
      for (const skipped of steps.slice(index + 1)) {
        results.push({
          key: skipped.key,
          label: skipped.label,
          status: 'skipped',
          code: null,
          signal: null,
          durationMs: 0,
        });
      }

      appendDisabledSteps(results);
      await writeReport('failed', results, result.error ?? null);
      process.exit(result.code ?? 1);
    }
  }

  appendDisabledSteps(results);
  await writeReport('success', results, null);
};

main().catch(async (error) => {
  console.error('[build] Необработанная ошибка', error);
  await writeReport('failed', [], error instanceof Error ? error.message : String(error));
  process.exit(1);
});
