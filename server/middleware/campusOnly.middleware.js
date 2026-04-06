import fetch from "node-fetch";

export const campusOnly = async (req, res, next) => {
    const ALLOWED_ASNS = [
      "AS152533", // NITK
      "AS9829",   // BSNL
      "AS24186",  // RailTel
      "AS55824"   // NKN
    ];

  try {
    let ip =
      req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
      req.socket.remoteAddress;

    if (ip.substr(0, 7) == "::ffff:") {
      ip = ip.substr(7);
    }

    let ipToLookup = ip;
    let isLocal = ip === "127.0.0.1" || ip === "::1" || /^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])\.|^192\.168\./.test(ip);

    // If testing on localhost or local network, fetch the machine's real public IP 
    // to strictly verify the connected WiFi network.
    if (isLocal) {
      try {
        const pIpRes = await fetch("https://api64.ipify.org?format=json");
        if (pIpRes.ok) {
          const pIpData = await pIpRes.json();
          ipToLookup = pIpData.ip;
          console.log(`[Network Filter] Local connection, resolving fresh public IP: ${ipToLookup}`);
        }
      } catch (err) {
        console.error("Failed to fetch public IP for dev check", err.message);
      }
    }

    const url = process.env.IPINFO_TOKEN 
      ? `https://ipinfo.io/${ipToLookup}?token=${process.env.IPINFO_TOKEN}`
      : `https://ipinfo.io/${ipToLookup}/json`;

    const r = await fetch(url);
    
    if (!r.ok) throw new Error(`IP Lookup Failed: ${r.statusText}`);

    const data = await r.json();

    const asn = data.org?.split(" ")[0];

    console.log(`[Network Filter] Evaluated IP: ${ipToLookup} | Org: ${data.org} | ASN: ${asn}`);

    if (!ALLOWED_ASNS.includes(asn)) {
      return res.status(403).json({
        error: "Access Restricted: Campus network only",
        ip,
        asn
      });
    }

    req.clientIP = ip;
    next();
  } catch (error) {
    console.error("Middleware Error:", error.message);
    return res.status(500).json({ error: "Network validation failed" });
  }
};