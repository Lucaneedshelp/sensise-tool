const chatbotState = {
  open: false,
  busy: false,
  messages: [
    {
      role: 'assistant',
      content: 'Hallo, ich bin dein Sensise Assistent. Frag mich gern allgemein zu Produkten, Projektaufnahme oder den Tools.'
    }
  ]
};

function createChatbot() {
  const icons = {
    bot: '<svg viewBox="0 0 24 24"><path d="M12 8V4"/><rect x="5" y="8" width="14" height="11" rx="3"/><path d="M9 13h.01"/><path d="M15 13h.01"/><path d="M9 17h6"/></svg>',
    send: '<svg viewBox="0 0 24 24"><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4 20-7z"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>'
  };
  const launcher = document.createElement('button');
  launcher.className = 'chatbot-launcher';
  launcher.type = 'button';
  launcher.innerHTML = `${icons.bot}<span>Chat</span>`;
  launcher.setAttribute('aria-label', 'Sensise Assistent öffnen');

  const panel = document.createElement('aside');
  panel.className = 'chatbot-panel';
  panel.hidden = true;
  panel.innerHTML = `
    <div class="chatbot-head">
      <div class="chatbot-title">
        <div class="chatbot-avatar">${icons.bot}</div>
        <div>
          <strong>Sensise Assistent</strong>
          <span>Produkt- und Toolfragen</span>
        </div>
      </div>
      <button class="chatbot-close" type="button" aria-label="Chat schließen">${icons.close}</button>
    </div>
    <div class="chatbot-messages" aria-live="polite"></div>
    <form class="chatbot-form">
      <input type="text" placeholder="Frage stellen..." autocomplete="off">
      <button class="chatbot-send" type="submit" aria-label="Nachricht senden">${icons.send}</button>
    </form>
  `;

  document.body.append(panel, launcher);

  const messages = panel.querySelector('.chatbot-messages');
  const form = panel.querySelector('.chatbot-form');
  const input = form.querySelector('input');
  const sendButton = form.querySelector('.chatbot-send');
  const close = panel.querySelector('.chatbot-close');

  function renderMessages() {
    messages.innerHTML = chatbotState.messages.map(message => `
      <div class="chatbot-message chatbot-message--${message.role}">${formatMessage(message.content)}</div>
    `).join('') + (chatbotState.busy ? '<div class="chatbot-typing"><span></span><span></span><span></span></div>' : '');
    messages.scrollTop = messages.scrollHeight;
  }

  function toggleChat(forceOpen) {
    chatbotState.open = typeof forceOpen === 'boolean' ? forceOpen : !chatbotState.open;
    panel.hidden = !chatbotState.open;
    launcher.innerHTML = chatbotState.open ? `${icons.close}<span>Zu</span>` : `${icons.bot}<span>Chat</span>`;
    if (chatbotState.open) {
      renderMessages();
      input.focus();
    }
  }

  async function sendMessage(content) {
    chatbotState.messages.push({ role: 'user', content });
    chatbotState.busy = true;
    renderMessages();
    input.value = '';
    input.disabled = true;
    sendButton.disabled = true;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatbotState.messages.slice(-10)
        })
      });
      const responseText = await response.text();
      if (!responseText.trim()) {
        throw new Error(`Leere Antwort vom Chat-Server (HTTP ${response.status})`);
      }
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(`Ungueltige Antwort vom Chat-Server (HTTP ${response.status})`);
      }
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      chatbotState.messages.push({ role: 'assistant', content: data.reply });
    } catch (error) {
      chatbotState.messages.push({
        role: 'assistant',
        content: `Ich konnte den Chat-Server nicht erreichen. Starte die Seite über den lokalen Server und prüfe die API-Key-Konfiguration in der .env. (${error.message})`
      });
    } finally {
      chatbotState.busy = false;
      input.disabled = false;
      sendButton.disabled = false;
      renderMessages();
      input.focus();
    }
  }

  launcher.addEventListener('click', () => toggleChat());
  close.addEventListener('click', () => toggleChat(false));
  form.addEventListener('submit', event => {
    event.preventDefault();
    const content = input.value.trim();
    if (!content || chatbotState.busy) return;
    sendMessage(content);
  });

  renderMessages();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[char]);
}

function formatMessage(value) {
  return escapeHtml(String(value).trim()).replace(/\n/g, '<br>');
}

createChatbot();
