/* video.js — simple video trimmer using ffmpeg.wasm */
(() => {
  const { createFFmpeg, fetchFile } = FFmpeg; // from ffmpeg.min.js (UMD exposes FFmpeg)
  const ffmpeg = createFFmpeg({ log: true });
  const loadBtn = document.getElementById('load-ffmpeg');
  const statusSpan = document.getElementById('ffmpeg-status');
  const fileIn = document.getElementById('video-file');
  const player = document.getElementById('player');
  const trimBtn = document.getElementById('trim-video');
  const startInput = document.getElementById('start-sec');
  const endInput = document.getElementById('end-sec');
  const progressBar = document.getElementById('ffmpeg-progress');
  const downloadAnchor = document.getElementById('download-video');
  const msg = document.getElementById('video-msg');

  let currentFile = null;

  async function loadFF() {
    if (!ffmpeg.isLoaded()) {
      statusSpan.textContent = 'FFmpeg: loading...';
      await ffmpeg.load();
      statusSpan.textContent = 'FFmpeg: ready';
    } else {
      statusSpan.textContent = 'FFmpeg: ready';
    }
  }

  loadBtn.addEventListener('click', loadFF);

  fileIn.addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    currentFile = f;
    const url = URL.createObjectURL(f);
    player.src = url;
    player.load();
    player.onloadedmetadata = () => {
      endInput.value = Math.floor(player.duration);
    };
  });

  // progress logging for ffmpeg
  ffmpeg.setLogger(({ type, message }) => {
    // optional debugging
    // console.log(type, message);
  });

  // progress callback available via ffmpeg.setProgress
  ffmpeg.setProgress(({ ratio }) => {
    progressBar.value = Math.round(ratio * 100);
  });

  trimBtn.addEventListener('click', async () => {
    if (!currentFile) return alert('Please choose a video file first');
    await loadFF();
    const start = Number(startInput.value) || 0;
    const end = Number(endInput.value) || (start + 5);
    if (end <= start) return alert('End time must be greater than start time');

    msg.textContent = 'Trimming... this may take a while (browser CPU)...';
    progressBar.classList.remove('hidden');

    try {
      ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(currentFile));
      // run ffmpeg trim using -ss and -to with copy for speed (may fail for some files, alternative: re-encode)
      await ffmpeg.run('-i', 'input.mp4', '-ss', `${start}`, '-to', `${end}`, '-c', 'copy', 'out.mp4');

      const data = ffmpeg.FS('readFile', 'out.mp4');
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      downloadAnchor.href = url;
      downloadAnchor.classList.remove('hidden');
      downloadAnchor.download = `vbeats-trim-${Date.now()}.mp4`;
      msg.textContent = 'Trim done — click Download Trimmed';
    } catch (err) {
      console.error(err);
      msg.textContent = 'Error during trimming. Try reloading or use a different file.';
    } finally {
      progressBar.classList.add('hidden');
      progressBar.value = 0;
    }
  });

})();
