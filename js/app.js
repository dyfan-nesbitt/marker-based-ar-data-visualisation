console.log("AR app loaded");

// -- Global variables --
// data being visualised.
let currentData = null;
// controlled by slider.
let exaggeration = 1;

document.addEventListener("DOMContentLoaded", () => {
    // Get elements from DOM.
    const statusElement = document.getElementById("status");
    const marker = document.getElementById("marker");
    const graphRoot = document.getElementById("graph-root");
    const titleElement = document.getElementById("graph-title");

    const exaggerationInput = document.getElementById("exaggeration");
    const exaggerationValue = document.getElementById("exaggerationValue");

    // Checks
    if (!marker || !graphRoot || !titleElement) {
        console.warn("Required elements missing");
        return;
    }

    // Demo data (to be replaced with fetched JSON later)
    currentData = {
        title: "Demo dataset",
        type: "bar",
        labels: ["Q1", "Q2", "Q3", "Q4"],
        series: [{ name: "A", values: [3, 5, 2, 6] }]
    };

    // Set title
    titleElement.setAttribute("value", currentData.title);

    // Only build graph once marker is found, not every frame.
    let renderedOnce = false;

    marker.addEventListener("markerFound", () => {
        statusElement.textContent = "Status: marker found.";

        //  Render first time marker is found.
        if (!renderedOnce) {
            renderGraph(graphRoot, titleElement, currentData);
            renderedOnce = true;
        }
    });

    marker.addEventListener("markerLost", () => {
        statusElement.textContent = "Status: marker lost."
    });
    
    // Slider behaviour
    exaggerationInput.addEventListener("input", () => {
        exaggeration = Number(exaggerationInput.value);
        exaggerationValue.textContent = `${exaggeration.toFixed(1)}x`;

        if (renderedOnce && currentData) {
            renderGraph(graphRoot, titleElement, currentData);
        }
    });
})

// Render the graph
function renderGraph(graphRoot, titleElement, data) {
    // Clear previous bars / labels.
    while(graphRoot.firstChild) graphRoot.removeChild(graphRoot.firstChild);

    // Update title
    titleElement.setAttribute("value", data.title ?? "Unititled");

    // Validation
    if (!data?.series?.[0]?.values?.length || !data?.labels?.length) {
        addFloatingText(graphRoot, "Invalid data", { x:0, y:1, z:0 });
        return;
    }

    const values = data.series[0].values;
    const labels = data.labels;

    // Graph layout settings
    const barWidth = 0.18; // width of bars
    const barGap = 0.06; // spacing between bars
    const baseY = 0.02; // lift off marker 
    const chartHeight = 1.0; // max bar height before exaggeration

    // Center all bars
    const totalWidth = values.length * barWidth + (values.length - 1) * barGap;
    const startX = -totalWidth / 2 + barWidth / 2;

    // Base plate, makes chart easier to read
    const base = document.createElement("a-box");
    base.setAttribute("width", totalWidth + 0.2);
    base.setAttribute("height", 0.02);
    base.setAttribute("depth", 0.6);
    base.setAttribute("position", `0 ${baseY} 0`);
    base.setAttribute("color", "#222");
    graphRoot.appendChild(base);

    // Create each bar + labels
    values.forEach((v, i) => {
        const norm = v / maxVal;

        // Bar height
        const h = Math.max(0.03, norm * chartHeight * exaggeration);

        // Pos each bar in X
        const x = startX + i * (barWidth + barGap);
        const z = 0;

        // A-Frame boxes
        const bar = document.createElement("a-box");
        bar.setAttribute("width", barWidth);
        bar.setAttribute("depth", 0.18);
        bar.setAttribute("height", h);
        bar.setAttribute("position", `${x} ${baseY + h / 2 + 0.01} ${z}`);
        bar.setAttribute("color", "#4CC3D9");
        graphRoot.appendChild(bar);

        // Value label above bar
        const valText = document.createElement("a-text");
        valText.setAttribute("value", String(v));
        valText.setAttribute("align", "center");
        valText.setAttribute("width", "2");
        valText.setAttribute("color", "#fff");

        // Rotate so faces camera
        valText.setAttribute("rotation", "-90 0 0");
        valText.setAttribute("position", `${x} ${baseY + h + 0.12} ${z}`);
        graphRoot.appendChild(valText);

        // Catergory label 
        const lab = document.createElement("a-text");
        lab.setAttribute("value", labels[i] ?? "");
        lab.setAttribute("align", "center");
        lab.setAttribute("width", "2");
        lab.setAttribute("color", "#ddd");
        lab.setAttribute("rotation", "-90 0 0");
        lab.setAttribute("position", `${x} ${baseY + 0.03} ${z + 0.22}`);
        graphRoot.appendChild(lab);
    });
}

function addFloatingText(root, text, pos) {
    const t = document.createElement("a-text");
    t.setAttribute("value", text);
    t.setAttribute("align", "center");
    t.setAttribute("color", "#fff");
    t.setAttribute("width", "4");
    t.setAttribute("rotation", "-90 0 0");
    t.setAttribute("position", `${pos.x} ${pos.y} ${pos.z}`);
    root.appendChild(t);
}