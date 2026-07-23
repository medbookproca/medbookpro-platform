import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
);
const version = process.env.RELEASE_VERSION ?? packageJson.version;
const commit =
  process.env.GIT_COMMIT_SHA ??
  process.env.VERCEL_GIT_COMMIT_SHA ??
  execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const buildTimestamp = process.env.BUILD_TIMESTAMP ?? new Date().toISOString();
const semverPattern =
  /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

if (!semverPattern.test(version)) {
  throw new Error(`Invalid release version: ${version}`);
}

const metadata = { version, commit, buildTimestamp };
if (process.argv.includes('--check')) {
  process.stdout.write('Release metadata is valid.\n');
} else {
  process.stdout.write(`${JSON.stringify(metadata, null, 2)}\n`);
}
