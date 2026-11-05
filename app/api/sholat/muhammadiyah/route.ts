import { NextRequest, NextResponse } from 'next/server';

// Server-side proxy and cache for official Muhammadiyah KHGT prayer schedule API
const KHGT_EXTERNAL_URL = 'https://api-khgt.muhammadiyah.or.id/api/sholat/schedule';

interface CacheEntry {
  data: any;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lat, lng, elevation, date, mode = 'monthly_masehi' } = body;

    if (lat === undefined || lng === undefined || !date) {
      return NextResponse.json({ success: false, error: 'Parameter lat, lng, dan date diperlukan.' }, { status: 400 });
    }

    const cacheKey = `${Number(lat).toFixed(4)}_${Number(lng).toFixed(4)}_${date}_${mode}`;
    const cached = memoryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached.data, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
        },
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const requestPayload: any = {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      date: String(date),
      mode,
    };
    if (elevation !== undefined && !isNaN(Number(elevation))) {
      requestPayload.elevation = Number(elevation);
    }

    const res = await fetch(KHGT_EXTERNAL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AstroFalak-App/1.0',
      },
      body: JSON.stringify(requestPayload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`KHGT API responded with status ${res.status}`);
    }

    const data = await res.json();
    if (data && data.success && data.data) {
      memoryCache.set(cacheKey, { data, timestamp: Date.now() });
      return NextResponse.json(data, {
        headers: {
          'X-Cache': 'MISS',
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
        },
      });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.warn('[API Muhammadiyah KHGT proxy error]:', err?.message || err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Gagal menghubungi server API KHGT Muhammadiyah',
      },
      { status: 502 }
    );
  }
}
