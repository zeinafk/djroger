const syncBus = window.BroadcastChannel ? new BroadcastChannel('bitchord_bus') : null;

const overlayCard = document.getElementById('overlayCard');
const coverImg = document.getElementById('coverImg');
const trackTitle = document.getElementById('trackTitle');
const trackArtist = document.getElementById('trackArtist');
const requestedUser = document.getElementById('requestedUser');
const timeText = document.getElementById('timeText');
const progressFill = document.getElementById('progressFill');
const rogerToast = document.getElementById('rogerToast');
const toastMessage = document.getElementById('toastMessage');

let currentTrack = null;
let currentDuration = 0;
let toastTimeout = null;

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const sec = Math.floor(seconds);
  const mins = Math.floor(sec / 60);
  const rem = sec % 60;
  return `${mins}:${rem.toString().padStart(2, '0')}`;
}

function updateTrack(track, isPlaying) {
  currentTrack = track;
  if (!track || !isPlaying) {
    overlayCard.classList.remove('visible');
    return;
  }

  trackTitle.textContent = track.title || 'Música';
  trackArtist.textContent = track.artist || 'Artista';
  coverImg.src = track.thumbnail || 'assets/roger/roger_logo.png';
  requestedUser.textContent = `@${track.requestedBy || 'Live'}`;
  overlayCard.classList.add('visible');
}

if (syncBus) {
  syncBus.onmessage = (event) => {
    const data = event.data;
    if (!data) return;

    if (data.type === 'STATE_UPDATE' && data.state) {
      updateTrack(data.state.currentTrack, data.state.isPlaying);
    } else if (data.type === 'TRACK_CHANGE') {
      updateTrack(data.track, true);
    } else if (data.type === 'TICK') {
      const curr = data.currentTime || 0;
      const dur = data.duration || 0;
      timeText.textContent = `${formatTime(curr)} / ${formatTime(dur)}`;
      if (dur > 0) {
        const pct = Math.min(100, (curr / dur) * 100);
        progressFill.style.width = `${pct}%`;
      }
    } else if (data.type === 'TRACK_ADDED' && data.track) {
      toastMessage.textContent = `@${data.track.requestedBy} pediu: ${data.track.title}`;
      rogerToast.classList.add('show');
      if (toastTimeout) clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => {
        rogerToast.classList.remove('show');
      }, 5000);
    }
  };
}
