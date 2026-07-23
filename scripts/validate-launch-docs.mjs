import { readFile } from 'node:fs/promises';

const requiredDocuments = [
  'docs/development/launch-readiness-reconciliation.md',
  'docs/development/launch-readiness.md',
  'docs/development/launch-readiness-backup-restore.md',
  'docs/development/launch-readiness-administrator-guide.md',
  'docs/development/launch-readiness-onboarding.md',
  'docs/development/launch-readiness-support.md',
  'docs/development/launch-readiness-accessibility.md',
  'docs/development/launch-readiness-security-signoff.md',
  'docs/development/launch-readiness-checklists.md',
];

const requiredTerms = [
  'backup',
  'restore',
  'rollback',
  'accessibility',
  'security',
  'support',
  'pilot',
];

const documents = await Promise.all(
  requiredDocuments.map(async (path) => [path, await readFile(path, 'utf8')]),
);

const missingTerms = requiredTerms.filter((term) =>
  documents.every(([, content]) => !content.toLowerCase().includes(term)),
);

if (missingTerms.length > 0) {
  throw new Error(
    `Launch documentation is missing required coverage: ${missingTerms.join(', ')}`,
  );
}

console.log(`Validated ${documents.length} launch-readiness documents.`);
