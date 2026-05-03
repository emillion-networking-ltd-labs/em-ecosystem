/**
 * Regression tests for SCRUM-342: 401 routing in ApiClient must skip
 * silentRefresh for unauthenticated auth endpoints (login, register,
 * refresh, forgot-password). Their 401 means "credentials invalid",
 * not "session expired".
 */

jest.mock("@/lib/csrf", () => ({
  getCsrfToken: jest.fn().mockResolvedValue("csrf-token-test"),
  clearCsrfToken: jest.fn(),
}));

import { apiClient, SessionExpiredError, API_BASE_URL } from "@/lib/api";

const url = (endpoint: string) => `${API_BASE_URL}${endpoint}`;

// Minimal Response-shaped object — jsdom's global Response is not always available
const jsonResponse = (status: number, body: unknown) => {
  const make = () => ({
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
    clone: () => make(),
    headers: { get: () => null as string | null },
  });
  return make() as unknown as Response;
};

describe("ApiClient — 401 routing (SCRUM-342)", () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    apiClient.clearAccessToken();
    apiClient.setOnAuthFailure(null);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("does NOT call silentRefresh on 401 from /auth/login", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(401, {
        success: false,
        error: {
          message: "Invalid credentials",
          code: "UNAUTHORIZED",
          statusCode: 401,
        },
      }),
    );

    await expect(
      apiClient.post("/auth/login", { email: "x@y.z", password: "wrong" }),
    ).rejects.toMatchObject({
      error: { message: "Invalid credentials", code: "UNAUTHORIZED" },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalledWith(
      url("/auth/refresh"),
      expect.anything(),
    );
  });

  it("does NOT call silentRefresh on 401 from /auth/register", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(401, {
        success: false,
        error: { message: "Invalid credentials", statusCode: 401 },
      }),
    );

    await expect(
      apiClient.post("/auth/register", { email: "x@y.z", password: "p" }),
    ).rejects.toMatchObject({
      error: { message: "Invalid credentials" },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("STILL calls silentRefresh on 401 from authenticated endpoint /auth/me", async () => {
    fetchMock
      // Initial /auth/me → 401
      .mockResolvedValueOnce(
        jsonResponse(401, {
          success: false,
          error: { message: "Unauthorized", statusCode: 401 },
        }),
      )
      // /auth/refresh → 200 with new accessToken
      .mockResolvedValueOnce(
        jsonResponse(200, { accessToken: "new-access-token" }),
      )
      // Retry /auth/me → 200 with user
      .mockResolvedValueOnce(jsonResponse(200, { id: "u1", email: "a@b.c" }));

    const user = await apiClient.get<{ id: string; email: string }>("/auth/me");

    expect(user).toEqual({ id: "u1", email: "a@b.c" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      url("/auth/refresh"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("preserves the original error body on 401 from skipped endpoint", async () => {
    const errorBody = {
      success: false,
      error: {
        message: "Invalid credentials",
        code: "UNAUTHORIZED",
        statusCode: 401,
      },
    };
    fetchMock.mockResolvedValueOnce(jsonResponse(401, errorBody));

    let thrown: unknown;
    try {
      await apiClient.post("/auth/login", { email: "a@b.c", password: "x" });
    } catch (e) {
      thrown = e;
    }

    expect(thrown).not.toBeInstanceOf(SessionExpiredError);
    expect(thrown).toMatchObject({
      error: { message: "Invalid credentials" },
    });
  });

  it("does NOT trigger onAuthFailure callback on 401 from skipped endpoint", async () => {
    const onAuthFailure = jest.fn();
    apiClient.setOnAuthFailure(onAuthFailure);

    fetchMock.mockResolvedValueOnce(
      jsonResponse(401, {
        success: false,
        error: { message: "Invalid credentials", statusCode: 401 },
      }),
    );

    await expect(
      apiClient.post("/auth/login", { email: "x@y.z", password: "wrong" }),
    ).rejects.toBeDefined();

    expect(onAuthFailure).not.toHaveBeenCalled();
  });
});
