// Thin wrapper around window.location.assign — exists primarily to keep
// navigation calls mockable in tests. jsdom 26+ (used by Jest 30) marks
// every property of window.location as non-writable + non-configurable,
// so the only way to assert "code triggered a navigation" is to mock the
// callsite at the module boundary.
export const navigateTo = (url: string): void => {
  window.location.assign(url);
};
