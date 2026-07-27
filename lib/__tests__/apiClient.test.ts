import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/csrf-protection", () => ({
  csrfProtection: {
    getCurrentToken: vi.fn().mockReturnValue("test-csrf-token"),
    initialize: vi.fn().mockReturnValue("test-csrf-token"),
  },
}));

vi.mock("@/lib/offline-queue", () => ({
  enqueueOfflineRequest: vi.fn(),
}));

import {
  ApiError,
  isAccountFrozenError,
  ACCOUNT_FROZEN_MESSAGE,
} from "@/lib/api";

const mockFetch = vi.fn();

let localStorageGetItem: ReturnType<typeof vi.fn>;
let localStorageSetItem: ReturnType<typeof vi.fn>;
let localStorageRemoveItem: ReturnType<typeof vi.fn>;
let localStorageClear: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);

  localStorageGetItem = vi.fn().mockReturnValue(null);
  localStorageSetItem = vi.fn();
  localStorageRemoveItem = vi.fn();
  localStorageClear = vi.fn();
  vi.stubGlobal("localStorage", {
    getItem: localStorageGetItem,
    setItem: localStorageSetItem,
    removeItem: localStorageRemoveItem,
    clear: localStorageClear,
  });

  Object.defineProperty(navigator, "onLine", {
    value: true,
    writable: true,
    configurable: true,
  });
  process.env.NEXT_PUBLIC_BACKEND_URL = "http://localhost:4000";
  process.env.NODE_ENV = "test";
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function jsonResponse(data: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ "content-type": "application/json" }),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as unknown as Response;
}

function errorResponse(body: unknown, status: number): Response {
  return {
    ok: false,
    status,
    headers: new Headers({ "content-type": "application/json" }),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
}

function emptyResponse(status: number): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    json: () => Promise.resolve(null),
    text: () => Promise.resolve(""),
  } as unknown as Response;
}

describe("ApiError", () => {
  it("creates an error with all fields", () => {
    const err = new ApiError({
      message: "Not found",
      status: 404,
      code: "NOT_FOUND",
      details: { field: "id" },
    });

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.name).toBe("ApiError");
    expect(err.message).toBe("Not found");
    expect(err.status).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
    expect(err.details).toEqual({ field: "id" });
  });

  it("creates an error with minimal fields", () => {
    const err = new ApiError({ message: "Error", status: 500 });
    expect(err.status).toBe(500);
    expect(err.code).toBeUndefined();
    expect(err.details).toBeUndefined();
  });
});

describe("isAccountFrozenError", () => {
  it("returns true for ACCOUNT_FROZEN code", () => {
    const err = new ApiError({
      message: "Frozen",
      status: 403,
      code: "ACCOUNT_FROZEN",
    });
    expect(isAccountFrozenError(err)).toBe(true);
  });

  it("returns false for other codes", () => {
    const err = new ApiError({
      message: "Forbidden",
      status: 403,
      code: "FORBIDDEN",
    });
    expect(isAccountFrozenError(err)).toBe(false);
  });

  it("returns false for non-ApiError values", () => {
    expect(isAccountFrozenError(new Error("frozen"))).toBe(false);
    expect(isAccountFrozenError(null)).toBe(false);
    expect(isAccountFrozenError("string")).toBe(false);
  });
});

