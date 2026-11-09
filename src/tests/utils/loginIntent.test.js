import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  LOGIN_REDIRECT_PATH_KEY,
  clearLoginRedirectPath,
  clearOAuthInProgress,
  consumeLoginRedirectPath,
  isAbandonedOAuthReturn,
  markOAuthInProgress,
  persistLoginRedirectPath,
  readLoginRedirectPath,
  replaceLoginHistoryBeforeOAuth,
} from "../../utils/loginIntent.js";

describe("persistLoginRedirectPath", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("stores in-app routes for post-login return", () => {
    persistLoginRedirectPath("/general/challenges");
    expect(readLoginRedirectPath()).toBe("/general/challenges");
  });

  it("does not overwrite a prior route with /login", () => {
    persistLoginRedirectPath("/general/challenges");
    persistLoginRedirectPath("/login");
    expect(readLoginRedirectPath()).toBe("/general/challenges");
  });

  it("ignores auth callback paths", () => {
    persistLoginRedirectPath("/auth/callback?login=success");
    expect(readLoginRedirectPath()).toBeNull();
  });

  it("consume clears the stored path", () => {
    persistLoginRedirectPath("/general/peer-sessions");
    expect(consumeLoginRedirectPath()).toBe("/general/peer-sessions");
    expect(sessionStorage.getItem(LOGIN_REDIRECT_PATH_KEY)).toBeNull();
    clearLoginRedirectPath();
  });
});

describe("replaceLoginHistoryBeforeOAuth", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("replaces /login with the stored return path", () => {
    window.location.pathname = "/login";
    persistLoginRedirectPath("/general/challenges");
    const spy = vi.spyOn(window.history, "replaceState");
    replaceLoginHistoryBeforeOAuth("/");
    expect(spy).toHaveBeenCalledWith(
      window.history.state,
      "",
      "/general/challenges"
    );
    spy.mockRestore();
  });

  it("does nothing when already on an app route (in-place login gate)", () => {
    window.location.pathname = "/general/challenges";
    const spy = vi.spyOn(window.history, "replaceState");
    replaceLoginHistoryBeforeOAuth("/");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("abandoned OAuth return", () => {
  beforeEach(() => {
    sessionStorage.clear();
    clearOAuthInProgress();
  });

  it("treats Back from Google onto an app page as abandoned", () => {
    markOAuthInProgress();
    window.location.pathname = "/general/challenges";
    window.location.search = "";
    expect(isAbandonedOAuthReturn()).toBe(true);
  });

  it("does not treat a successful auth callback as abandoned", () => {
    markOAuthInProgress();
    window.location.pathname = "/rvce/auth/callback";
    window.location.search = "?login=success";
    expect(isAbandonedOAuthReturn()).toBe(false);
  });
});
