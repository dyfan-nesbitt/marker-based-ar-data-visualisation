import { getQueryParam, loadDataFromUrl } from "./data.js";
import { renderBarGraph } from "./vis-bar.js";
import { startQrWatcher } from "./qr.js";
import { getArElements } from "./ar.js";

const DEFAULT_DATA_URL = "data/demo.json";

let currentData = null;
let exaggeration = 1;
let markerVisible = false;

function setStatus(statusElement, msg) {
    statusElement.textContent = `Status: ${msg}`;
}

document.addEventListener("DOMContentLoaded", async () => {
    const { marker, graphRoot, titleElement, statusElement } = getArElements();

    // Slider
    const exaggerationInput = document.getElementById("exaggeration");
    const exaggerationValue = document.getElementById("exaggerationValue");

    exaggerationInput.addEventListener("input", () => {
        exaggeration = Number(exaggerationInput.value);
        exaggerationValue.textContent = `${exaggeration.toFixed(1)}x`;

        if (markerVisible && currentData) {
            renderBarGraph(graphRoot, titleElement, currentData, { exaggeration });
        }
    });

    // Marker
    marker.addEventListener("markerFound", () => {
        markerVisible = true;
        setStatus(statusElement, "marker found.");

        if (currentData) {
            renderBarGraph(graphRoot, titleElement, currentData, { exaggeration });
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
            setStatus(statusElement, "data laoded");
            if (markerVisible) renderBarGraph(graphRoot, titleElement, currentData, { exaggeration });
        } catch (e) {
            console.error(e);
            setStatus(statusElement, "URL load failed");
            await loadDefault(statusElement, titleElement, graphRoot);
        }
        return;
    }

    // Try QR live 
    setStatus(statusElement, "scanning QR for dataset.");

    const stopQr = startQrWatcher({
        statusElement,
        onStableChange: async (qrText) => {
            try {
                setStatus(statusElement, "QR stable");
                currentData = await loadDataFromUrl(qrText);
                titleElement.setAttribute("value", currentData.title ?? "Loaded via QR");
                setStatus(statusElement, "dataset loaded");
                if (markerVisible) renderBarGraph(graphRoot, titleElement, currentData, { exaggeration });
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
            await loadDefault(statusElement, titleElement, graphRoot);
        }
    }, 5000);

    marker.addEventListener("markerFound", () => stopQr());
});

async function loadDefault(statusElement, titleElement, graphRoot) {
    try {
        currentData = await loadDataFromUrl(DEFAULT_DATA_URL);
        titleElement.setAttribute("value", currentData.title?? "Default dataset");
        setStatus(statusElement, "default data loaded");
    } catch (e) {
        console.error(e);
        setStatus(statusElement, "default load failed");
    }
}