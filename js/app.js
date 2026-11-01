// DJ Roger Client-Side Web Player & Twitch Bot (GitHub / Cloudflare Pages)

const syncBus = window.BroadcastChannel ? new BroadcastChannel('bitchord_bus') : null;

// Estado
const state = {
  twitchChannel: localStorage.getItem('djroger_channel') || 'zeinweb3',
  botUsername: localStorage.getItem('djroger_bot_username') || '',
  botOAuth: localStorage.getItem('djroger_bot_oauth') || '',
  currentTrack: null,
  queue: JSON.parse(localStorage.getItem('djroger_queue') || '[]'),
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: parseInt(localStorage.getItem('djroger_volume') || '80', 10)
};

let ytPlayer = null;
let twitchClient = null;
let ticker = null;

// Elementos DOM
const dom = {
  coverArt: document.getElementById('coverArt'),
  trackTitle: document.getElementById('trackTitle'),
  trackArtist: document.getElementById('trackArtist'),
  requestedBy: document.getElementById('requestedBy'),
  sourceBadge: document.getElementById('sourceBadge'),
  progressBar: document.getElementById('progressBar'),
  progressWrapper: document.getElementById('progressWrapper'),
  currentTime: document.getElementById('currentTime'),
  durationTime: document.getElementById('durationTime'),
  btnPlayPause: document.getElementById('btnPlayPause'),
  btnNext: document.getElementById('btnNext'),
  volumeSlider: document.getElementById('volumeSlider'),
  queueList: document.getElementById('queueList'),
  queueCount: document.getElementById('queueCount'),
  twitchStatus: document.getElementById('twitchStatus'),
  addInput: document.getElementById('addInput'),
  btnAdd: document.getElementById('btnAdd'),

  // Config tab
  cfgTwitchChannel: document.getElementById('cfgTwitchChannel'),
  cfgBotUsername: document.getElementById('cfgBotUsername'),
  cfgBotOAuth: document.getElementById('cfgBotOAuth'),
  btnToggleToken: document.getElementById('btnToggleToken'),
  btnSaveConfig: document.getElementById('btnSaveConfig'),
  btnTestChat: document.getElementById('btnTestChat'),
  cfgFeedback: document.getElementById('cfgFeedback'),

  // OBS tab
  obsUrlInput: document.getElementById('obsUrlInput'),
  btnCopyObsUrl: document.getElementById('btnCopyObsUrl'),

  // Tab buttons
  tabBtns: document.querySelectorAll('.tab-btn'),
  tabPanes: document.querySelectorAll('.tab-pane')
};

// Gerenciamento de Abas
dom.tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.getAttribute('data-tab');
    dom.tabBtns.forEach(b => b.classList.remove('active'));
    dom.tabPanes.forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    document.getElementById(target).classList.add('active');
  });
});

// Toggle ver/ocultar Token
dom.btnToggleToken.addEventListener('click', () => {
  const isPass = dom.cfgBotOAuth.type === 'password';
  dom.cfgBotOAuth.type = isPass ? 'text' : 'password';
  dom.btnToggleToken.textContent = isPass ? '🔒' : '👁️';
});

// Configura valores iniciais nos campos
dom.cfgTwitchChannel.value = state.twitchChannel;
dom.cfgBotUsername.value = state.botUsername;
dom.cfgBotOAuth.value = state.botOAuth;

// URL do OBS
function updateObsUrl() {
  const base = window.location.href.split('?')[0].replace('index.html', '');
  const url = `${base.replace(/\/$/, '')}/overlay.html`;
  dom.obsUrlInput.value = url;
}
updateObsUrl();

dom.btnCopyObsUrl.addEventListener('click', () => {
  navigator.clipboard.writeText(dom.obsUrlInput.value).then(() => {
    alert('Link do OBS Overlay copiado com sucesso!\n' + dom.obsUrlInput.value);
  });
});

// Formata segundos em mm:ss
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const sec = Math.floor(seconds);
  const mins = Math.floor(sec / 60);
  const rem = sec % 60;
  return `${mins}:${rem.toString().padStart(2, '0')}`;
}

// Extrai YouTube Video ID
function extractYouTubeId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Salva estado local
function saveState() {
  localStorage.setItem('djroger_queue', JSON.stringify(state.queue));
  localStorage.setItem('djroger_volume', state.volume.toString());
  if (syncBus) {
    syncBus.postMessage({ type: 'STATE_UPDATE', state });
  }
}

