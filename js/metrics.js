import { renderBarGraph } from "./vis-bar.js";
import { renderLineGraph } from "./vis-line.js";

const _log = (...args) => 
    console.log("%c[METRICS]", "color:#4CC3D9;font-weight:bold;", ...args);

export const store = {
    renderBar:  [],   // [{points, mean_ms, sd_ms, raw:[]}]
    renderLine: [],   // [{points, mean_ms, sd_ms, raw:[]}]
    fetch:      [],   // [{label, ms}]
    fps:        [],   // [number] — one sample per second
    markerMs:   null, // ms from page-load to first markerFound
};

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

    // Clean up so we don't pollute the scene
    while (tmpRoot.firstChild) tmpRoot.removeChild(tmpRoot.firstChild);
    scene.removeChild(tmpRoot);

    return ms;
}

// FPS

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
    _log("FPS monitor started.");
}

export function stopFpsMonitor() {
    _fpsRunning = false;
}

// Marker detection timer

export function trackMarkerDetection(marker) {
    const appStart = performance.now();
    let recorded   = false;

    marker.addEventListener("markerFound", () => {
        if (!recorded) {
            recorded       = true;
            store.markerMs = +(performance.now() - appStart).toFixed(0);
            _log(`First marker detection: ${store.markerMs} ms after page load`);
        }
    });
}

// Fetch timer

export async function timedFetch(url, label = "fetch") {
    const resolved = new URL(url, window.location.href).toString();
    const t0       = performance.now();

    const res = await fetch(resolved, { cache: "no-store" });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);

    const data = await res.json();
    const ms   = +(performance.now() - t0).toFixed(1);

    store.fetch.push({ label, ms });
    _log(`Fetch "${label}": ${ms} ms`);

    return data;
}

// Full render benchmark suite

const SIZES   = [4, 8, 12, 16];   // dataset sizes to test
const REPEATS = 5;                  // repetitions per size (for mean & SD)

export function runBenchmark() {
    _log("Running render benchmark — please wait...");

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

    _log("Benchmark complete. Call window.metrics.logResults() to see tables.");
    logResults();
}

export function logResults() {
    console.group(
        "%c[METRICS] Full Results",
        "color:#4CC3D9;font-weight:bold;font-size:14px;"
    );

    // Render times
    if (store.renderBar.length) {
        console.log("📊 Bar Chart — Render Time vs. Dataset Size");
        console.table(store.renderBar.map(r => ({
            "Data Points": r.points,
            "Mean (ms)":   r.mean_ms,
            "SD (ms)":     r.sd_ms,
        })));
    }

    if (store.renderLine.length) {
        console.log("📈 Line Graph — Render Time vs. Dataset Size");
        console.table(store.renderLine.map(r => ({
            "Data Points": r.points,
            "Mean (ms)":   r.mean_ms,
            "SD (ms)":     r.sd_ms,
        })));
    }

    // Fetch times
    if (store.fetch.length) {
        console.log("🌐 Dataset Fetch Times");
        console.table(store.fetch.map(f => ({
            "Dataset":  f.label,
            "Time (ms)": f.ms,
        })));
    }

    // FPS
    if (store.fps.length) {
        const m   = +mean(store.fps).toFixed(1);
        const min = Math.min(...store.fps);
        const max = Math.max(...store.fps);
        console.log("🎮 FPS Samples (one per second):", store.fps.join(", "));
        console.log(`    Mean: ${m} fps  |  Min: ${min}  |  Max: ${max}`);
    }

    // Marker
    if (store.markerMs !== null) {
        console.log(`🎯 Time to first marker detection: ${store.markerMs} ms from page load`);
    }

    // Copy-paste block
    console.log("\n📋 Raw store (copy this):");
    console.log(JSON.stringify(store, null, 2));

    console.groupEnd();
    return store;
}