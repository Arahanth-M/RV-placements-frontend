export const LOGIN_INTENT_KEY = "loginIntent";
export const LOGIN_INTENT_SPC = "spc";
export const LOGIN_INTENT_GENERAL = "general";
export const LOGIN_INTENT_CAMPUS = "campus";
export const LOGIN_INTENT_PLATFORM_ADMIN = "platform_admin";

const STORED_INTENTS = new Set([
  LOGIN_INTENT_SPC,
  LOGIN_INTENT_GENERAL,
  LOGIN_INTENT_CAMPUS,
  LOGIN_INTENT_PLATFORM_ADMIN,
]);

export function persistLoginIntent(intent) {
  if (STORED_INTENTS.has(intent)) {
    sessionStorage.setItem(LOGIN_INTENT_KEY, intent);
    return;
  }
  sessionStorage.removeItem(LOGIN_INTENT_KEY);
}
