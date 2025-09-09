const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
let localCities = [];
try {
    const p = path.join(__dirname, '../data/cities_he.json');
    localCities = JSON.parse(fs.readFileSync(p, 'utf8'));
} catch (e) {
    localCities = [];
}

// Simple in-memory cache with TTL
const cache = new Map();
const CACHE_VERSION = 'v2';
const getCache = (key) => {
    const item = cache.get(key);
    if (!item) return null;
    const { value, expireAt } = item;
    if (Date.now() > expireAt) {
        cache.delete(key);
        return null;
    }
    return value;
};
const setCache = (key, value, ttlMs = 1000 * 60 * 60 * 12) => {
    cache.set(key, { value, expireAt: Date.now() + ttlMs });
};

// Helper: fetch JSON with UA
const fetchJson = async (url) => {
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'WellnessPlatform/1.0 (contact: support@wellness-platform.com)'
        }
    });
    if (!res.ok) throw new Error(`Upstream error ${res.status}`);
    return res.json();
};

// Helper: POST to Overpass API
const overpass = async (query) => {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'User-Agent': 'WellnessPlatform/1.0 (contact: support@wellness-platform.com)'
        },
        body: 'data=' + encodeURIComponent(query)
    });
    if (!res.ok) throw new Error(`Overpass error ${res.status}`);
    return res.json();
};

