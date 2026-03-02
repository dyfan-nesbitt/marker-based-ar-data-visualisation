import { getQueryParam, loadDataFromUrl } from "./data.js";
import { renderBarGraph } from "./vis-bar.js";
import {renderLineGraph} from "./vis-line.js";
import { startQrWatcher } from "./qr.js";
import { getArElements } from "./ar.js";

function renderGraph(graphRoot, titleElement, data, options) {
    if (data.type === "line") {
        renderLineGraph(graphRoot, titleElement, data, options);
    } else {
        renderBarGraph(graphRoot, titleElement, data, options);
    }
}

const DEFAULT_DATA_URL = "data/demo.json";

let currentData = null;
let exaggeration = 1;
let markerVisible = false;
let chartSize = 2;

function setStatus(statusElement, msg) {
    statusElement.textContent = `Status: ${msg}`;
}

document.addEventListener("DOMContentLoaded", async () => {
    const { marker, graphRoot, titleElement, statusElement } = getArElements();

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
    const graphColourInput = document.getElementById("graphColour");

    let graphColour = "#FFFFFF";

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
            currentData = await loadDataFromUrl(paramUrl);
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
                currentData = await loadDataFromUrl(qrText);
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
        currentData = await loadDataFromUrl(DEFAULT_DATA_URL);
        titleElement.setAttribute("value", currentData.title ?? "Default dataset");
        if (currentData.colour) {
            graphColour = currentData.colour;
            graphColourInput.value = currentData.colour;
        }
        setStatus(statusElement, "default data loaded");

        if (markerVisible) {
            renderGraph(graphRoot, titleElement, currentData, { exaggeration, chartSize });
        }
    } catch (e) {
        console.error(e);
        setStatus(statusElement, "default load failed");
    }
}