import {
  isTemporaryDefibRequest,
  isValidDefibJoinRequest,
  mayEnterStaffUi,
} from "../staffAccess";

describe("staff access routing", () => {
  it("allows only an authorised Portal staff session into staff UI", () => {
    expect(mayEnterStaffUi("AUTHORISED_STAFF")).toBe(true);
    expect(mayEnterStaffUi("AUTH_BOOTSTRAPPING")).toBe(false);
    expect(mayEnterStaffUi("ACCESS_REQUIRED")).toBe(false);
    expect(mayEnterStaffUi("TEMPORARY_DEFIB")).toBe(false);
  });

  it("recognises only explicit DEFIB join requests as temporary access", () => {
    expect(isTemporaryDefibRequest("defib")).toBe(true);
    expect(isTemporaryDefibRequest("DEFIB")).toBe(true);
    expect(isTemporaryDefibRequest("facilitator")).toBe(false);
    expect(isTemporaryDefibRequest(undefined)).toBe(false);
  });

  it("limits temporary DEFIB access to a valid join route", () => {
    expect(isValidDefibJoinRequest("/join", "session-a", "defib")).toBe(true);
    expect(isValidDefibJoinRequest("/", "session-a", "defib")).toBe(false);
    expect(isValidDefibJoinRequest("/profile", "session-a", "defib")).toBe(false);
    expect(isValidDefibJoinRequest("/modal", "session-a", "defib")).toBe(false);
    expect(isValidDefibJoinRequest("/join", "", "defib")).toBe(false);
    expect(isValidDefibJoinRequest("/join", "session-a", "facilitator")).toBe(false);
  });
});
