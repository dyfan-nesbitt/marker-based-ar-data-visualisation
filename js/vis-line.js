export function renderLineGraph(graphRoot, titleElement, data, options = {}) {
    const exaggeration = Number(options.exaggeration ?? 1);
    const chartSize = Number(options.chartSize ?? 2);
    const scale = chartSize / 2;

    // Clear old graph
    while(graphRoot.firstChild) graphRoot.removeChild(graphRoot.firstChild);
    titleElement.setAttribute("value", data?.title ?? "Untitled");

    const values = data?.series?.[0].values;
    const labels = data?.labels;

    if (!Array.isArray(values) || !values.length) return;

    const maxVal = Math.max(...values, 1);
    const numPoints = values.length;

    const targetChartWidth = chartSize;
    const spacing = targetChartWidth / (numPoints - 1 || 1);
    const startX = -targetChartWidth / 2;

    const baseY = 0.05 * scale;
    const chartHeight = 1.0 * scale;

    // Base plate, makes chart easier to read
    const base = document.createElement("a-box");
    base.setAttribute("width", targetChartWidth + 0.2 * scale);
    base.setAttribute("height", 0.02 * scale);
    base.setAttribute("depth", 0.6 * scale);
    base.setAttribute("position", `0 ${baseY} 0`);
    base.setAttribute("color", "#222");
    base.setAttribute("material", "shader: flat; opacity: 0.6; transparent: true;");
    graphRoot.appendChild(base);

    const points = [];

    values.forEach((v, i) => {
        const norm = v / maxVal;
        const h = norm * chartHeight * exaggeration;
        const x = startX + i * spacing;
        const y = baseY + h;
        const z = -0.12 * scale;

        points.push({ x, y, z});

        // Point sphere
        const sphere = document.createElement("a-sphere");
        sphere.setAttribute("radius", 0.04 * scale);
        sphere.setAttribute("position", `${x} ${y} ${z}`);
        sphere.setAttribute("color", "#FF6B6B");
        sphere.setAttribute("material", "shader: flat;");
        graphRoot.appendChild(sphere);

        // Value label above bar
        const valText = document.createElement("a-text");
        valText.setAttribute("value", String(v));
        valText.setAttribute("align", "center");
        valText.setAttribute("width", (2.5 * scale).toFixed(2));
        valText.setAttribute("color", "#fff");
        valText.setAttribute("rotation", "0 0 0"); 
        valText.setAttribute("position", `${x} ${y + 0.12 * scale} ${z}`);
        graphRoot.appendChild(valText);

        // Label
        if (labels[i]) {
            const lab = document.createElement("a-text");
            lab.setAttribute("value", labels[i]);
            lab.setAttribute("align", "center");
            lab.setAttribute("width", (1.8 * scale).toFixed(2));
            lab.setAttribute("wrapCount", "12");
            lab.setAttribute("color", "#ddd");
            lab.setAttribute("rotation", "-90 0 0");
            lab.setAttribute("position", `${x} ${baseY + 0.03 * scale} ${z + 0.22 * scale}`);
            graphRoot.appendChild(lab);
        }
    });

    // Connect points with lines
    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const distance = Math.sqrt(dx*dx + dy*dy);

        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const midZ = p1.z;

        const line = document.createElement("a-box");
        line.setAttribute("width", 0.02 * scale);
        line.setAttribute("height", distance);
        line.setAttribute("depth", 0.02 * scale);
        line.setAttribute("position", `${midX} ${midY} ${midZ}`);
        line.setAttribute("color", "#FF6B6B");
        line.setAttribute("material", "shader: flat;");

        // Rotation
        const angle = -Math.atan2(dx, dy) * (180 / Math.PI);
        line.setAttribute("rotation", `0 0 ${angle}`);

        graphRoot.appendChild(line);
    }

    const maxBarHeight = Math.max(...values.map((v) => {
        const norm = v / maxVal;
        return norm * chartHeight * exaggeration;
    }));
    const titleY = baseY + maxBarHeight + 0.4 * scale;
    titleElement.setAttribute("position", `0 ${titleY} 0`);
    titleElement.setAttribute("width", (4 * scale).toFixed(2));
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