const mockSignOut = jest.fn(() => Promise.resolve());

jest.mock("firebase/auth", () => ({
  signInWithCustomToken: jest.fn(() => Promise.resolve()),
  signOut: () => mockSignOut(),
}));
jest.mock("../../firebase/firebase", () => ({ auth: { currentUser: null } }));

// Jest must install the Firebase mocks before this module is evaluated.
// eslint-disable-next-line import/first
import {
  cleanupFailedPortalLaunch,
  isAuthoritativePortalDenial,
  PortalSessionError,
} from "../portalBridge";

describe("Portal session failure handling", () => {
  beforeEach(() => {
    mockSignOut.mockClear();
    global.fetch = jest.fn(() => Promise.resolve({ ok: true } as Response));
  });

  it("treats only 401 and 403 as authoritative denial", () => {
    expect(isAuthoritativePortalDenial(new PortalSessionError(401))).toBe(true);
    expect(isAuthoritativePortalDenial(new PortalSessionError(403))).toBe(true);
    expect(isAuthoritativePortalDenial(new PortalSessionError(500))).toBe(false);
    expect(isAuthoritativePortalDenial(new TypeError("network"))).toBe(false);
  });

  it("clears both product cookie and Firebase identity after callback failure", async () => {
    await cleanupFailedPortalLaunch();
    expect(global.fetch).toHaveBeenCalledWith("/api/module-session", {
      method: "DELETE",
      credentials: "include",
    });
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
});
