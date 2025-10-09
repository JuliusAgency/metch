/**
 * Console Suppression Utility
 * 
 * This utility completely suppresses all console output including:
 * - console.log, console.error, console.warn, console.info, console.debug
 * - Uncaught JavaScript errors
 * - Unhandled promise rejections
 * 
 * This prevents users from seeing any debugging information or errors in the browser console.
 */

// Store original console methods (in case we need to restore them later)
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
  trace: console.trace,
  table: console.table,
  group: console.group,
  groupEnd: console.groupEnd,
  groupCollapsed: console.groupCollapsed,
  time: console.time,
  timeEnd: console.timeEnd,
  timeLog: console.timeLog,
  count: console.count,
  countReset: console.countReset,
  clear: console.clear,
  dir: console.dir,
  dirxml: console.dirxml,
  assert: console.assert
};

// Empty function to replace console methods
const noop = () => {};

/**
 * Suppress all console output
 */
export function suppressConsole() {
  // Override all console methods with noop
  Object.keys(originalConsole).forEach(method => {
    console[method] = noop;
  });

  // Handle uncaught JavaScript errors
  window.addEventListener('error', (event) => {
    event.preventDefault();
    event.stopPropagation();
    return false;
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault();
    event.stopPropagation();
    return false;
  });

  // Override console methods on the global console object
  // This ensures even dynamically created console calls are suppressed
  Object.defineProperty(window, 'console', {
    value: {
      log: noop,
      error: noop,
      warn: noop,
      info: noop,
      debug: noop,
      trace: noop,
      table: noop,
      group: noop,
      groupEnd: noop,
      groupCollapsed: noop,
      time: noop,
      timeEnd: noop,
      timeLog: noop,
      count: noop,
      countReset: noop,
      clear: noop,
      dir: noop,
      dirxml: noop,
      assert: noop
    },
    writable: false,
    configurable: false
  });
}

/**
 * Restore original console methods (for development purposes)
 */
export function restoreConsole() {
  Object.keys(originalConsole).forEach(method => {
    console[method] = originalConsole[method];
  });
}

/**
 * Initialize console suppression
 * Call this function early in your application lifecycle
 */
export function initConsoleSuppression() {
  // Suppress console immediately
  suppressConsole();
  
  // Also suppress any console calls that might happen during module loading
  // by overriding console before any modules are loaded
  if (typeof window !== 'undefined') {
    window.console = {
      log: noop,
      error: noop,
      warn: noop,
      info: noop,
      debug: noop,
      trace: noop,
      table: noop,
      group: noop,
      groupEnd: noop,
      groupCollapsed: noop,
      time: noop,
      timeEnd: noop,
      timeLog: noop,
      count: noop,
      countReset: noop,
      clear: noop,
      dir: noop,
      dirxml: noop,
      assert: noop
    };
  }
}

// Auto-initialize if this module is imported
initConsoleSuppression();
