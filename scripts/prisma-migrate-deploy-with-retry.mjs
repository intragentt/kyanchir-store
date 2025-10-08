#!/usr/bin/env node
import { spawn } from 'node:child_process';

const MAX_ATTEMPTS = Number.parseInt(
  process.env.PRISMA_MIGRATE_MAX_ATTEMPTS ?? '5',
  10,
);
const RETRY_DELAY_MS = Number.parseInt(
  process.env.PRISMA_MIGRATE_RETRY_DELAY_MS ?? '5000',
  10,
);
const KNOWN_LOCK_MESSAGES = [
  'P1002',
  'Timed out trying to acquire a postgres advisory lock',
];

class CommandError extends Error {
  constructor(message, { exitCode, stdout, stderr, cause }) {
    super(message, { cause });
    this.name = 'CommandError';
    this.exitCode = exitCode ?? 1;
    this.stdout = stdout ?? '';
    this.stderr = stderr ?? '';
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function runPrismaMigrateDeploy() {
  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const args = ['prisma', 'migrate', 'deploy'];

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: process.env,
      stdio: ['inherit', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(chunk);
    });

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(chunk);
    });

    child.on('error', (error) => {
      reject(
        new CommandError('Failed to start prisma migrate deploy', {
          exitCode: error.code,
          stdout,
          stderr,
          cause: error,
        }),
      );
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(
        new CommandError('prisma migrate deploy exited with an error', {
          exitCode: code ?? 1,
          stdout,
          stderr,
        }),
      );
    });
  });
}

function includesKnownLockMessage(text) {
  const haystack = text.toLowerCase();
  return KNOWN_LOCK_MESSAGES.some((needle) =>
    haystack.includes(needle.toLowerCase()),
  );
}

async function main() {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      console.log(`\n[prisma-migrate] Attempt ${attempt}/${MAX_ATTEMPTS}`);
      await runPrismaMigrateDeploy();
      console.log('[prisma-migrate] Completed successfully.');
      return;
    } catch (error) {
      const combinedOutput = `${error.stdout ?? ''}${error.stderr ?? ''}`;
      const shouldRetry =
        attempt < MAX_ATTEMPTS && includesKnownLockMessage(combinedOutput);

      if (!shouldRetry) {
        console.error('[prisma-migrate] Failed to run prisma migrate deploy.');
        if (combinedOutput.trim()) {
          console.error(
            '[prisma-migrate] Last output:\n',
            combinedOutput.trim(),
          );
        }
        if (error.cause) {
          console.error('[prisma-migrate] Underlying error:', error.cause);
        }
        process.exit(error.exitCode ?? 1);
      }

      const delaySeconds = Math.ceil(RETRY_DELAY_MS / 1000);
      console.warn(
        `[prisma-migrate] Advisory lock detected. Retrying in ${delaySeconds} second${
          delaySeconds === 1 ? '' : 's'
        }...`,
      );
      await sleep(RETRY_DELAY_MS);
    }
  }

  // Should never reach here because successful return or process.exit in failure branch.
  process.exit(1);
}

main().catch((error) => {
  console.error('[prisma-migrate] Unexpected failure:', error);
  process.exit(1);
});
