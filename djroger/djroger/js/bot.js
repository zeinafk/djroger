// DJ Roger • Conexão do Bot da Twitch

const syncBus = window.BroadcastChannel ? new BroadcastChannel('bitchord_bus') : null;

const dom = {
  botChannel: document.getElementById('botChannel'),
  botUsername: document.getElementById('botUsername'),
  botToken: document.getElementById('botToken'),
  btnToggleToken: document.getElementById('btnToggleToken'),
  btnConnectBot: document.getElementById('btnConnectBot'),
  btnDisconnectBot: document.getElementById('btnDisconnectBot'),
  botStatusBadge: document.getElementById('botStatusBadge'),
  testMsgInput: document.getElementById('testMsgInput'),
  btnSendTest: document.getElementById('btnSendTest'),
  chatLog: document.getElementById('chatLog')
};

let client = null;

// Carrega valores salvos
dom.botChannel.value = localStorage.getItem('djroger_channel') || 'zeinweb3';
dom.botUsername.value = localStorage.getItem('djroger_bot_username') || '';
dom.botToken.value = localStorage.getItem('djroger_bot_oauth') || '';

// Toggle mostrar/ocultar senha
dom.btnToggleToken.addEventListener('click', () => {
  const isPass = dom.botToken.type === 'password';
  dom.botToken.type = isPass ? 'text' : 'password';
  dom.btnToggleToken.textContent = isPass ? '🔒' : '👁️';
});

function logChat(author, text, isBot = false) {
  const el = document.createElement('div');
  el.className = 'chat-msg';
  el.innerHTML = `
    <span class="${isBot ? 'chat-msg-bot' : 'chat-msg-user'}">${author}:</span>
    <span>${text}</span>
  `;
  dom.chatLog.appendChild(el);
  dom.chatLog.scrollTop = dom.chatLog.scrollHeight;
}

function updateStatus(status, text) {
  dom.botStatusBadge.className = `status-badge ${status}`;
  dom.botStatusBadge.innerHTML = `<span class="dot"></span> ${text}`;
}

async function connect() {
  const channel = dom.botChannel.value.trim().toLowerCase().replace(/^#/, '');
  const username = dom.botUsername.value.trim().toLowerCase();
  let token = dom.botToken.value.trim();

  if (!channel) {
    alert('Informe o nome do canal da Twitch onde a live acontece!');
    return;
  }

  if (token && !token.startsWith('oauth:')) {
    token = `oauth:${token}`;
  }

  // Salva no storage para o player usar também
  localStorage.setItem('djroger_channel', channel);
  localStorage.setItem('djroger_bot_username', username);
  localStorage.setItem('djroger_bot_oauth', token);

  if (client) {
    try { await client.disconnect(); } catch (e) {}
  }

  updateStatus('offline', 'Conectando...');

  const options = {
    options: { debug: false },
    connection: { reconnect: true, secure: true },
    channels: [channel]
  };

  if (username && token) {
    options.identity = {
      username: username,
      password: token
    };
  }

  client = new tmi.Client(options);

  client.on('connected', () => {
    const hasVoice = (username && token) ? ` (@${username})` : ' (Modo Leitura)';
    updateStatus('online', `Online em #${channel}${hasVoice}`);
    logChat('Sistema', `Bot conectado com sucesso no canal #${channel}!`, true);

    if (syncBus) {
      syncBus.postMessage({ type: 'BOT_CONNECTED', channel, username });
    }
  });

  client.on('disconnected', (reason) => {
    updateStatus('offline', 'Desconectado');
    logChat('Sistema', `Desconectado: ${reason || 'Conexão encerrada'}`);
  });

  client.on('message', (chan, userstate, message, self) => {
    const author = userstate['display-name'] || userstate.username;
    logChat(author, message, self);

    if (self) return;

    // Resposta automática se o bot estiver logado
    if (username && token) {
      const text = message.trim();
      if (text.startsWith('!roger') || text.startsWith('!mascote')) {
        client.say(chan, `🐻 Ei @${author}! Eu sou o DJ Roger! Peça sua música no YouTube ou Spotify usando !sr <link ou nome>!`);
      }
    }
  });

  try {
    await client.connect();
  } catch (err) {
    updateStatus('offline', 'Erro ao conectar');
    alert('Erro ao conectar na Twitch: ' + err.message + '\nVerifique se o seu Token e Nome de Usuário estão corretos.');
  }
}

async function disconnect() {
  if (client) {
    try {
      await client.disconnect();
    } catch (e) {}
    client = null;
  }
  updateStatus('offline', 'Desconectado');
}

dom.btnConnectBot.addEventListener('click', connect);
dom.btnDisconnectBot.addEventListener('click', disconnect);

dom.btnSendTest.addEventListener('click', () => {
  const channel = dom.botChannel.value.trim().toLowerCase().replace(/^#/, '');
  const username = dom.botUsername.value.trim();
  const token = dom.botToken.value.trim();
  const msg = dom.testMsgInput.value.trim();

  if (!client || !username || !token) {
    alert('O bot precisa estar conectado com o Nome de Usuário e OAuth Token para enviar mensagens!');
    return;
  }

  if (!msg) return;

  try {
    client.say(channel, msg);
    logChat(username, msg, true);
    alert('Mensagem enviada com sucesso no chat da Twitch!');
  } catch (err) {
    alert('Erro ao enviar mensagem: ' + err.message);
  }
});

// Conecta automaticamente se já tiver configurações
if (dom.botChannel.value) {
  connect();
}
