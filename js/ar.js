export function getArElements() {
    const marker = document.getElementById("marker");
    const graphRoot = document.getElementById("graph-root");
    const titleElement = document.getElemetById("graph-title");
    const statusElement = document.getElementById("status");
    
    if (!marker || !graphRoot || !titleElement || !statusElement) {
        throw new Error("Missing required AR elements (marker/graph-root/title/status).");
    }

    return { marker, graphRoot, titleElement, statusElement };
}