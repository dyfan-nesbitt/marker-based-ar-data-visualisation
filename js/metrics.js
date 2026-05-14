import { renderBarGraph }  from "./vis-bar.js";
import { renderLineGraph } from "./vis-line.js";
 
// ─── On-screen log panel ─────────────────────────────────────────────────────
 
let _panelBody = null;
 
function initPanel() {
    if (_panelBody) return;
    _panelBody = document.getElementById("metrics-panel-body");
}
 
function uiLog(text) {
    initPanel();
    console.log("[METRICS]", text);
    if (!_panelBody) return;
    const line = document.createElement("div");
    line.textContent = text;
    _panelBody.appendChild(line);
    _panelBody.scrollTop = _panelBody.scrollHeight;
}
 
function uiSep() {
    initPanel();
    if (!_panelBody) return;
    const line = document.createElement("div");
    line.textContent = "─────────────────────────";
    line.style.color = "#444";
    _panelBody.appendChild(line);
    _panelBody.scrollTop = _panelBody.scrollHeight;
}
 
function uiHeader(text) {
    uiSep();
    initPanel();
    if (!_panelBody) return;
    const line = document.createElement("div");
    line.textContent = text;
    line.style.color = "#4CC3D9";
    line.style.fontWeight = "bold";
    _panelBody.appendChild(line);
    _panelBody.scrollTop = _panelBody.scrollHeight;
}
 
function uiRow(key, value) {
    uiLog(`  ${key}: ${value}`);
}
 
// ─── Shared data store ───────────────────────────────────────────────────────
 
export const store = {
    renderBar:  [],
    renderLine: [],
    fetch:      [],
    fps:        [],
    markerMs:   null,
};
 
// ─── Helpers ─────────────────────────────────────────────────────────────────
 
function mean(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}
 
function sd(arr) {
    const m = mean(arr);
    return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
}
 
function makeData(type, n) {
    return {
        title:      `Benchmark (${n} points)`,
        type,
        colour:     "#4CC3D9",
        xAxisLabel: "X",
        yAxisLabel: "Y",
        labels:  Array.from({ length: n }, (_, i) => `P${i + 1}`),
        series: [{ name: "A", values: Array.from({ length: n }, () =>
            +(Math.random() * 100).toFixed(1)) }],
    };
}
 
// ─── Render timing ───────────────────────────────────────────────────────────
 
function benchmarkRender(type, n, options = {}) {
    const scene    = document.querySelector("a-scene");
    const tmpRoot  = document.createElement("a-entity");
    const tmpTitle = document.createElement("a-text");
 
    tmpRoot.setAttribute("visible", "false");
    scene.appendChild(tmpRoot);
 
    const data = makeData(type, n);
 
    const t0 = performance.now();
    if (type === "line") {
        renderLineGraph(tmpRoot, tmpTitle, data, options);
    } else {
        renderBarGraph(tmpRoot, tmpTitle, data, options);
    }
    const ms = performance.now() - t0;
 
    while (tmpRoot.firstChild) tmpRoot.removeChild(tmpRoot.firstChild);
    scene.removeChild(tmpRoot);
 
    return ms;
}
 
// ─── FPS monitor ─────────────────────────────────────────────────────────────
 
let _fpsRunning = false;
let _fpsCount   = 0;
let _fpsLast    = 0;
 
function _fpsTick(ts) {
    _fpsCount++;
    if (ts - _fpsLast >= 1000) {
        store.fps.push(_fpsCount);
        _fpsCount = 0;
        _fpsLast  = ts;
    }
    if (_fpsRunning) requestAnimationFrame(_fpsTick);
}
 
export function startFpsMonitor() {
    if (_fpsRunning) return;
    _fpsRunning = true;
    _fpsLast    = performance.now();
    requestAnimationFrame(_fpsTick);
    uiLog("FPS monitor started.");
}
 
export function stopFpsMonitor() {
    _fpsRunning = false;
}
 
// ─── Marker detection timing ──────────────────────────────────────────────────
 