// GET /api/geo/cities?search=תל
router.get('/cities', async (req, res) => {
    try {
        const search = (req.query.search || '').trim();
        if (!search) return res.json({ success: true, data: [] });

        const cacheKey = `${CACHE_VERSION}:cities:${search}`;
        const cached = getCache(cacheKey);
        if (cached) return res.json({ success: true, data: cached });

        // Nominatim freeform q + סינון לפי קוד מדינה (il)
        // Fallback מקומי: מסנן רשימת ערים סטטית (יעיל לשתי-שלוש אותיות ראשונות)
        const lowered = search.toLowerCase();
        const local = localCities.filter(c => c.toLowerCase().includes(lowered)).slice(0, 10);

        let url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&accept-language=he&countrycodes=il&q=${encodeURIComponent(search)}&limit=50`;
        let json = [];
        try {
            json = await fetchJson(url);
        } catch (e) {
            json = [];
        }
        if (!Array.isArray(json) || json.length === 0) {
            // Fallback: Overpass API חיפוש ישובים לפי regex (לא מפיל את הבקשה במקרה של 429)
            try {
                const esc = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const q = `
                    [out:json][timeout:25];
                    area["ISO3166-1"="IL"][admin_level=2]->.il;
                    (
                      node["place"~"city|town|village|hamlet"](area.il)["name"~"${esc}",i];
                      node["place"~"city|town|village|hamlet"](area.il)["name:he"~"${esc}",i];
                      way["place"~"city|town|village|hamlet"](area.il)["name"~"${esc}",i];
                      relation["place"~"city|town|village|hamlet"](area.il)["name"~"${esc}",i];
                    );
                    out tags center 50;`;
                const over = await overpass(q);
                json = (over.elements || []).map(el => ({
                    address: { city: el.tags['name:he'] || el.tags.name },
                    lat: (el.center && el.center.lat) || el.lat,
                    lon: (el.center && el.center.lon) || el.lon,
                    addresstype: 'city',
                    display_name: `${el.tags['name:he'] || el.tags.name}, Israel`
                }));
            } catch (e) {
                json = [];
            }
        }
        const allowed = new Set(['city', 'town', 'village', 'hamlet', 'municipality', 'locality']);
        let results = [];
        const seen = new Set();
        const pushUnique = (name, lat, lon) => {
            const clean = (name || '').trim();
            if (!clean || seen.has(clean)) return;
            seen.add(clean);
            results.push({ name: clean, lat, lon });
        };
        for (const item of json) {
            const addr = item.address || {};
            const type = item.addresstype || item.type;
            const name = addr.city || addr.town || addr.village || addr.hamlet || item.name || (item.display_name || '').split(',')[0];
            const inIsrael = (item.display_name || '').includes('Israel') || addr.country === 'Israel' || addr.country_code === 'il';
            if (!name || !inIsrael) continue;
            if (type && !allowed.has(type)) continue;
            pushUnique(name, item.lat, item.lon);
        }

        // השלים תמיד ב-Overpass ומזג, כדי לא לפספס התאמות בעברית (כמו "ירוש")
        const esc = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const q = `
            [out:json][timeout:25];
            area["ISO3166-1"="IL"][admin_level=2]->.il;
            (
              node["place"~"city|town|village|hamlet"](area.il)["name"~"${esc}",i];
              node["place"~"city|town|village|hamlet"](area.il)["name:he"~"${esc}",i];
              way["place"~"city|town|village|hamlet"](area.il)["name"~"${esc}",i];
              relation["place"~"city|town|village|hamlet"](area.il)["name"~"${esc}",i];
            );
            out tags center 100;`;
        try {
            const over = await overpass(q);
            for (const el of (over.elements || [])) {
                const nm = el.tags && (el.tags['name:he'] || el.tags.name);
                const lat = (el.center && el.center.lat) || el.lat;
                const lon = (el.center && el.center.lon) || el.lon;
                pushUnique(nm, lat, lon);
            }
        } catch (e) {
            // ignore fallback errors
        }

        // הוספת מקומיים ברשימה
        for (const nm of local) pushUnique(nm);

        // מיון: התאמות שמתחילות בטקסט תחילה, אח"כ שמכילות, ולבסוף לפי אורך
        const qstr = search.trim();
        results.sort((a, b) => {
            const an = a.name || '';
            const bn = b.name || '';
            const aStarts = an.startsWith(qstr) ? 0 : (an.includes(qstr) ? 1 : 2);
            const bStarts = bn.startsWith(qstr) ? 0 : (bn.includes(qstr) ? 1 : 2);
            if (aStarts !== bStarts) return aStarts - bStarts;
            return an.length - bn.length;
        });

        // הגבלה לעד 20 תוצאות
        results = results.slice(0, 20);
        // TTL קצר יותר לחיפושים קצרים כדי למנוע קיבעון תוצאות חלקיות
        const ttl = search.length < 4 ? 1000 * 60 * 1 : undefined;
        setCache(cacheKey, results, ttl);
        res.json({ success: true, data: results });
    } catch (error) {
        console.error('Cities search error:', error);
        res.status(500).json({ success: false, error: 'שגיאה בשליפת ערים' });
    }
});

// GET /api/geo/streets?city=תל אביב&search=דיז
router.get('/streets', async (req, res) => {
    try {
        const city = (req.query.city || '').trim();
        const search = (req.query.search || '').trim();
        if (!city || !search) return res.json({ success: true, data: [] });

        const cacheKey = `${CACHE_VERSION}:streets:${city}:${search}`;
        const cached = getCache(cacheKey);
        if (cached) return res.json({ success: true, data: cached });

        let url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&namedetails=1&accept-language=he&countrycodes=il&q=${encodeURIComponent(`${search} ${city}`)}&limit=25`;
        let json = await fetchJson(url);
        if (!Array.isArray(json) || json.length === 0) {
            // Fallback: Overpass API חיפוש רחובות בעיר
            const escCity = city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const esc = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const q = `
              [out:json][timeout:25];
              area["ISO3166-1"="IL"][admin_level=2]->.il;
              (
                area["name:he"="${escCity}"];
                area["name"="${escCity}"];
              )->.searchArea;
              way["highway"](area.searchArea)["name"~"${esc}",i];
              out tags 50;`;
            const over = await overpass(q);
            json = (over.elements || []).map(el => ({
                address: { road: el.tags['name:he'] || el.tags.name },
                class: 'highway',
                type: el.tags.highway,
                display_name: `${el.tags['name:he'] || el.tags.name}, ${city}, Israel`
            }));
        }
        const results = [];
        const seen = new Set();
        const accepted = new Set(['highway', 'residential', 'tertiary', 'secondary', 'primary', 'living_street', 'pedestrian', 'unclassified', 'service']);
        for (const item of json) {
            const addr = item.address || {};
            let name = addr.road || addr.pedestrian || addr.footway || addr.path || addr.residential || addr.neighbourhood;
            if (!name && (item.class === 'highway' || accepted.has(item.type))) {
                name = (item.namedetails && (item.namedetails.name || item.namedetails['name:he'])) || item.name || (item.display_name || '').split(',')[0];
            }
            if (!name) continue;
            const clean = name.trim();
            if (!clean || seen.has(clean)) continue;
            seen.add(clean);
            results.push({ name: clean });
        }
        // TTL קצר יותר לחיפושים קצרים
        const ttlStreets = search.length < 4 ? 1000 * 60 * 1 : 1000 * 60 * 60 * 6;
        setCache(cacheKey, results, ttlStreets);
        res.json({ success: true, data: results });
    } catch (error) {
        console.error('Streets search error:', error);
        res.status(500).json({ success: false, error: 'שגיאה בשליפת רחובות' });
    }
});

module.exports = router;

