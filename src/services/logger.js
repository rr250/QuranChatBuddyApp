/**
 * Centralized logging service.
 *
 * In production builds (__DEV__ === false) only `error` level emits output,
 * preventing log leakage in release bundles.
 *
 * Sentry swap: replace the `error` handler body with:
 *   import * as Sentry from '@sentry/react-native';
 *   Sentry.captureException(args[0] instanceof Error ? args[0] : new Error(String(args[0])), { extra: { args } });
 */

const noop = () => {};

const logger = {
    debug: __DEV__ ? (...args) => console.log("[DEBUG]", ...args) : noop,
    info: __DEV__ ? (...args) => console.log("[INFO]", ...args) : noop,
    warn: __DEV__ ? (...args) => console.warn("[WARN]", ...args) : noop,
    /** Always active — swap body for Sentry.captureException in production. */
    error: (...args) => {
        if (__DEV__) {
            console.error("[ERROR]", ...args);
        }
        // Production Sentry hook-point:
        // Sentry.captureException(args[0] instanceof Error ? args[0] : new Error(String(args[0])));
    },
};

export default logger;
