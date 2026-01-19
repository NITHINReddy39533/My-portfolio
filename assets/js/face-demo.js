const video = document.getElementById('video');
const canvas = document.getElementById('overlay');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusText = document.getElementById('status-text');

let stream = null;
let isDetecting = false;

// Load models from a public CDN that hosts face-api.js models
const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

async function loadModels() {
    statusText.innerText = "Loading models... (This may take a moment)";
    try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        // await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        statusText.innerText = "Models loaded! Ready to start.";
        startBtn.disabled = false;
    } catch (err) {
        console.error("Error loading models:", err);
        statusText.innerText = "Error loading models. Please check console.";
    }
}

async function startVideo() {
    statusText.innerText = "Accessing webcam...";
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        video.srcObject = stream;
        startBtn.disabled = true;
        stopBtn.disabled = false;
        statusText.innerText = "Detecting faces...";
        isDetecting = true;
    } catch (err) {
        console.error("Error accessing webcam:", err);
        statusText.innerText = "Error accessing webcam. Please allow permissions.";
    }
}

function stopVideo() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        stream = null;
    }
    startBtn.disabled = false;
    stopBtn.disabled = true;
    isDetecting = false;
    statusText.innerText = "Camera stopped.";

    // Clear canvas
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
}

video.addEventListener('play', () => {
    // Determine the canvas display size based on the video
    // We match the canvas size to the video size
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
        if (!isDetecting || video.paused || video.ended) return;

        // Detect faces
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks();
        // .withFaceExpressions();

        // Resize detections to match display size
        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        // Draw on canvas
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);

        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

    }, 100);
});

startBtn.addEventListener('click', startVideo);
stopBtn.addEventListener('click', stopVideo);

// Initialize
loadModels();
