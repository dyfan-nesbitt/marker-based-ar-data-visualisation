export function renderBarGraph(graphRoot, titleElement, data, options = {}) {
    const exaggeration = Number(options.exaggeration ?? 1);

    // Clear old graph
    while(graphRoot.firstChild) graphRoot.removeChild(graphRoot.firstChild);

    titleElement.setAttribute("value", data?.title ?? "Untitled");

    const values = data?.series?.[0].values;
    const labels = data?.labels;

    if (!Array.isArray(values) || !values.length || !Array.isArray(labels) || !labels.length) {
        addText(graphRoot, "Invalid data", { x:0, y:1, z:0 });
        return;
    }

    const maxVal = Math.max(...values, 1);
    const numBars = values.length;

    // DYNAMIC SIZING based on num of bars
    const targetChartWidth = 2.0;

    // Calculate bar width and gap
    const minBarWidth = 0.12;
    const maxBarWidth = 0.25;

    let barWidth = targetChartWidth / (numBars * 1.4);
    barWidth = Math.max(minBarWidth, Math.min(maxBarWidth, barWidth));

    // Gap scales with bar width
    const barGap = barWidth * 0.35;

    // Recalculate actual total width
    const totalWidth = numBars * barWidth + (numBars - 1) * barGap;
    const startX = -totalWidth / 2 + barWidth / 2;

    // Other
    const baseY = 0.10; // lift off marker 
    const chartHeight = 1.0; // max bar height before exaggeration

    // -- GRAPH ELEMENTS --

    // Base plate, makes chart easier to read
    const base = document.createElement("a-box");
    base.setAttribute("width", totalWidth + 0.2);
    base.setAttribute("height", 0.02);
    base.setAttribute("depth", 0.6);
    base.setAttribute("position", `0 ${baseY} 0`);
    base.setAttribute("color", "#222");
    base.setAttribute("material", "shader: flat; opacity: 0.6; transparent: true;");
    graphRoot.appendChild(base);

    values.forEach((v, i) => {
        const norm = v / maxVal;
        const h = Math.max(0.03, norm * chartHeight * exaggeration);
        const x = startX + i * (barWidth + barGap);
        const z = -0.12;

        // Bar
        const bar = document.createElement("a-box");
        bar.setAttribute("width", barWidth);
        bar.setAttribute("depth", 0.18);
        bar.setAttribute("height", h);
        bar.setAttribute("position", `${x} ${baseY + h / 2 + 0.01} ${z}`);
        bar.setAttribute("color", "#4CC3D9");
        bar.setAttribute("material", "shader: flat;");
        graphRoot.appendChild(bar);

        // Value label above bar
        const valText = document.createElement("a-text");
        valText.setAttribute("value", String(v));
        valText.setAttribute("align", "center");
        valText.setAttribute("width", "1.5");
        valText.setAttribute("color", "#fff");
        valText.setAttribute("rotation", "-90 0 0");
        valText.setAttribute("position", `${x} ${baseY + h + 0.12} ${z}`);
        graphRoot.appendChild(valText);

        // Category label - DYNAMIC
        const lab = document.createElement("a-text");
        lab.setAttribute("value", labels[i] ?? "");
        lab.setAttribute("align", "center");

        // Wrap text if too long
        const labelText = labels[i] ?? "";
        lab.setAttribute("value", labelText);

        lab.setAttribute("width", "1.8");
        lab.setAttribute("wrapCount", "12") // wrap after 12 char

        lab.setAttribute("color", "#ddd");
        lab.setAttribute("rotation", "-90 0 0");
        lab.setAttribute("position", `${x} ${baseY + 0.03} ${z + 0.22}`);
        graphRoot.appendChild(lab);
    });
}

function addText(root, text, pos) {
    const t = document.createElement("a-text");
    t.setAttribute("value", text);
    t.setAttribute("align", "center");
    t.setAttribute("color", "#fff");
    t.setAttribute("width", "4");
    t.setAttribute("rotation", "-90 0 0");
    t.setAttribute("position", `${pos.x} ${pos.y} ${pos.z}`);
    root.appendChild(t);
}