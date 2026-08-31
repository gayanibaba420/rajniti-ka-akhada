import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    Accept: "application/json",
  };

  try {
    const [goldRes, silverRes, sensexRes, niftyRes] = await Promise.allSettled([
      fetch("https://query1.finance.yahoo.com/v8/finance/chart/GOLDBEES.NS", { headers, cache: "no-store" }).then((r) => r.json()),
      fetch("https://query1.finance.yahoo.com/v8/finance/chart/SILVERBEES.NS", { headers, cache: "no-store" }).then((r) => r.json()),
      fetch("https://query1.finance.yahoo.com/v8/finance/chart/%5EBSESN", { headers, cache: "no-store" }).then((r) => r.json()),
      fetch("https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI", { headers, cache: "no-store" }).then((r) => r.json()),
    ]);

    const rates = [];

    // 1. Live 24K Gold Rate in India (per 10g from NSE Gold ETF: 1 unit ~ ₹132 -> ~650x to 10g standard = ~₹86,045)
    if (goldRes.status === "fulfilled" && goldRes.value?.chart?.result?.[0]?.meta) {
      const meta = goldRes.value.chart.result[0].meta;
      const current = meta.regularMarketPrice || 132.37;
      const prev = meta.chartPreviousClose || current;
      
      const gold10g = Math.round(current * 650);
      const prev10g = Math.round(prev * 650);
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

    // 2. Live Silver Rate in India (per 1kg from NSE Silver ETF: 1 unit ~ ₹97.7 -> 1000x to 1kg standard = ~₹97,770)
    if (silverRes.status === "fulfilled" && silverRes.value?.chart?.result?.[0]?.meta) {
      const meta = silverRes.value.chart.result[0].meta;
      const current = meta.regularMarketPrice || 97.77;
      const prev = meta.chartPreviousClose || current;

      const silverKg = Math.round(current * 1000);
      const prevKg = Math.round(prev * 1000);
      const diff = silverKg - prevKg;

      rates.push({
        label: "चांदी",
        val: `₹${silverKg.toLocaleString("en-IN")}/kg`,
        change: diff >= 0 ? `+₹${diff}` : `-₹${Math.abs(diff)}`,
        up: diff >= 0,
      });
    } else {
      rates.push({ label: "चांदी", val: "₹97,770/kg", change: "+₹450", up: true });
    }

    // 3. Live BSE Sensex
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
      rates.push({ label: "सेंसेक्स", val: "76,957", change: "-308", up: false });
    }

    // 4. Live NSE Nifty
    if (niftyRes.status === "fulfilled" && niftyRes.value?.chart?.result?.[0]?.meta) {
      const meta = niftyRes.value.chart.result[0].meta;
      const current = Math.round(meta.regularMarketPrice || 24080);
      const prev = Math.round(meta.chartPreviousClose || current);
      const diff = current - prev;

      rates.push({
        label: "निफ्टी 50",
        val: current.toLocaleString("en-IN"),
        change: diff >= 0 ? `+${diff}` : `${diff}`,
        up: diff >= 0,
      });
    }

    return new NextResponse(
      JSON.stringify({ success: true, rates, timestamp: new Date().toISOString() }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    return NextResponse.json({
      success: false,
      rates: [
        { label: "सोना (24K)", val: "₹86,045/10g", change: "+₹220", up: true },
        { label: "चांदी", val: "₹97,770/kg", change: "+₹767", up: true },
        { label: "सेंसेक्स", val: "76,957", change: "-308", up: false },
      ],
    });
  }
}
