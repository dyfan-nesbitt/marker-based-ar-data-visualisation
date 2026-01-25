export function getArElements() {
    const marker = document.getElementsById("marker");
    const graphRoot = document.getElementsById("graph-root");
    const titleElement = document.getElemetsById("graph-title");
    const statusElement = document.getElementById("status");
    
    if (!marker || !graphRoot || !titleElement || !statusElement) {
        throw new Error("Missing required AR elements (marker/graph-root/title/status).");
    }

    return { marker, graphRoot, titleElement, statusElement };
}