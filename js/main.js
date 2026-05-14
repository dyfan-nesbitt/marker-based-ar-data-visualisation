import { getQueryParam, loadDataFromUrl } from "./data.js";
import { renderBarGraph } from "./vis-bar.js";
import {renderLineGraph} from "./vis-line.js";
import { startQrWatcher } from "./qr.js";
import { getArElements } from "./ar.js";

import {
    startFpsMonitor,
    trackMarkerDetection,
    timedFetch,
    runBenchmark,
    logResults,
    copyResults,
    store,
} from "./metrics.js";

function renderGraph(graphRoot, titleElement, data, options) {
    if (data.type === "line") {
        renderLineGraph(graphRoot, titleElement, data, options);
    } else {
        renderBarGraph(graphRoot, titleElement, data, options);
    }
}

const DEFAULT_DATA_URL = "data/demo-bar.json";

let currentData = null;
let exaggeration = 1;
let markerVisible = false;
let chartSize = 2;
let graphColour = "#FFFFFF";
let graphColourInput = null;  // assign in DOMContentLoaded

function setStatus(statusElement, msg) {
    statusElement.textContent = `Status: ${msg}`;
}

document.addEventListener("DOMContentLoaded", async () => {
    const { marker, graphRoot, titleElement, statusElement } = getArElements();

    startFpsMonitor();
    trackMarkerDetection(marker);

    window.metrics = { runBenchmark, logResults, copyResults, store };
 
    const copyBtn = document.getElementById("copyResults");
    if (copyBtn) {
        copyBtn.addEventListener("click", copyResults);
    }

    const hud = document.getElementById("hud");
    const toggleButton = document.getElementById("hudToggle");

    if (hud && toggleButton) {
        toggleButton.addEventListener("click", () => {
            const isClosed = hud.classList.contains("hud-closed");
            
            hud.classList.toggle("hud-closed", !isClosed);
            hud.classList.toggle("hud-open", isClosed);

            toggleButton.setAttribute("aria-expanded", String(!isClosed));
            toggleButton.setAttribute("aria-label", isClosed ? "Show options" : "Hide options");
        });
    }

    const benchBtn = document.getElementById("runBenchmark");
    if (benchBtn) {
        benchBtn.addEventListener("click", () => {
            benchBtn.disabled = true;
            benchBtn.textContent = "Running…";
            setTimeout(() => {
                runBenchmark();
                benchBtn.textContent = "Done — check console";
            }, 50); // small delay so button repaints before blocking
        });
    }

    // -- SLIDERS --

    // Exaggeration
    const exaggerationInput = document.getElementById("exaggeration");
    const exaggerationValue = document.getElementById("exaggerationValue");

    exaggerationInput.addEventListener("input", () => {
        exaggeration = Number(exaggerationInput.value);
        exaggerationValue.textContent = `${exaggeration.toFixed(1)}x`;

        if (markerVisible && currentData) {
            renderGraph(graphRoot, titleElement, currentData, { exaggeration, chartSize, graphColour});
        }
    });

    // Chart Size
    const chartSizeInput = document.getElementById("chartSize");
    const chartSizeValue = document.getElementById("chartSizeValue");

    chartSizeInput.addEventListener("input", () => {
        chartSize = Number(chartSizeInput.value);
        chartSizeValue.textContent = `${chartSize.toFixed(1)}x`;

        if (markerVisible && currentData) {
            renderGraph(graphRoot, titleElement, currentData, { exaggeration, chartSize, graphColour});
        }
    });

    // Chart Colour
    graphColourInput = document.getElementById("graphColour");

    graphColourInput.addEventListener("input", () => {
        graphColour = graphColourInput.value;

        if (markerVisible && currentData) {
            renderGraph(graphRoot, titleElement, currentData, { exaggeration, chartSize, graphColour});
        }
    });


    // Marker
    marker.addEventListener("markerFound", () => {
        markerVisible = true;
        setStatus(statusElement, "marker found.");

        if (currentData) {
            renderGraph(graphRoot, titleElement, currentData, { exaggeration, chartSize, graphColour});
        } else {
            setStatus(statusElement, "marker found, waiting for data...");
        }
    });

    marker.addEventListener("markerLost", () => {
        markerVisible = false;
        setStatus(statusElement, "marker lost.");
    });

    // Data loading
    const paramUrl = getQueryParam("data");

    if (paramUrl) {
        try {
            setStatus(statusElement, "loading data from URL");
            currentData = await timedFetch(paramUrl, "url-param");
            titleElement.setAttribute("value", currentData.title ?? "Loaded dataset");
            if (currentData.colour) {
                graphColour = currentData.colour;
                graphColourInput.value = currentData.colour;
            }
            setStatus(statusElement, "data loaded");
            if (markerVisible) renderGraph(graphRoot, titleElement, currentData, { exaggeration, chartSize, graphColour});
        } catch (e) {
            console.error(e);
            setStatus(statusElement, "URL load failed");
            await loadDefault({ statusElement, titleElement, graphRoot });
        }
        return;
    }

    // Try QR live 
    setStatus(statusElement, "scanning QR for dataset.");

    startQrWatcher({
        statusElement,
        onStableChange: async (qrText) => {
            try {
                setStatus(statusElement, "QR stable");
                currentData = await timedFetch(qrText, "qr-scan");
                titleElement.setAttribute("value", currentData.title ?? "Loaded via QR");
                if (currentData.colour) {
                    graphColour = currentData.colour;
                    graphColourInput.value = currentData.colour;
                }
                setStatus(statusElement, "dataset loaded");
                if (markerVisible) renderGraph(graphRoot, titleElement, currentData, { exaggeration, chartSize, graphColour});
            } catch (e) {
                console.error(e);
                setStatus(statusElement, "QR load failed");
            }
        }
    });

    // If no QR appears for 5s then load default
    setTimeout(async () => {
        if (!currentData) {
            setStatus(statusElement, "no QR yet, loading default dataset.");
            await loadDefault( {statusElement, titleElement, graphRoot });
        }
    }, 5000);
});

async function loadDefault({ statusElement, titleElement, graphRoot }) {
    try {
        currentData = await timedFetch(DEFAULT_DATA_URL, "default");
        titleElement.setAttribute("value", currentData.title ?? "Default dataset");
        if (currentData.colour) {
            graphColour = currentData.colour;
            graphColourInput.value = currentData.colour;
        }
        setStatus(statusElement, "default data loaded");

        if (markerVisible) {
            renderGraph(graphRoot, titleElement, currentData, { exaggeration, chartSize, graphColour});
        }
    } catch (e) {
        console.error(e);
        setStatus(statusElement, "default load failed");
    }
}