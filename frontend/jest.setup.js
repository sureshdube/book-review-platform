// Polyfill for TextEncoder/TextDecoder in Jest
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Mock import.meta.env for Vite in Jest
if (!global.hasOwnProperty('import')) {
  global.import = {};
}
if (!global.import.meta) {
  global.import.meta = { env: { VITE_API_BASE: '' } };
}