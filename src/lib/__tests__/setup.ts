/**
 * Vitest global setup — runs before any test module is imported, so
 * module-level captures of process.env.REMNAWAVE_* see the right
 * values in tests.
 */

process.env.REMNAWAVE_API_URL = "https://rmnw.test.example";
process.env.REMNAWAVE_API_TOKEN = "test-token-abc";
process.env.REMNAWAVE_MAINSERVER_SQUAD_UUID = "squad-uuid-xyz";
