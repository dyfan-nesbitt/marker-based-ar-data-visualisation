export function startQrWatcher({ onStableChange, statusElement }) {
    if (typeof window.jsQR !== "function") {
        statusElement.textContent = "Status: jsQR not loaded";
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

    let scanInterval = null;
    let waitInterval = null;

    function findVideo() {
        return document.getElementById("arjs-video") || document.querySelector("video");
    }

    function startScanning(video) {
        statusElement.textContent = "Status: scanning QR for dataset.";

            function scanOnce() {
            if (stopped) return;

            const now = Date.now();
            if (now < cooldownUntil) return;

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
                candidateValue = null;
                candidateCount = 0;
                return;
            }

            if (value === candidateValue) candidateCount += 1;
            else {
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

        scanInterval = setInterval(scanOnce, Math.floor(1000 / scanFps));
    }

    
    // Wait unti ar.js makes the video element
    statusElement.textContent = "Status: waiting for camera";
    waitInterval = setInterval(() => {
        if (stopped) return;

        const video = findVideo();
        if (video) {
            clearInterval(waitInterval);
            waitInterval = null;
            startScanning(video);
        }
    }, 250);

    return () => {
        stopped = true;
        if (waitInterval) clearInterval(waitInterval);
        if (scanInterval) clearInterval(scanInterval);
    };
}