const dns = require("dns").promises;

/**
 * Checks if an IPv4 or IPv6 address is in a private, loopback, link-local, or reserved range.
 * @param {string} ip
 * @returns {boolean}
 */
function isPrivateIp(ip) {
  // Normalize IPv6 mapped IPv4 addresses (e.g. ::ffff:127.0.0.1)
  if (ip.startsWith("::ffff:")) {
    ip = ip.substring(7);
  }

  // IPv4 checks
  const ipv4Parts = ip.split(".").map(Number);
  if (ipv4Parts.length === 4 && !ipv4Parts.some(isNaN)) {
    const [b1, b2, b3, b4] = ipv4Parts;

    // 0.0.0.0/8 - Current network
    if (b1 === 0) return true;
    // 10.0.0.0/8 - Private
    if (b1 === 10) return true;
    // 100.64.0.0/10 - Shared address / Carrier-grade NAT
    if (b1 === 100 && b2 >= 64 && b2 <= 127) return true;
    // 127.0.0.0/8 - Loopback
    if (b1 === 127) return true;
    // 169.254.0.0/16 - Link-local (Cloud metadata e.g. AWS 169.254.169.254)
    if (b1 === 169 && b2 === 254) return true;
    // 172.16.0.0/12 - Private
    if (b1 === 172 && b2 >= 16 && b2 <= 31) return true;
    // 192.0.0.0/24 - IETF protocol assignments
    if (b1 === 192 && b2 === 0 && b3 === 0) return true;
    // 192.0.2.0/24 - TEST-NET-1
    if (b1 === 192 && b2 === 0 && b3 === 2) return true;
    // 192.168.0.0/16 - Private
    if (b1 === 192 && b2 === 168) return true;
    // 198.18.0.0/15 - Benchmarking
    if (b1 === 198 && (b2 === 18 || b2 === 19)) return true;
    // 198.51.100.0/24 - TEST-NET-2
    if (b1 === 198 && b2 === 51 && b3 === 100) return true;
    // 203.0.113.0/24 - TEST-NET-3
    if (b1 === 203 && b2 === 0 && b3 === 113) return true;
    // 224.0.0.0/4 - Multicast
    if (b1 >= 224 && b1 <= 239) return true;
    // 240.0.0.0/4 - Reserved
    if (b1 >= 240) return true;

    return false;
  }

  // IPv6 checks
  const lowerIp = ip.toLowerCase();
  if (
    lowerIp === "::1" || // Loopback
    lowerIp === "::" || // Unspecified
    lowerIp.startsWith("fe80:") || // Link-local
    lowerIp.startsWith("fc00:") || // Unique local
    lowerIp.startsWith("fd00:") // Unique local
  ) {
    return true;
  }

  return false;
}

/**
 * Validates a user-supplied URL to prevent Server-Side Request Forgery (SSRF).
 * Throws an Error if the URL is invalid, unsafe, or resolves to internal resources.
 * @param {string} urlString
 * @returns {Promise<URL>}
 */
async function validateSafeUrl(urlString) {
  let parsedUrl;
  try {
    parsedUrl = new URL(urlString);
  } catch (err) {
    throw new Error("Invalid URL format");
  }

  // Enforce http or https protocol only
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error(`Unsupported protocol: ${parsedUrl.protocol}. Only http and https are allowed.`);
  }

  const hostname = parsedUrl.hostname;

  // Disallow localhost and common local domain names
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new Error("Access to local domains is forbidden");
  }

  // If hostname is directly an IP address, check it immediately
  if (isPrivateIp(hostname)) {
    throw new Error("Access to internal/private IP addresses is forbidden");
  }

  // Resolve hostname via DNS and ensure none of the resolved IPs are private
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    for (const record of addresses) {
      if (isPrivateIp(record.address)) {
        throw new Error(`Hostname resolves to restricted address: ${record.address}`);
      }
    }
  } catch (dnsErr) {
    if (dnsErr.message.includes("restricted address")) {
      throw dnsErr;
    }
    throw new Error(`DNS resolution failed for hostname: ${hostname}`);
  }

  return parsedUrl;
}

module.exports = {
  isPrivateIp,
  validateSafeUrl,
};
