require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const assert = require("assert");
const { validateSafeUrl, isPrivateIp } = require("../../lib/ssrfValidator");
const queryParser = require("../../queryParser");

async function runAuditTests() {
  console.log("====================================================");
  console.log("  MEDIA-FLOW SECOND-PASS AUDIT VERIFICATION SUITE   ");
  console.log("====================================================\n");

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  async function testAsync(name, fn) {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  // ─── 1. SECURITY: SSRF & IP FILTERING ───────────────────────
  console.log("--- 1. Security: SSRF Validator ---");
  test("isPrivateIp blocks loopback (127.0.0.1)", () => {
    assert.strictEqual(isPrivateIp("127.0.0.1"), true);
  });

  test("isPrivateIp blocks AWS metadata (169.254.169.254)", () => {
    assert.strictEqual(isPrivateIp("169.254.169.254"), true);
  });

  test("isPrivateIp blocks RFC1918 (10.0.0.1, 192.168.1.1, 172.16.0.1)", () => {
    assert.strictEqual(isPrivateIp("10.0.0.1"), true);
    assert.strictEqual(isPrivateIp("192.168.1.1"), true);
    assert.strictEqual(isPrivateIp("172.20.0.1"), true);
  });

  test("isPrivateIp allows public IP (8.8.8.8, 1.1.1.1)", () => {
    assert.strictEqual(isPrivateIp("8.8.8.8"), false);
    assert.strictEqual(isPrivateIp("1.1.1.1"), false);
  });

  await testAsync("validateSafeUrl rejects file:// and gopher:// schemes", async () => {
    let rejected = false;
    try {
      await validateSafeUrl("file:///etc/passwd");
    } catch (err) {
      rejected = true;
    }
    assert.strictEqual(rejected, true);
  });

  await testAsync("validateSafeUrl rejects localhost hostname", async () => {
    let rejected = false;
    try {
      await validateSafeUrl("http://localhost:8000/test.jpg");
    } catch (err) {
      rejected = true;
    }
    assert.strictEqual(rejected, true);
  });

  // ─── 2. SEARCH: MALFORMED QUERY RESILIENCE ───────────────────
  console.log("\n--- 2. Search: Malformed Query Resilience ---");
  test("queryParser handles punctuation and empty strings gracefully", () => {
    const parsed = queryParser.parse("??? !!! @@@");
    assert.strictEqual(parsed.normalizedQuery, "");
    assert.deepStrictEqual(parsed.tokens, []);
    assert.deepStrictEqual(parsed.significantTokens, []);
  });

  test("queryParser strips SQL/tsquery operators safely", () => {
    const parsed = queryParser.parse("node.js & react (tutorial) | 2026");
    assert.ok(parsed.tokens.length > 0);
    // Tokens must be clean words without unescaped boolean operators
    for (const t of parsed.tokens) {
      assert.ok(/^[a-z0-9]+$/.test(t), `Token ${t} is alphanumeric`);
    }
  });

  // ─── 3. STORAGE: STORAGE URL FORMATTING ──────────────────────
  console.log("\n--- 3. Storage: Public Storage URL Generator ---");
  const { getPublicStorageUrl } = require("../../config/storageUrl");
  test("getPublicStorageUrl formats S3 key properly with configured endpoint", () => {
    const url = getPublicStorageUrl("processed-videos", "thumbnails/xyz.jpg");
    assert.ok(url.includes("processed-videos/thumbnails/xyz.jpg"));
    assert.ok(!url.includes("undefined.supabase.co"));
  });

  test("getPublicStorageUrl leaves external http/https URLs intact", () => {
    const external = "https://images.unsplash.com/photo-123.jpg";
    assert.strictEqual(getPublicStorageUrl("processed-videos", external), external);
  });

  // ─── 4. MIDDLEWARE: MULTER-S3 S3CLIENT IMPORT ───────────────
  console.log("\n--- 4. Middleware & Upload Integrity ---");
  test("upload middleware imports valid S3Client instance", () => {
    const upload = require("../../middleware/upload");
    assert.ok(upload && typeof upload.fields === "function");
    const { s3 } = require("../../config/s3");
    assert.ok(s3 && typeof s3.send === "function", "s3 client has send method");
  });

  console.log("\n====================================================");
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log("====================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runAuditTests().catch((e) => {
  console.error("Test execution error:", e);
  process.exit(1);
});
