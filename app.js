/* app.js — Photo editor: canvas filters, add text, download */
(() => {
  // Elements
  const fileIn = document.getElementById('photo-file');
  const canvas = document.getElementById('photo-canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const brightness = document.getElementById('brightness');
  const contrast = document.getElementById('contrast');
  const grayscale = document.getElementById('grayscale');
  const invert = document.getElementById('invert');
  const addTextBtn = document.getElementById('add-text');
  const textInput = document.getElementById('text-input');
  const fontSizeInput = document.getElementById('font-size');
  const textColorInput = document.getElementById('text-color');
  const downloadBtn = document.getElementById('photo-download');
  const resetBtn = document.getElementById('photo-reset');
  const applyFit = document.getElementById('apply-fit');
  const clearTextBtn = document.getElementById('clear-text');

  let originalImage = null;
  let textLayers = [];

  function resizeCanvasToImage(img) {
    const maxW = Math.min(window.innerWidth - 120, 1200);
    const ratio = Math.min(1, maxW / img.width);
    canvas.width = Math.round(img.width * ratio);
    canvas.height = Math.round(img.height * ratio);
  }

  function applyFiltersAndDraw() {
    if (!originalImage) {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      return;
    }
    // draw original scaled
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // set filter
    const f = `brightness(${brightness.value}%) contrast(${contrast.value}%) grayscale(${grayscale.value}%) invert(${invert.value}%)`;
    ctx.filter = f;
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    ctx.filter = 'none';
    // draw text layers
    textLayers.forEach(layer => {
      ctx.font = `${layer.size}px sans-serif`;
      ctx.fillStyle = layer.color;
      ctx.textAlign = 'center';
      ctx.fillText(layer.text, layer.x * canvas.width, layer.y * canvas.height);
    });
  }

  // handle file load
  fileIn.addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      originalImage = img;
      resizeCanvasToImage(img);
      applyFiltersAndDraw();
    };
    img.src = url;
  });

  // filter controls
  [brightness, contrast, grayscale, invert].forEach(el => {
    el.addEventListener('input', applyFiltersAndDraw);
  });

  // add text
  addTextBtn.addEventListener('click', () => {
    if (!originalImage) return alert('Load an image first');
    const text = textInput.value.trim();
    if (!text) return alert('Enter text to add');
    const size = Number(fontSizeInput.value) || 48;
    const color = textColorInput.value || '#ffffff';
    // default position: center near bottom, store normalized coords
    textLayers.push({ text, size, color, x: 0.5, y: 0.85 });
    applyFiltersAndDraw();
  });

  // clear text
  clearTextBtn.addEventListener('click', () => {
    textLayers = [];
    applyFiltersAndDraw();
  });

  // click canvas to reposition last text layer
  canvas.addEventListener('click', (e) => {
    if (textLayers.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const last = textLayers[textLayers.length - 1];
    last.x = x;
    last.y = y;
    applyFiltersAndDraw();
  });

  // download canvas
  downloadBtn.addEventListener('click', () => {
    if (!originalImage) return alert('Load an image first');
    canvas.toBlob(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vbeats-photo-${Date.now()}.png`;
      a.click();
    }, 'image/png');
  });

  // reset
  resetBtn.addEventListener('click', () => {
    originalImage = null;
    textLayers = [];
    fileIn.value = '';
    ctx.clearRect(0,0,canvas.width,canvas.height);
  });

  // fit image to canvas (keeps aspect)
  applyFit.addEventListener('click', () => {
    if (!originalImage) return;
    resizeCanvasToImage(originalImage);
    applyFiltersAndDraw();
  });

  // initialize small default canvas
  canvas.width = 800;
  canvas.height = 500;

  // Tabs switching
  const tabPhoto = document.getElementById('tab-photo');
  const tabVideo = document.getElementById('tab-video');
  const photoPanel = document.getElementById('photo-editor');
  const videoPanel = document.getElementById('video-editor');
  tabPhoto.addEventListener('click', () => {
    tabPhoto.classList.add('active'); tabVideo.classList.remove('active');
    photoPanel.classList.remove('hidden'); videoPanel.classList.add('hidden');
  });
  tabVideo.addEventListener('click', () => {
    tabVideo.classList.add('active'); tabPhoto.classList.remove('active');
    videoPanel.classList.remove('hidden'); photoPanel.classList.add('hidden');
  });

})();
