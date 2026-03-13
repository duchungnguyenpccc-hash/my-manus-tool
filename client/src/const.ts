export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const isLocalDevelopmentMode =
  (import.meta.env.MODE === "development" && import.meta.env.DEV) ||
  (import.meta.env.VITE_LOCAL_DEV_MODE as string | undefined) === "true";

const isValidAbsoluteUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const normalizeUrl = (value: string): string => value.replace(/\/+$/, "");

export const getOAuthPortalUrl = (): string => {
  if (isLocalDevelopmentMode) {
    return normalizeUrl(window.location.origin);
  }

  const raw = (import.meta.env.VITE_OAUTH_PORTAL_URL as string | undefined)?.trim() || "";
  if (isValidAbsoluteUrl(raw)) {
    return normalizeUrl(raw);
  }

  return normalizeUrl(window.location.origin);
};

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  if (isLocalDevelopmentMode) {
    return "/dashboard";
  }

  const oauthPortalUrl = getOAuthPortalUrl();
  const appId = ((import.meta.env.VITE_APP_ID as string | undefined)?.trim() || "local-dev-app");
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  try {
    const url = new URL(`${oauthPortalUrl}/app-auth`);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");
    return url.toString();
  } catch {
    return "/";
  }
};

export const getAnalyticsConfig = () => {
  const endpointRaw = (import.meta.env.VITE_ANALYTICS_ENDPOINT as string | undefined)?.trim() || "";
  const websiteId = (import.meta.env.VITE_ANALYTICS_WEBSITE_ID as string | undefined)?.trim() || "local-dev";

  if (!isValidAbsoluteUrl(endpointRaw)) {
    return { enabled: false, endpoint: "", websiteId };
  }

  return {
    enabled: true,
    endpoint: normalizeUrl(endpointRaw),
    websiteId,
  };
};