export function trackMarkerDetection(marker) {
    const appStart = performance.now();
    let recorded   = false;
 
    marker.addEventListener("markerFound", () => {
        if (!recorded) {
            recorded       = true;
            store.markerMs = +(performance.now() - appStart).toFixed(0);
            uiLog(`Marker detected: ${store.markerMs} ms from page load`);
        }
    });
}
 
// ─── Fetch timing ─────────────────────────────────────────────────────────────
 
export async function timedFetch(url, label = "fetch") {
    const resolved = new URL(url, window.location.href).toString();
    const t0       = performance.now();
 
    const res = await fetch(resolved, { cache: "no-store" });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
 
    const data = await res.json();
    const ms   = +(performance.now() - t0).toFixed(1);
 
    store.fetch.push({ label, ms });
    uiLog(`Fetch "${label}": ${ms} ms`);
 
    return data;
}
 
// ─── Full render benchmark suite ─────────────────────────────────────────────
 
const SIZES   = [4, 8, 12, 16];
const REPEATS = 5;
 
export function runBenchmark() {
    uiLog("Running benchmark…");
 
    store.renderBar  = [];
    store.renderLine = [];
 
    const opts = { exaggeration: 1, chartSize: 2, graphColour: "#4CC3D9" };
 
    for (const n of SIZES) {
        const barTimes  = [];
        const lineTimes = [];
 
        for (let r = 0; r < REPEATS; r++) {
            barTimes.push( benchmarkRender("bar",  n, opts));
            lineTimes.push(benchmarkRender("line", n, opts));
        }
 
        store.renderBar.push({
            points:  n,
            mean_ms: +mean(barTimes).toFixed(2),
            sd_ms:   +sd(barTimes).toFixed(2),
            raw:     barTimes.map(v => +v.toFixed(2)),
        });
 
        store.renderLine.push({
            points:  n,
            mean_ms: +mean(lineTimes).toFixed(2),
            sd_ms:   +sd(lineTimes).toFixed(2),
            raw:     lineTimes.map(v => +v.toFixed(2)),
        });
    }
 
    uiLog("Done.");
    logResults();
}
 
// ─── Display results in panel ─────────────────────────────────────────────────
 
export function logResults() {
    uiHeader("BAR CHART RENDER TIMES");
    uiLog("  Points  Mean(ms)  SD(ms)");
    for (const r of store.renderBar) {
        uiLog(`  ${String(r.points).padEnd(8)}${String(r.mean_ms).padEnd(10)}${r.sd_ms}`);
    }
 
    uiHeader("LINE GRAPH RENDER TIMES");
    uiLog("  Points  Mean(ms)  SD(ms)");
    for (const r of store.renderLine) {
        uiLog(`  ${String(r.points).padEnd(8)}${String(r.mean_ms).padEnd(10)}${r.sd_ms}`);
    }
 
    if (store.fetch.length) {
        uiHeader("FETCH TIMES");
        for (const f of store.fetch) {
            uiLog(`  ${f.label}: ${f.ms} ms`);
        }
    }
 
    if (store.fps.length) {
        const m   = +mean(store.fps).toFixed(1);
        const min = Math.min(...store.fps);
        const max = Math.max(...store.fps);
        uiHeader("FPS");
        uiLog(`  Samples: ${store.fps.join(", ")}`);
        uiLog(`  Mean: ${m}  Min: ${min}  Max: ${max}`);
    }
 
    if (store.markerMs !== null) {
        uiHeader("MARKER DETECTION");
        uiLog(`  Time from page load: ${store.markerMs} ms`);
    }
 
    uiSep();
    uiLog("Tap Copy Results to copy JSON.");
}
 
// ─── Copy raw JSON to clipboard ───────────────────────────────────────────────
 
export function copyResults() {
    const text = JSON.stringify(store, null, 2);
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text)
            .then(() => uiLog("Copied!"))
            .catch(() => uiLog("Copy failed — see raw JSON below:"), uiLog(text));
    } else {
        // Fallback for browsers without clipboard API
        uiHeader("RAW JSON — long-press to copy:");
        uiLog(text);
    }
}