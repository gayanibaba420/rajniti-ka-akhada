import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    Accept: "application/json",
  };

  try {
    const [goldRes, silverRes, sensexRes, inrRes] = await Promise.allSettled([
      fetch("https://query1.finance.yahoo.com/v8/finance/chart/GC=F", { headers, next: { revalidate: 300 } }).then((r) => r.json()),
      fetch("https://query1.finance.yahoo.com/v8/finance/chart/SI=F", { headers, next: { revalidate: 300 } }).then((r) => r.json()),
      fetch("https://query1.finance.yahoo.com/v8/finance/chart/%5EBSESN", { headers, next: { revalidate: 300 } }).then((r) => r.json()),
      fetch("https://query1.finance.yahoo.com/v8/finance/chart/INR=X", { headers, next: { revalidate: 300 } }).then((r) => r.json()),
    ]);

    let usdInr = 87.5;
    if (inrRes.status === "fulfilled" && inrRes.value?.chart?.result?.[0]?.meta?.regularMarketPrice) {
      usdInr = inrRes.value.chart.result[0].meta.regularMarketPrice;
    }

    const rates = [];

    // 1. Gold 24K (per 10g in INR with Indian standard custom & GST ~15%)
    if (goldRes.status === "fulfilled" && goldRes.value?.chart?.result?.[0]?.meta) {
      const meta = goldRes.value.chart.result[0].meta;
      const currentOz = meta.regularMarketPrice || 2750;
      const prevOz = meta.chartPreviousClose || currentOz;
      
      const gold10g = Math.round((currentOz / 31.1034768) * 10 * usdInr * 0.96); // Normalized standard Indian 24K rate
      const prev10g = Math.round((prevOz / 31.1034768) * 10 * usdInr * 0.96);
      const diff = gold10g - prev10g;

      rates.push({
        label: "सोना (24K)",
        val: `₹${gold10g.toLocaleString("en-IN")}/10g`,
        change: diff >= 0 ? `+₹${diff}` : `-₹${Math.abs(diff)}`,
        up: diff >= 0,
      });
    } else {
      rates.push({ label: "सोना (24K)", val: "₹86,450/10g", change: "+₹220", up: true });
    }

    // 2. Silver (per 1kg in INR)
    if (silverRes.status === "fulfilled" && silverRes.value?.chart?.result?.[0]?.meta) {
      const meta = silverRes.value.chart.result[0].meta;
      const currentOz = meta.regularMarketPrice || 32.5;
      const prevOz = meta.chartPreviousClose || currentOz;

      const silverKg = Math.round((currentOz / 31.1034768) * 1000 * usdInr * 0.95);
      const prevKg = Math.round((prevOz / 31.1034768) * 1000 * usdInr * 0.95);
      const diff = silverKg - prevKg;

      rates.push({
        label: "चांदी",
        val: `₹${silverKg.toLocaleString("en-IN")}/kg`,
        change: diff >= 0 ? `+₹${diff}` : `-₹${Math.abs(diff)}`,
        up: diff >= 0,
      });
    } else {
      rates.push({ label: "चांदी", val: "₹96,200/kg", change: "+₹450", up: true });
    }

    // 3. Sensex
    if (sensexRes.status === "fulfilled" && sensexRes.value?.chart?.result?.[0]?.meta) {
      const meta = sensexRes.value.chart.result[0].meta;
      const current = Math.round(meta.regularMarketPrice || 81500);
      const prev = Math.round(meta.chartPreviousClose || current);
      const diff = current - prev;

      rates.push({
        label: "सेंसेक्स",
        val: current.toLocaleString("en-IN"),
        change: diff >= 0 ? `+${diff}` : `${diff}`,
        up: diff >= 0,
      });
    } else {
      rates.push({ label: "सेंसेक्स", val: "81,780", change: "+240", up: true });
    }

    return NextResponse.json({ success: true, rates, timestamp: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({
      success: false,
      rates: [
        { label: "सोना (24K)", val: "₹86,450/10g", change: "+₹220", up: true },
        { label: "चांदी", val: "₹96,200/kg", change: "+₹450", up: true },
        { label: "सेंसेक्स", val: "81,780", change: "+240", up: true },
      ],
    });
  }
}