// Atualiza Interface
function updateUI() {
  if (state.currentTrack) {
    dom.trackTitle.textContent = state.currentTrack.title;
    dom.trackArtist.textContent = state.currentTrack.artist;
    dom.coverArt.src = state.currentTrack.thumbnail || 'assets/roger/roger_logo.png';
    dom.requestedBy.innerHTML = `<span>Pedido por:</span> <strong>@${state.currentTrack.requestedBy}</strong>`;
    dom.requestedBy.style.display = 'inline-flex';

    if (state.currentTrack.source === 'spotify') {
      dom.sourceBadge.textContent = 'Spotify';
      dom.sourceBadge.className = 'source-badge spotify';
      dom.sourceBadge.style.display = 'block';
    } else if (state.currentTrack.source === 'youtube') {
      dom.sourceBadge.textContent = 'YouTube';
      dom.sourceBadge.className = 'source-badge youtube';
      dom.sourceBadge.style.display = 'block';
    } else {
      dom.sourceBadge.style.display = 'none';
    }
  } else {
    dom.trackTitle.textContent = 'Nenhuma música tocando';
    dom.trackArtist.textContent = 'Peça uma música pelo chat com !sr link';
    dom.coverArt.src = 'assets/roger/roger_logo.png';
    dom.requestedBy.style.display = 'none';
    dom.sourceBadge.style.display = 'none';
    dom.currentTime.textContent = '0:00';
    dom.durationTime.textContent = '0:00';
    dom.progressBar.style.width = '0%';
  }

  dom.btnPlayPause.innerHTML = state.isPlaying
    ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>'
    : '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';

  // Fila
  dom.queueCount.textContent = `(${state.queue.length})`;
  dom.queueList.innerHTML = '';
  if (state.queue.length === 0) {
    dom.queueList.innerHTML = `
      <div style="text-align: center; padding: 32px 16px; color: var(--text-muted); font-size: 0.88rem;">
        <img src="assets/roger/01_urso_feliz.png" alt="Roger" style="width: 72px; height: 72px; margin-bottom: 8px; opacity: 0.8;" />
        <p>A fila está vazia!</p>
        <span style="font-size: 0.78rem;">Use <code>!sr link</code> no chat da Twitch</span>
      </div>
    `;
  } else {
    state.queue.forEach((item, index) => {
      const el = document.createElement('div');
      el.className = 'queue-item';
      el.innerHTML = `
        <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted); width: 20px;">${index + 1}</div>
        <img src="${item.thumbnail || 'assets/roger/roger_logo.png'}" class="queue-thumb" />
        <div class="queue-info">
          <div class="queue-title">${item.title}</div>
          <div class="queue-sub">${item.artist} • <span style="color: var(--accent-pink);">@${item.requestedBy}</span></div>
        </div>
        <button class="btn" style="padding: 4px 8px; font-size: 0.75rem; color: #ff6b6b;" onclick="removeQueueItem('${item.uid}')">&times;</button>
      `;
      dom.queueList.appendChild(el);
    });
  }

  saveState();
}

window.removeQueueItem = function(uid) {
  state.queue = state.queue.filter(i => i.uid !== uid);
  updateUI();
};

// YouTube IFrame API
window.onYouTubeIframeAPIReady = function() {
  ytPlayer = new YT.Player('ytPlayer', {
    height: '100',
    width: '100',
    playerVars: {
      autoplay: 1,
      controls: 0,
      disablekb: 1,
      fs: 0,
      modestbranding: 1
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange
    }
  });
};

function onPlayerReady(event) {
  ytPlayer.setVolume(state.volume);
  if (state.queue.length > 0 && !state.currentTrack) {
    playNext();
  }
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    state.isPlaying = true;
    startTicker();
    updateUI();
  } else if (event.data === YT.PlayerState.PAUSED) {
    state.isPlaying = false;
    updateUI();
  } else if (event.data === YT.PlayerState.ENDED) {
    playNext();
  }
}

function startTicker() {
  if (ticker) clearInterval(ticker);
  ticker = setInterval(() => {
    if (ytPlayer && typeof ytPlayer.getCurrentTime === 'function' && state.isPlaying) {
      state.currentTime = ytPlayer.getCurrentTime() || 0;
      state.duration = ytPlayer.getDuration() || 0;
      dom.currentTime.textContent = formatTime(state.currentTime);
      dom.durationTime.textContent = formatTime(state.duration);
      if (state.duration > 0) {
        const pct = Math.min(100, (state.currentTime / state.duration) * 100);
        dom.progressBar.style.width = `${pct}%`;
      }
      if (syncBus) {
        syncBus.postMessage({
          type: 'TICK',
          currentTime: state.currentTime,
          duration: state.duration
        });
      }
    }
  }, 1000);
}

