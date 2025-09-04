import React, {useEffect, useState} from "react";
import "./HomePage.css";
import {requireStoreSessionOrRedirect} from "../utils/storeSession";
import TopBar from "../Bar/TopBar";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOURS = Array.from({length: 18}, (_, i) => String(i + 6).padStart(2, "0") + ":00"); // 06:00–23:00

function parseStoreHours(text = "") {
    const init = Object.fromEntries(DAYS.map(d => [d, {open: "", close: "", closed: true}]));
    if (!text.trim()) return init;
    text.split(/\s*,\s*/).forEach(p => {
        const m = p.match(/^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\s*:\s*(.+)$/i);
        if (!m) return;
        const day = DAYS.find(d => d.toLowerCase() === m[1].toLowerCase());
        const val = m[2].trim();
        if (/^closed$/i.test(val)) {
            init[day] = {open: "", close: "", closed: true};
            return;
        }
        const [o, c] = val.split(/\s*[–-]\s*/);
        if (o && c) init[day] = {open: o, close: c, closed: false};
    });
    return init;
}

const IL_BBOX = {
    latMin: 29.30,
    latMax: 33.60,
    lonMin: 34.15,
    lonMax: 35.95,
};

function isInIsraelBBox(lat, lon) {
    return (
        Number.isFinite(lat) && Number.isFinite(lon) &&
        lat >= IL_BBOX.latMin && lat <= IL_BBOX.latMax &&
        lon >= IL_BBOX.lonMin && lon <= IL_BBOX.lonMax
    );
}

async function isInIsraelStrict(lat, lon) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
    const res = await fetch(url);
    if (!res.ok) return false;
    const data = await res.json();
    return (data?.address?.country_code || "").toLowerCase() === "il";
}


function formatStoreHours(obj) {
    return DAYS.map(d => {
        const {open, close, closed} = obj[d] || {};
        if (closed || !open || !close) return `${d}: Closed`;
        return `${d}: ${open}–${close}`;
    }).join(", ");
}

function parseLocation3(s = "") {
    const parts = s.split(",").map(p => p.trim()).filter(Boolean);
    return {
        city: parts[0] || "",
        street: parts[1] || "",
        apt: parts[2] || "",
    };
}

function formatLocationToString({city, street, apt}) {
    return [city?.trim(), street?.trim(), apt?.trim()].filter(Boolean).join(", ");
}


async function getCoordinates(address) {

    let cleaned = address.replace(/,?\s*0\s*,?\s*0\s*/g, "").trim();
    if (!cleaned) throw new Error("Address is empty");

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleaned)}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Geocode failed: ${res.status}`);
    const data = await res.json();

    if (!data.length) {
        const cityOnly = address.split(",")[0].trim();
        if (cityOnly) {
            const cityUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityOnly)}`;
            const cityRes = await fetch(cityUrl);
            const cityData = await cityRes.json();
            if (cityData.length) {
                return {
                    lat: parseFloat(cityData[0].lat),
                    lng: parseFloat(cityData[0].lon)
                };
            }
        }
        throw new Error("No results found");
    }

    return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
    };
}


