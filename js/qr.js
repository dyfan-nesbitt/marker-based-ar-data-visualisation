export function startQrWatcher({ onStableChange, statusElement }) {
    if (typeof window.jsQR !== "function") {
        statusElement.textContent = "Status: jsQR not loaded";
        return () => {};
    }

    const video = document.getElementById("arjs-video") || document.querySelector("video");
    if (!video) {
        statusElement.textContent = "Status: no camera video found";
        return () => {};
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    // Tuning 
    const scanFps = 8;
    const downscale = 0.5;
    const stableFramesRequired = 4;
    const cooldownMs = 1200;

    let stopped = false;
    let activeValue = null;
    let candidateValue = null;
    let candidateCount = 0;
    let cooldownUntil = 0;

    function scanOnce() {
        if (stopped) return;

        const now = Date.now();
        if (now < cooldownUnitl) return;

        const w = video.videoWidth;
        const h = video.videoHeight;
        if (!w || !h) return;

        canvas.width = Math.floor(w * downscale);
        canvas.height = Math.floor(h * downscale);

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const code = window.jsQR(imageData.data, imageData.width, imageData.height);
        const value = code?.data?.trim() || null;

        if (!value) {
            candidateCount += 1;
        } else {
            candidateValue = value;
            candidateCount = 1;
        }

        statusElement.textContent = `Status: QR seen (${candidateCount}/${stableFramesRequired})`;

        if (candidateCount >= stableFramesRequired) {
            activeValue = candidateValue;
            candidateValue = null;
            candidateCount = 0;

            cooldownUntil = Date.now() + cooldownMs;
            onStableChange(activeValue);
        }
    }

    const interval = setInterval(scanOnce, Math.floor(1000 / scanFps));

    return () => {
        stopped = true;
        clearInterval(interval);
    };
}