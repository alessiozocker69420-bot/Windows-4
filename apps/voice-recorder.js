/** Sprachrekorder – MediaRecorder API */
const VoiceRecorderApp = {
  render(container, winId) {
    container.innerHTML = `
      <div class="media-app">
        <div class="media-placeholder">
          <div class="icon">🎙️</div>
          <p>Sprachrekorder</p>
          <p style="font-size:12px;opacity:0.6;">Nutzt das Mikrofon deines Geräts (Browser-Berechtigung nötig)</p>
        </div>
        <div id="${winId}_status" style="font-size:14px;opacity:0.7;">Bereit</div>
        <div class="clock-controls" style="margin-top:12px;">
          <button class="clock-btn" id="${winId}_rec">● Aufnehmen</button>
          <button class="clock-btn secondary" id="${winId}_stop" disabled>■ Stopp</button>
        </div>
        <audio id="${winId}_audio" controls style="margin-top:20px;width:min(100%,360px);display:none;"></audio>
        <p style="font-size:11px;opacity:0.4;margin-top:16px;text-align:center;max-width:360px;">
          Auf iPad/Safari kann die Mikrofon-API eingeschränkt sein.
        </p>
      </div>
    `;
    let mediaRecorder = null;
    let chunks = [];
    const status = document.getElementById(winId + '_status');
    const recBtn = document.getElementById(winId + '_rec');
    const stopBtn = document.getElementById(winId + '_stop');
    const audio = document.getElementById(winId + '_audio');
    recBtn.addEventListener('click', async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          status.textContent = 'Mikrofon-API nicht verfügbar.';
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        chunks = [];
        const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
        mediaRecorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
        mediaRecorder.onstop = () => {
          stream.getTracks().forEach(t => t.stop());
          const blob = new Blob(chunks, { type: mediaRecorder.mimeType || 'audio/webm' });
          audio.src = URL.createObjectURL(blob);
          audio.style.display = 'block';
          status.textContent = 'Aufnahme fertig.';
        };
        mediaRecorder.start();
        status.textContent = 'Aufnahme läuft…';
        recBtn.disabled = true;
        stopBtn.disabled = false;
      } catch (e) {
        status.textContent = 'Fehler: ' + e.message;
      }
    });
    stopBtn.addEventListener('click', () => {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
      recBtn.disabled = false;
      stopBtn.disabled = true;
    });
  }
};
window.VoiceRecorderApp = VoiceRecorderApp;
