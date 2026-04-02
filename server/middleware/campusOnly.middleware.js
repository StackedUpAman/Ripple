import fetch from "node-fetch";

export const campusOnly = async (req, res, next) => {
    const ALLOWED_ASNS = [
        "AS152533", // NITK
        "AS9829",   // BSNL
        "AS24186",  // RailTel
        "AS55824"   // NKN
    ];

  try {
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress;

    const r = await fetch(
      `https://ipinfo.io/${ip}?token=${process.env.IPINFO_TOKEN}`
    );
    
    if (!r.ok) throw new Error("IP Lookup Failed");

    const data = await r.json();
    const asn = data.org?.split(" ")[0];

    console.log(`[Network Filter] IP: ${ip} | ASN: ${asn}`);

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