function playNext() {
  if (state.queue.length === 0) {
    state.currentTrack = null;
    state.isPlaying = false;
    if (ytPlayer && typeof ytPlayer.stopVideo === 'function') {
      ytPlayer.stopVideo();
    }
    updateUI();
    return;
  }

  state.currentTrack = state.queue.shift();
  state.isPlaying = true;
  state.currentTime = 0;

  if (ytPlayer && typeof ytPlayer.loadVideoById === 'function') {
    ytPlayer.loadVideoById(state.currentTrack.videoId);
    ytPlayer.playVideo();
  }

  updateUI();
  if (syncBus) {
    syncBus.postMessage({ type: 'TRACK_CHANGE', track: state.currentTrack });
  }
}

// Resolução de músicas
async function resolveAndAdd(input, requestedBy = 'Live') {
  const trimmed = input.trim();
  let track = null;

  if (trimmed.includes('spotify.com/track/')) {
    try {
      const cleanUrl = trimmed.split('?')[0];
      const oembedRes = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(cleanUrl)}`);
      const oembed = await oembedRes.json();

      const title = oembed.title || 'Música do Spotify';
      const thumbnail = oembed.thumbnail_url || 'assets/roger/roger_logo.png';
      
      const ytSearchUrl = `https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(title)}&filter=videos`;
      let videoId = null;

      try {
        const pipedRes = await fetch(ytSearchUrl);
        const pipedData = await pipedRes.json();
        if (pipedData && pipedData.items && pipedData.items.length > 0) {
          videoId = pipedData.items[0].url.replace('/watch?v=', '');
        }
      } catch (e) {}

      if (!videoId) videoId = 'dQw4w9WgXcQ';

      track = {
        title,
        artist: 'Spotify Track',
        thumbnail,
        videoId,
        source: 'spotify',
        requestedBy,
        uid: `${Date.now()}_${Math.random()}`
      };
    } catch (err) {
      alert('Não foi possível carregar música do Spotify.');
      return;
    }
  } else if (trimmed.includes('youtube.com/') || trimmed.includes('youtu.be/')) {
    const videoId = extractYouTubeId(trimmed);
    if (!videoId) return;

    let title = 'Música do YouTube';
    let artist = 'YouTube';

    try {
      const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
      const data = await res.json();
      if (data && data.title) {
        title = data.title;
        artist = data.author_name || 'YouTube';
      }
    } catch (e) {}

    track = {
      title,
      artist,
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      videoId,
      source: 'youtube',
      requestedBy,
      uid: `${Date.now()}_${Math.random()}`
    };
  } else {
    // Busca texto
    try {
      const pipedRes = await fetch(`https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(trimmed)}&filter=videos`);
      const pipedData = await pipedRes.json();
      if (pipedData && pipedData.items && pipedData.items.length > 0) {
        const item = pipedData.items[0];
        const vId = item.url.replace('/watch?v=', '');
        track = {
          title: item.title,
          artist: item.uploaderName || 'YouTube',
          thumbnail: item.thumbnail || `https://img.youtube.com/vi/${vId}/hqdefault.jpg`,
          videoId: vId,
          source: 'youtube',
          requestedBy,
          uid: `${Date.now()}_${Math.random()}`
        };
      }
    } catch (e) {}
  }

  if (track) {
    state.queue.push(track);
    const pos = state.queue.length;

    // Responde no chat se o bot tiver token configurado
    if (twitchClient && state.botUsername && state.botOAuth) {
      try {
        twitchClient.say(state.twitchChannel, `🐻🎵 @${requestedBy} adicionou "${track.title}" à fila! [Posição #${pos}]`);
      } catch (e) {}
    }

    if (!state.currentTrack) {
      playNext();
    } else {
      updateUI();
    }
    if (syncBus) {
      syncBus.postMessage({ type: 'TRACK_ADDED', track });
    }
  }
}

