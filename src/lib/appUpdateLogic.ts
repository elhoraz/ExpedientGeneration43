export interface AppVersionData {
  latestVersionCode: number;
  latestVersionName: string;
  releaseDate: string;
  apkUrl: string;
  ipaUrl?: string;
  title: string;
  releaseNotes: string[];
  forceUpdate?: boolean;
  minSupportedVersionCode?: number;
}

export interface UpdateEvaluation {
  needsUpdate: boolean;
  isMandatory: boolean;
  shouldShowPrompt: boolean;
}

/**
 * Evaluates whether the installed native app version requires an optional or mandatory update.
 * Enforces both `forceUpdate` and `minSupportedVersionCode` whenever `installedCode < latestVersionCode`.
 */
export function evaluateAppUpdate(
  data: Pick<AppVersionData, "latestVersionCode" | "forceUpdate" | "minSupportedVersionCode">,
  installedCode: number,
  dismissedSession = false
): UpdateEvaluation {
  const normalizedCode = Number.isFinite(installedCode) && installedCode > 0 ? installedCode : 1;
  const needsUpdate = data.latestVersionCode > normalizedCode;
  const belowMinSupported =
    typeof data.minSupportedVersionCode === "number" &&
    normalizedCode < data.minSupportedVersionCode;
  const isMandatory = needsUpdate && (Boolean(data.forceUpdate) || belowMinSupported);
  const shouldShowPrompt = needsUpdate && (isMandatory || !dismissedSession);

  return {
    needsUpdate,
    isMandatory,
    shouldShowPrompt,
  };
}
