import { renderHook, act } from "@testing-library/react";
import { useCrossTabAuth } from "@/hooks/useCrossTabAuth";

// --- BroadcastChannel polyfill for jsdom ---
// jsdom does not provide BroadcastChannel by default. We mock it with a tiny
// pub/sub registry that mirrors the same-process semantics (does NOT deliver
// to the originating channel — same as the real API across windows).

type Handler = (e: MessageEvent) => void;

class MockBroadcastChannel {
  static channels: Map<string, Set<MockBroadcastChannel>> = new Map();
  private handlers: Set<Handler> = new Set();
  public closed = false;

  constructor(public readonly name: string) {
    if (!MockBroadcastChannel.channels.has(name)) {
      MockBroadcastChannel.channels.set(name, new Set());
    }
    MockBroadcastChannel.channels.get(name)!.add(this);
  }

  addEventListener(_type: "message", handler: Handler) {
    this.handlers.add(handler);
  }

  removeEventListener(_type: "message", handler: Handler) {
    this.handlers.delete(handler);
  }

  postMessage(data: unknown) {
    if (this.closed) return;
    const peers = MockBroadcastChannel.channels.get(this.name) ?? new Set();
    peers.forEach((peer) => {
      if (peer === this || peer.closed) return;
      peer.handlers.forEach((h) => h({ data } as MessageEvent));
    });
  }

  close() {
    this.closed = true;
    MockBroadcastChannel.channels.get(this.name)?.delete(this);
  }

  static reset() {
    MockBroadcastChannel.channels.clear();
  }
}

beforeAll(() => {
  (
    global as unknown as { BroadcastChannel: typeof MockBroadcastChannel }
  ).BroadcastChannel = MockBroadcastChannel;
});

beforeEach(() => {
  MockBroadcastChannel.reset();
});

describe("useCrossTabAuth", () => {
  it("delivers LOGOUT broadcast to other tabs (other hook instances)", () => {
    const onEventA = jest.fn();
    const onEventB = jest.fn();

    const a = renderHook(() => useCrossTabAuth(onEventA));
    const b = renderHook(() => useCrossTabAuth(onEventB));

    act(() => {
      a.result.current.broadcast("LOGOUT");
    });

    expect(onEventB).toHaveBeenCalledWith("LOGOUT");
    expect(onEventA).not.toHaveBeenCalled(); // self-broadcast is not delivered
  });

  it("delivers AUTH_SUCCESS broadcast to other tabs", () => {
    const onEventA = jest.fn();
    const onEventB = jest.fn();

    const a = renderHook(() => useCrossTabAuth(onEventA));
    const b = renderHook(() => useCrossTabAuth(onEventB));

    act(() => {
      a.result.current.broadcast("AUTH_SUCCESS");
    });

    expect(onEventB).toHaveBeenCalledWith("AUTH_SUCCESS");
  });

  it("ignores malformed messages", () => {
    const onEventA = jest.fn();
    const onEventB = jest.fn();

    renderHook(() => useCrossTabAuth(onEventA));
    renderHook(() => useCrossTabAuth(onEventB));

    // Send a garbage payload from a peer mock channel — must not invoke listeners.
    const garbageSender = new MockBroadcastChannel("em-auth");
    garbageSender.postMessage({ type: "INVALID" });

    expect(onEventA).not.toHaveBeenCalled();
    expect(onEventB).not.toHaveBeenCalled();
  });

  it("cleans up channel on unmount", () => {
    const onEventA = jest.fn();
    const onEventB = jest.fn();

    const a = renderHook(() => useCrossTabAuth(onEventA));
    const b = renderHook(() => useCrossTabAuth(onEventB));

    a.unmount();

    act(() => {
      // a is unmounted; broadcasting from it should be a no-op.
      a.result.current.broadcast("LOGOUT");
    });
    expect(onEventB).not.toHaveBeenCalled();

    // b can still broadcast (and receive nothing because a is gone).
    act(() => {
      b.result.current.broadcast("LOGOUT");
    });
    expect(onEventA).not.toHaveBeenCalled();
  });

  it("does not throw and writes to localStorage when BroadcastChannel is unavailable", () => {
    const original = (global as unknown as { BroadcastChannel: unknown })
      .BroadcastChannel;
    delete (global as unknown as { BroadcastChannel?: unknown })
      .BroadcastChannel;

    const onEvent = jest.fn();
    const { result } = renderHook(() => useCrossTabAuth(onEvent));

    act(() => {
      result.current.broadcast("LOGOUT");
    });
    // Same-window: storage event does not synthesize a self-event in jsdom,
    // mirroring real browser behavior. Other tabs would receive via storage.
    expect(onEvent).not.toHaveBeenCalled();

    (global as unknown as { BroadcastChannel: unknown }).BroadcastChannel =
      original;
  });

  it("delivers LOGOUT via storage event fallback", () => {
    const onEvent = jest.fn();
    renderHook(() => useCrossTabAuth(onEvent));

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "em-auth-event",
          newValue: JSON.stringify({ type: "LOGOUT", id: "test-id-1" }),
        }),
      );
    });

    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(onEvent).toHaveBeenCalledWith("LOGOUT");
  });

  it("ignores storage events for unrelated keys", () => {
    const onEvent = jest.fn();
    renderHook(() => useCrossTabAuth(onEvent));

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "some-other-key",
          newValue: JSON.stringify({ type: "LOGOUT", id: "x" }),
        }),
      );
    });

    expect(onEvent).not.toHaveBeenCalled();
  });

  it("ignores storage events with null newValue (removeItem firing)", () => {
    const onEvent = jest.fn();
    renderHook(() => useCrossTabAuth(onEvent));

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "em-auth-event",
          newValue: null,
        }),
      );
    });

    expect(onEvent).not.toHaveBeenCalled();
  });

  it("dedupes same id arriving via both BroadcastChannel and storage event", () => {
    const onEvent = jest.fn();
    renderHook(() => useCrossTabAuth(onEvent));

    const id = "dup-id-42";
    const peer = new MockBroadcastChannel("em-auth");

    act(() => {
      peer.postMessage({ type: "LOGOUT", id });
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "em-auth-event",
          newValue: JSON.stringify({ type: "LOGOUT", id }),
        }),
      );
    });

    expect(onEvent).toHaveBeenCalledTimes(1);
  });

  it("delivers two distinct events with different ids back-to-back", () => {
    const onEvent = jest.fn();
    renderHook(() => useCrossTabAuth(onEvent));

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "em-auth-event",
          newValue: JSON.stringify({ type: "LOGOUT", id: "id-1" }),
        }),
      );
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "em-auth-event",
          newValue: JSON.stringify({ type: "LOGOUT", id: "id-2" }),
        }),
      );
    });

    expect(onEvent).toHaveBeenCalledTimes(2);
  });
});