export default function HomePage() {
    const [store, setStore] = useState(null);
    const [edit, setEdit] = useState(false);

    // 🔹 שלושה סטייטים נפרדים לכתובת
    const [city, setCity] = useState("");
    const [street, setStreet] = useState("");
    const [apt, setApt] = useState("");

    const [hoursObj, setHoursObj] = useState(() => parseStoreHours(""));

    const session = requireStoreSessionOrRedirect();
    const storeId = session?.storeId;

    // מחזיר את שדות הטופס לערכים שמגיעים מה-DB ב-`store`
    const resetFormFromStore = (src = store) => {
        if (!src) return;
        const loc = parseLocation3(src?.location || "");
        setCity(loc.city || "");
        setStreet(loc.street || "");
        setApt(loc.apt || "");
        setHoursObj(parseStoreHours(src?.store_hours || ""));
    };

    useEffect(() => {
        if (store && !edit) resetFormFromStore(store);
    }, [store, edit]);

    const startEdit = () => {
        resetFormFromStore();
        setEdit(true);
    };

    const handleCancel = () => {
        resetFormFromStore();
        setEdit(false);
    };


    useEffect(() => {
        if (!storeId) return;
        (async () => {
            try {
                // שליפת פרטי חנות
                const res = await fetch(
                    `https://5uos9aldec.execute-api.us-east-1.amazonaws.com/dev/getInfoFromStore/${encodeURIComponent(storeId)}`
                );
                if (!res.ok) {
                    console.error("❌ Fetch failed:", res.status, await res.text());
                    return;
                }
                const data = await res.json();
                const row = Array.isArray(data) ? data[0] : data;

                setStore(row || {});
                // פירוק location ל־3 חלקים
                const loc = parseLocation3(row?.location || "");
                setCity(loc.city);
                setStreet(loc.street);
                setApt(loc.apt);

                setHoursObj(parseStoreHours(row?.store_hours || ""));
            } catch (e) {
                console.error("Fetch store error:", e);
            }
        })();
    }, [storeId]);

    const setDay = (day, patch) => {
        setHoursObj(prev => {
            const next = {...prev, [day]: {...(prev[day] || {open: "", close: "", closed: true}), ...patch}};
            if (patch.closed) next[day] = {open: "", close: "", closed: true};
            return next;
        });
    };

    const handleSave = async () => {
        if (!store && !storeId) return;

        const locationStr   = formatLocationToString({ city, street, apt });
        const storeHoursStr = formatStoreHours(hoursObj);

        // Geocode
        const coords = await getCoordinates(locationStr); // {lat, lng}
        if (!isInIsraelBBox(coords.lat, coords.lng)) {
            alert("out of israel");
            return;
        }
        const reallyInIL = await isInIsraelStrict(coords.lat, coords.lng);
        if (!reallyInIL) {
            alert("address is outside from israel");
            return;
        }
        const coordsStr = `${coords.lat},${coords.lng}`; // ← מחרוזת אחת "lat,lon"

        try {
            const res = await fetch(
                "https://oa608utwwh.execute-api.us-east-1.amazonaws.com/dev/updateStoreLocationAndStoreHours",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        store_id:   storeId,
                        location:   locationStr,
                        storeHours: storeHoursStr,
                        coordinates: coordsStr,
                    }),
                }
            );

            if (!res.ok) {
                const err = await res.text();
                throw new Error(err || "Failed to update store info");
            }

            setStore(prev => ({
                ...(prev || {}),
                location:          locationStr,
                store_hours:       storeHoursStr,
                store_coordinates: coordsStr,
            }));
            setEdit(false);
        } catch (err) {
            console.error("Error updating store info:", err);
            alert("Failed to update store info. Please try again.");
        }
    };

    if (!storeId || !store) return <div className="loading">Loading…</div>;

    return (
        <>
        <TopBar  />
        <div className="homepage">
            <h2 className="title">Store Info</h2>

            <div className="field"><label>ID</label><span>{store.store_id || storeId}</span></div>
            <div className="field"><label>Email</label><span>{store.email || "-"}</span></div>
            <div className="field"><label>Name</label><span>{store.name || "-"}</span></div>

            {/* Location (3 inputs when editing) */}
            <div className="field">
                <label>Location</label>
                {edit ? (
                    <div className="location-grid">
                        <input
                            type="text"
                            placeholder="City"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Street and number (e.g., Aza 25)"
                            value={street}
                            onChange={(e) => setStreet(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Apt"
                            value={apt}
                            onChange={(e) => setApt(e.target.value)}
                        />
                    </div>
                ) : (
                    <span>{store.location || "-"}</span>
                )}
            </div>

            {/* Opening Hours */}
            <div className="hours-card">
                <div className="hours-title">Opening Hours</div>

                <div className="hours-grid hours-head">
                    <div>Day</div>
                    <div>Open</div>
                    <div>To</div>
                    <div>Closed</div>
                </div>

                {DAYS.map(d => {
                    const row = hoursObj[d] || {open: "", close: "", closed: true};
                    return (
                        <div className="hours-grid" key={d}>
                            <div className="hours-day">{d}:</div>

                            <div>
                                {edit ? (
                                    <select
                                        className="time-select"
                                        value={row.open || ""}
                                        disabled={row.closed}
                                        onChange={(e) => setDay(d, {open: e.target.value, closed: false})}
                                    >
                                        <option value="">--</option>
                                        {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                ) : (
                                    <span className="readonly">{row.closed ? "Closed" : (row.open || "—")}</span>
                                )}
                            </div>

                            <div>
                                {edit ? (
                                    <select
                                        className="time-select"
                                        value={row.close || ""}
                                        disabled={row.closed}
                                        onChange={(e) => setDay(d, {close: e.target.value, closed: false})}
                                    >
                                        <option value="">--</option>
                                        {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                ) : (
                                    <span className="readonly">{row.closed ? "" : (row.close || "—")}</span>
                                )}
                            </div>

                            <div className="closed-cell">
                                {edit ? (
                                    <label className="closed-toggle">
                                        <input
                                            type="checkbox"
                                            checked={!!row.closed}
                                            onChange={(e) => setDay(d, {closed: e.target.checked})}
                                        />
                                        <span>Closed</span>
                                    </label>
                                ) : (
                                    <span className={"readonly " + (row.closed ? "closed" : "")}>
                    {row.closed ? "Closed" : ""}
                  </span>
                                )}
                            </div>
                        </div>
                    );
                })}

                {!edit && (
                    <div className="hours-note">
                        To edit, click “Edit” below. Changes will be saved in your store profile.
                    </div>
                )}
            </div>

            <div className="actions">
                {edit ? (
                    <>
                        <button className="btn cancel" onClick={() => setEdit(false)}>Cancel</button>
                        <button className="btn save" onClick={handleSave}>Save</button>
                    </>
                ) : (
                    <button className="btn edit" onClick={() => setEdit(true)}>Edit</button>
                )}
            </div>
        </div>
        </>
    );
}