describe("apiClient wrappers", () => {
  let apiGet: typeof import("@/lib/apiClient").apiGet;
  let apiPost: typeof import("@/lib/apiClient").apiPost;
  let apiPut: typeof import("@/lib/apiClient").apiPut;
  let apiPatch: typeof import("@/lib/apiClient").apiPatch;
  let apiDelete: typeof import("@/lib/apiClient").apiDelete;
  let apiGetUnversioned: typeof import("@/lib/apiClient").apiGetUnversioned;
  let withQuery: typeof import("@/lib/apiClient").withQuery;

  beforeEach(async () => {
    const mod = await import("@/lib/apiClient");
    apiGet = mod.apiGet;
    apiPost = mod.apiPost;
    apiPut = mod.apiPut;
    apiPatch = mod.apiPatch;
    apiDelete = mod.apiDelete;
    apiGetUnversioned = mod.apiGetUnversioned;
    withQuery = mod.withQuery;
  });

  describe("success responses", () => {
    it("apiGet parses JSON response", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ users: [] }));
      const result = await apiGet("/users");
      expect(result).toEqual({ users: [] });
    });

    it("apiPost parses JSON response", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ id: 1 }, 201));
      const result = await apiPost("/users", { name: "Test" });
      expect(result).toEqual({ id: 1 });
    });

    it("apiPut parses JSON response", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ id: 1, name: "Updated" }));
      const result = await apiPut("/users/1", { name: "Updated" });
      expect(result).toEqual({ id: 1, name: "Updated" });
    });

    it("apiPatch parses JSON response", async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ id: 1, name: "Patched" }),
      );
      const result = await apiPatch("/users/1", { name: "Patched" });
      expect(result).toEqual({ id: 1, name: "Patched" });
    });

    it("apiDelete parses JSON response", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ deleted: true }));
      const result = await apiDelete("/users/1");
      expect(result).toEqual({ deleted: true });
    });

    it("returns null for 204 No Content", async () => {
      mockFetch.mockResolvedValueOnce(emptyResponse(204));
      const result = await apiGet("/void");
      expect(result).toBeNull();
    });

    it("returns null for 205 Reset Content", async () => {
      mockFetch.mockResolvedValueOnce(emptyResponse(205));
      const result = await apiGet("/reset");
      expect(result).toBeNull();
    });
  });

  describe("URL construction", () => {
    it("prepends /api/v1 to versioned paths", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}));
      await apiGet("/users");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:4000/api/v1/users",
        expect.anything(),
      );
    });

    it("does not prepend /api/v1 for unversioned paths", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}));
      await apiGetUnversioned("/tenant/profile");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:4000/tenant/profile",
        expect.anything(),
      );
    });
  });

  describe("auth headers", () => {
    it("attaches Authorization header when token is present", async () => {
      localStorageGetItem.mockImplementation((key: string) => {
        if (key === "shelterflex_token") return "test-token-123";
        return null;
      });
      mockFetch.mockResolvedValueOnce(jsonResponse({}));

      await apiGet("/protected");

      const headers = mockFetch.mock.calls[0][1].headers as Headers;
      expect(headers.get("Authorization")).toBe("Bearer test-token-123");
    });

    it("omits Authorization header when no token", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}));

      await apiGet("/public");

      const headers = mockFetch.mock.calls[0][1].headers as Headers;
      expect(headers.get("Authorization")).toBeNull();
    });

    it("sets Content-Type to application/json", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}));

      await apiGet("/items");

      const headers = mockFetch.mock.calls[0][1].headers as Headers;
      expect(headers.get("Content-Type")).toBe("application/json");
    });
  });

  describe("error normalization", () => {
    const errorCases = [
      { status: 400, name: "Bad Request" },
      { status: 401, name: "Unauthorized" },
      { status: 403, name: "Forbidden" },
      { status: 404, name: "Not Found" },
      { status: 409, name: "Conflict" },
      { status: 422, name: "Unprocessable Entity" },
      { status: 500, name: "Internal Server Error" },
      { status: 502, name: "Bad Gateway" },
      { status: 503, name: "Service Unavailable" },
    ];

    it.each(errorCases)(
      "normalizes $status $name to ApiError",
      async ({ status }) => {
        const backendBody = {
          error: { code: `ERR_${status}`, message: `Error ${status}` },
        };
        mockFetch.mockResolvedValueOnce(errorResponse(backendBody, status));

        try {
          await apiGet("/fail", { maxRetries: 0 });
          expect.fail("Should have thrown");
        } catch (err) {
          expect(err).toBeInstanceOf(ApiError);
          expect((err as ApiError).status).toBe(status);
        }
      },
    );

    it("uses fallback message when backend error body has no message", async () => {
      mockFetch.mockResolvedValueOnce(errorResponse({}, 500));

      try {
        await apiGet("/fail", { maxRetries: 0 });
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).status).toBe(500);
        expect((err as ApiError).message).toMatch(/API error: 500/);
      }
    });

    it("extracts code and details from backend error body", async () => {
      const backendBody = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid email",
          details: { field: "email" },
        },
      };
      mockFetch.mockResolvedValueOnce(errorResponse(backendBody, 422));

      try {
        await apiGet("/validate");
        expect.fail("Should have thrown");
      } catch (err) {
        const apiErr = err as ApiError;
        expect(apiErr.status).toBe(422);
        expect(apiErr.code).toBe("VALIDATION_ERROR");
        expect(apiErr.message).toBe("Invalid email");
        expect(apiErr.details).toEqual({ field: "email" });
      }
    });

    it("handles ACCOUNT_FROZEN code with dedicated message", async () => {
      const backendBody = {
        error: { code: "ACCOUNT_FROZEN", message: "Account frozen" },
      };
      mockFetch.mockResolvedValueOnce(errorResponse(backendBody, 403));

      try {
        await apiGet("/pay");
        expect.fail("Should have thrown");
      } catch (err) {
        const apiErr = err as ApiError;
        expect(apiErr.code).toBe("ACCOUNT_FROZEN");
        expect(apiErr.message).toBe(ACCOUNT_FROZEN_MESSAGE);
        expect(isAccountFrozenError(apiErr)).toBe(true);
      }
    });
  });

  describe("network errors", () => {
    it("wraps 'Failed to fetch' TypeError with connection message", async () => {
      mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

      try {
        await apiGet("/anything");
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
        expect((err as Error).message).toContain("Cannot connect to backend");
      }
    });

    it("re-throws non-fetch TypeErrors as-is", async () => {
      const otherError = new TypeError("Some other type error");
      mockFetch.mockRejectedValueOnce(otherError);

      try {
        await apiGet("/anything");
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBe(otherError);
      }
    });
  });

  describe("retry behavior", () => {
    it("retries GET on 500 and eventually succeeds", async () => {
      mockFetch
        .mockResolvedValueOnce(
          errorResponse({ error: { message: "Error" } }, 500),
        )
        .mockResolvedValueOnce(jsonResponse({ ok: true }));

      const result = await apiGet("/flaky", {
        maxRetries: 1,
        initialDelayMs: 10,
        backoffMultiplier: 1,
      });

      expect(result).toEqual({ ok: true });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("does not retry POST on 400", async () => {
      mockFetch.mockResolvedValueOnce(
        errorResponse({ error: { message: "Bad" } }, 400),
      );

      await expect(
        apiPost("/bad", { data: 1 }, { maxRetries: 3, initialDelayMs: 10 }),
      ).rejects.toThrow();

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("retries GET on 429 and eventually succeeds", async () => {
      mockFetch
        .mockResolvedValueOnce(
          errorResponse({ error: { message: "Rate limited" } }, 429),
        )
        .mockResolvedValueOnce(jsonResponse({ data: "ok" }));

      vi.useFakeTimers();
      const resultPromise = apiGet("/rate-limited", {
        maxRetries: 2,
        initialDelayMs: 50,
        backoffMultiplier: 1,
      });

      await vi.advanceTimersByTimeAsync(100);
      const result = await resultPromise;
      expect(result).toEqual({ data: "ok" });
      expect(mockFetch).toHaveBeenCalledTimes(2);
      vi.useRealTimers();
    });
  });

  describe("body serialization", () => {
    it("JSON.stringifies the body for POST", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true }));
      await apiPost("/data", { key: "value" });

      const body = mockFetch.mock.calls[0][1].body;
      expect(body).toBe(JSON.stringify({ key: "value" }));
    });

    it("JSON.stringifies the body for PUT", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true }));
      await apiPut("/data/1", { key: "updated" });

      const body = mockFetch.mock.calls[0][1].body;
      expect(body).toBe(JSON.stringify({ key: "updated" }));
    });
  });

  describe("withQuery", () => {
    it("appends query params to path", () => {
      expect(withQuery("/items", { status: "active", limit: 10 })).toBe(
        "/items?status=active&limit=10",
      );
    });

    it("omits null/undefined values", () => {
      expect(
        withQuery("/items", {
          status: "active",
          page: undefined,
          limit: null as unknown as undefined,
        }),
      ).toBe("/items?status=active");
    });

    it("returns path unchanged when no params", () => {
      expect(withQuery("/items", {})).toBe("/items");
    });

    it("omits params that are all null/undefined", () => {
      expect(
        withQuery("/items", {
          a: undefined,
          b: null as unknown as undefined,
        }),
      ).toBe("/items");
    });
  });
});
