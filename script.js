// DOM Elements
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const workspace = document.getElementById('workspace');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const magnifier = document.getElementById('magnifier');
const magnifierCanvas = document.getElementById('magnifierCanvas');
const magnifierCtx = magnifierCanvas.getContext('2d');
const colorPreview = document.getElementById('colorPreview');
const colorCoords = document.getElementById('colorCoords');
const hexValue = document.getElementById('hexValue');
const rgbValue = document.getElementById('rgbValue');
const rgbaValue = document.getElementById('rgbaValue');
const hslValue = document.getElementById('hslValue');
const hslaValue = document.getElementById('hslaValue');
const newImageBtn = document.getElementById('newImageBtn');
const toast = document.getElementById('toast');

let currentImage = null;

// Upload Zone Click
uploadZone.addEventListener('click', () => {
    fileInput.click();
});

// File Input Change
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        loadImage(file);
    }
});

// Drag and Drop
uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
});

uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('drag-over');
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        loadImage(file);
    }
});

// Paste from Clipboard
document.addEventListener('paste', (e) => {
    const items = e.clipboardData.items;

    for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
            const file = items[i].getAsFile();
            loadImage(file);
            break;
        }
    }
});

// Load Image
function loadImage(file) {
    const reader = new FileReader();

    reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
            currentImage = img;
            displayImage(img);
            uploadZone.style.display = 'none';
            workspace.style.display = 'grid';
        };

        img.src = e.target.result;
    };

    reader.readAsDataURL(file);
}

// Display Image on Canvas
function displayImage(img) {
    const maxWidth = 800;
    const maxHeight = 600;

    let width = img.width;
    let height = img.height;

    // Scale down if needed
    if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
    }

    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(img, 0, 0, width, height);
}

// Get accurate canvas coordinates
function getCanvasCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Scale coordinates to actual canvas size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const canvasX = Math.floor(x * scaleX);
    const canvasY = Math.floor(y * scaleY);

    // Clamp to canvas bounds
    return {
        x: Math.max(0, Math.min(canvasX, canvas.width - 1)),
        y: Math.max(0, Math.min(canvasY, canvas.height - 1))
    };
}

// Canvas Mouse Move - Show Magnifier
canvas.addEventListener('mousemove', (e) => {
    const coords = getCanvasCoordinates(e);

    // Position magnifier relative to the page, not viewport
    const magnifierOffset = 20;
    const magnifierWidth = 150;
    const magnifierHeight = 150;

    // Calculate position, ensuring it doesn't go off-screen
    let left = e.pageX + magnifierOffset;
    let top = e.pageY + magnifierOffset;

    // Check if magnifier would go off right edge
    if (left + magnifierWidth > window.pageXOffset + window.innerWidth) {
        left = e.pageX - magnifierWidth - magnifierOffset;
    }

    // Check if magnifier would go off bottom edge
    if (top + magnifierHeight > window.pageYOffset + window.innerHeight) {
        top = e.pageY - magnifierHeight - magnifierOffset;
    }

    // Show magnifier
    magnifier.style.display = 'block';
    magnifier.style.left = `${left}px`;
    magnifier.style.top = `${top}px`;

    // Draw magnified area
    const magnifierSize = 150;
    const zoom = 5;
    const sourceSize = magnifierSize / zoom;

    magnifierCanvas.width = magnifierSize;
    magnifierCanvas.height = magnifierSize;

    magnifierCtx.imageSmoothingEnabled = false;
    magnifierCtx.drawImage(
        canvas,
        coords.x - sourceSize / 2,
        coords.y - sourceSize / 2,
        sourceSize,
        sourceSize,
        0,
        0,
        magnifierSize,
        magnifierSize
    );
});

// Canvas Mouse Leave - Hide Magnifier
canvas.addEventListener('mouseleave', () => {
    magnifier.style.display = 'none';
});

// Canvas Click - Pick Color
canvas.addEventListener('click', (e) => {
    const coords = getCanvasCoordinates(e);

    // Get pixel data
    const imageData = ctx.getImageData(coords.x, coords.y, 1, 1);
    const pixel = imageData.data;

    const r = pixel[0];
    const g = pixel[1];
    const b = pixel[2];
    const a = pixel[3] / 255;

    updateColorValues(r, g, b, a, coords.x, coords.y);
});

// Update Color Values
function updateColorValues(r, g, b, a, x, y) {
    // Update preview
    colorPreview.style.background = `rgba(${r}, ${g}, ${b}, ${a})`;

    // Update coordinates
    colorCoords.textContent = `Position: (${x}, ${y})`;

    // HEX
    const hex = rgbToHex(r, g, b);
    hexValue.value = hex;

    // RGB
    rgbValue.value = `rgb(${r}, ${g}, ${b})`;

    // RGBA
    rgbaValue.value = `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;

    // HSL
    const hsl = rgbToHsl(r, g, b);
    hslValue.value = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;

    // HSLA
    hslaValue.value = `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${a.toFixed(2)})`;
}

// RGB to HEX
function rgbToHex(r, g, b) {
    const toHex = (n) => {
        const hex = n.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// RGB to HSL
function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r:
                h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                break;
            case g:
                h = ((b - r) / d + 2) / 6;
                break;
            case b:
                h = ((r - g) / d + 4) / 6;
                break;
        }
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
}

// Copy to Clipboard
document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);

        input.select();
        document.execCommand('copy');

        // Modern clipboard API fallback
        navigator.clipboard.writeText(input.value).then(() => {
            showToast();
        }).catch(() => {
            // Fallback already executed with execCommand
            showToast();
        });
    });
});

// Show Toast
function showToast() {
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// New Image Button
newImageBtn.addEventListener('click', () => {
    workspace.style.display = 'none';
    uploadZone.style.display = 'block';
    fileInput.value = '';
    currentImage = null;

    // Reset color values
    colorPreview.style.background = '#000';
    colorCoords.textContent = 'Click on the image to pick a color';
    hexValue.value = '#000000';
    rgbValue.value = 'rgb(0, 0, 0)';
    rgbaValue.value = 'rgba(0, 0, 0, 1)';
    hslValue.value = 'hsl(0, 0%, 0%)';
    hslaValue.value = 'hsla(0, 0%, 0%, 1)';
});
