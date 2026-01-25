console.log("AR app loaded");

document.addEventListener("DOMContentLoaded", () => {
  const statusEl = document.getElementById("status");
  const marker = document.getElementById("marker");

  if (!marker) {
    console.warn("Marker not found in DOM");
    return;
  }

  marker.addEventListener("markerFound", () => {
    statusEl.textContent = "Status: marker FOUND ✅";
    console.log("Marker found");
  });

  marker.addEventListener("markerLost", () => {
    statusEl.textContent = "Status: marker lost…";
    console.log("Marker lost");
  });
});