// Conexão Twitch
function connectTwitch(channel, botUser = '', botToken = '') {
  if (!channel || !channel.trim()) return;
  const channelName = channel.trim().toLowerCase().replace(/^#/, '');

  if (twitchClient) {
    try { twitchClient.disconnect(); } catch (e) {}
  }

  state.twitchChannel = channelName;
  state.botUsername = botUser.trim().toLowerCase();
  state.botOAuth = botToken.trim();

  localStorage.setItem('djroger_channel', state.twitchChannel);
  localStorage.setItem('djroger_bot_username', state.botUsername);
  localStorage.setItem('djroger_bot_oauth', state.botOAuth);

  dom.twitchStatus.className = 'status-pill disconnected';
  dom.twitchStatus.innerHTML = '<span class="dot"></span> Conectando...';

  const clientOpts = {
    options: { debug: false },
    connection: { reconnect: true, secure: true },
    channels: [channelName]
  };

  if (state.botUsername && state.botOAuth) {
    const pwd = state.botOAuth.startsWith('oauth:') ? state.botOAuth : `oauth:${state.botOAuth}`;
    clientOpts.identity = {
      username: state.botUsername,
      password: pwd
    };
  }

  twitchClient = new tmi.Client(clientOpts);

  twitchClient.on('connected', () => {
    dom.twitchStatus.className = 'status-pill connected';
    const hasVoice = (state.botUsername && state.botOAuth) ? ' (Com Respostas 💬)' : '';
    dom.twitchStatus.innerHTML = `<span class="dot"></span> Conectado #${channelName}${hasVoice}`;

    if (dom.cfgFeedback) {
      dom.cfgFeedback.style.display = 'block';
      dom.cfgFeedback.style.background = 'rgba(34, 197, 94, 0.2)';
      dom.cfgFeedback.style.color = '#4ade80';
      dom.cfgFeedback.textContent = `✅ Bot conectado com sucesso no canal #${channelName}!`;
    }
  });

  twitchClient.on('message', (chan, userstate, message, self) => {
    if (self) return;
    const text = message.trim();
    if (!text.startsWith('!')) return;

    const parts = text.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ').trim();
    const username = userstate['display-name'] || userstate.username;

    if (['!sr', '!songrequest', '!pedir'].includes(cmd)) {
      if (args) resolveAndAdd(args, username);
    } else if (['!skip', '!pular'].includes(cmd)) {
      playNext();
      if (state.botUsername && state.botOAuth) {
        twitchClient.say(channelName, `⏭️ Música pulada por @${username}!`);
      }
    } else if (['!np', '!song'].includes(cmd)) {
      if (state.botUsername && state.botOAuth && state.currentTrack) {
        twitchClient.say(channelName, `🎶 Tocando agora: "${state.currentTrack.title}" (pedido por @${state.currentTrack.requestedBy})`);
      }
    }
  });

  twitchClient.connect().catch(err => {
    dom.twitchStatus.className = 'status-pill disconnected';
    dom.twitchStatus.innerHTML = '<span class="dot"></span> Erro de conexão';
    if (dom.cfgFeedback) {
      dom.cfgFeedback.style.display = 'block';
      dom.cfgFeedback.style.background = 'rgba(239, 68, 68, 0.2)';
      dom.cfgFeedback.style.color = '#f87171';
      dom.cfgFeedback.textContent = `⚠️ Erro ao conectar: ${err.message}. Verifique seu token e nome de usuário.`;
    }
  });
}

// Botão Salvar Configuração
dom.btnSaveConfig.addEventListener('click', () => {
  const ch = dom.cfgTwitchChannel.value.trim();
  const botU = dom.cfgBotUsername.value.trim();
  const botT = dom.cfgBotOAuth.value.trim();

  if (!ch) {
    alert('Informe o nome do canal da Twitch!');
    return;
  }

  connectTwitch(ch, botU, botT);
});

// Botão Testar Mensagem no Chat
dom.btnTestChat.addEventListener('click', () => {
  if (!twitchClient || !state.botUsername || !state.botOAuth) {
    alert('Para enviar mensagens, você precisa preencher o Nome do Bot e o OAuth Token e clicar em Salvar!');
    return;
  }

  try {
    twitchClient.say(state.twitchChannel, '🐻 Teste: DJ Roger Bot conectado com sucesso no chat da live!');
    alert('Mensagem de teste enviada no seu chat da Twitch!');
  } catch (err) {
    alert('Falha ao enviar mensagem: ' + err.message);
  }
});

// Controles normais
dom.btnPlayPause.addEventListener('click', () => {
  if (!ytPlayer) return;
  if (state.isPlaying) {
    ytPlayer.pauseVideo();
  } else {
    ytPlayer.playVideo();
  }
});

dom.btnNext.addEventListener('click', () => {
  playNext();
});

dom.volumeSlider.addEventListener('input', (e) => {
  state.volume = parseInt(e.target.value, 10);
  if (ytPlayer && typeof ytPlayer.setVolume === 'function') {
    ytPlayer.setVolume(state.volume);
  }
  saveState();
});

dom.btnAdd.addEventListener('click', () => {
  const q = dom.addInput.value.trim();
  if (q) {
    resolveAndAdd(q, 'Streamer');
    dom.addInput.value = '';
  }
});

dom.addInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') dom.btnAdd.click();
});

// Inicialização
dom.volumeSlider.value = state.volume;
updateUI();
connectTwitch(state.twitchChannel, state.botUsername, state.botOAuth);
