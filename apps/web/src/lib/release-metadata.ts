export type ReleaseMetadata = {
  version: string;
  commit: string;
  buildTimestamp: string;
};

export function getReleaseMetadata(
  env: Partial<NodeJS.ProcessEnv> = process.env,
): ReleaseMetadata {
  return {
    version: env.NEXT_PUBLIC_APP_VERSION ?? env.RELEASE_VERSION ?? '0.1.0-dev',
    commit: env.GIT_COMMIT_SHA ?? env.VERCEL_GIT_COMMIT_SHA ?? 'unknown',
    buildTimestamp: env.BUILD_TIMESTAMP ?? 'unknown',
  };
}
