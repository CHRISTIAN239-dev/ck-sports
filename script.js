// Client-side script: fetch articles from the backend and render them into the grid

// Register service worker and install prompt handling
let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  deferredInstallPrompt = e;
  const installBtn = document.getElementById('install-btn');
  if (installBtn) installBtn.style.display = 'inline-block';
});

async function tryInstall() {
  const installBtn = document.getElementById('install-btn');
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  const choice = await deferredInstallPrompt.userChoice;
  if (choice.outcome === 'accepted') {
    console.log('User accepted the install prompt');
  } else {
    console.log('User dismissed the install prompt');
  }
  deferredInstallPrompt = null;
  if (installBtn) installBtn.style.display = 'none';
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then(() => console.log('Service worker registered'))
    .catch((err) => console.warn('SW registration failed:', err));
}


document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('news-grid');
  if (!grid) return;

  fetch('/api/articles')
    .then((res) => res.json())
    .then((articles) => {
      // If no articles, keep fallback content
      if (!articles || !articles.length) return;
      grid.innerHTML = '';

      articles.forEach((a) => {
        const article = document.createElement('article');
        article.className = 'card';
        article.innerHTML = `
          <img src="${a.image}" alt="${a.title}" />
          <h4>${a.title}</h4>
          <p>${a.excerpt}</p>
          <a class="link" href="${a.url}">Full story</a>
        `;
        grid.appendChild(article);
      });
    })
    .catch((err) => {
      console.error('Error loading articles:', err);
    });
});

// Auth UI handling for login/logout buttons
document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const installBtn = document.createElement('button');
  installBtn.id = 'install-btn';
  installBtn.className = 'nav-btn';
  installBtn.style.display = 'none';
  installBtn.textContent = 'Install App';
  installBtn.addEventListener('click', tryInstall);
  const nav = document.querySelector('.main-nav');
  if (nav) nav.appendChild(installBtn);

  async function updateAuthButtons() {
    try {
      const res = await fetch('/api/auth-status');
      const body = await res.json();
      if (body.logged) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = '';
      } else {
        if (loginBtn) loginBtn.style.display = '';
        if (logoutBtn) logoutBtn.style.display = 'none';
      }
    } catch (err) {
      console.error('Auth check failed', err);
    }
  }

  updateAuthButtons();

  if (loginBtn) loginBtn.addEventListener('click', () => window.location.href = '/login.html');
  if (logoutBtn) logoutBtn.addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    updateAuthButtons();
    window.location.href = '/login.html';
  });
});

// Fan chat: fetch, render, post and poll for messages
document.addEventListener('DOMContentLoaded', () => {
  const messagesContainer = document.getElementById('chat-messages');
  const chatForm = document.getElementById('chat-form');
  const refreshBtn = document.getElementById('refresh-chat');

  if (!messagesContainer || !chatForm) return;

  async function fetchMessages() {
    try {
      const res = await fetch('/api/messages');
      if (!res.ok) return;
      const messages = await res.json();
      renderMessages(messages);
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  }

  function renderMessages(messages) {
    messagesContainer.innerHTML = '';
    // adapt to backend message shape: {id,author,text,time}
    messages.slice().reverse().forEach(m => {
      const el = document.createElement('div');
      el.className = `chat-message`;
      el.innerHTML = `<div class="meta"><strong>${escapeHtml(m.author)}</strong> · <small>${new Date(m.time).toLocaleString()}</small></div><div class="content">${escapeHtml(m.text)}</div>`;
      messagesContainer.appendChild(el);
    });
  }

  function escapeHtml(s){
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const author = document.getElementById('chat-author').value.trim();
    const content = document.getElementById('chat-content').value.trim();
    const type = document.getElementById('chat-type').value;
    if (!author || !content) return;
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // backend expects {author, text}
        body: JSON.stringify({ author, text: content })
      });
      if (res.ok) {
        document.getElementById('chat-content').value = '';
        fetchMessages();
      } else {
        console.error('Failed to post message', await res.text());
      }
    } catch (err) {
      console.error('Failed to post message', err);
    }
  });

  if (refreshBtn) refreshBtn.addEventListener('click', (e) => { e.preventDefault(); fetchMessages(); });

  // Poll for new messages every 10 seconds
  fetchMessages();
  setInterval(fetchMessages, 10000);
});
document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('news-grid');
  if (!grid) return;

  fetch('/api/articles')
    .then((res) => res.json())
    .then((articles) => {
      // If no articles, keep fallback content
      if (!articles || !articles.length) return;
      grid.innerHTML = '';

      articles.forEach((a) => {
        const article = document.createElement('article');
        article.className = 'card';
        article.innerHTML = `
          <img src="${a.image}" alt="${a.title}" />
          <h4>${a.title}</h4>
          <p>${a.excerpt}</p>
          <a class="link" href="${a.url}">Full story</a>
        `;
        grid.appendChild(article);
      });
    })
    .catch((err) => {
      console.error('Error loading articles:', err);
    });
});

// Auth UI handling for login/logout buttons
document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');

  async function updateAuthButtons() {
    try {
      const res = await fetch('/api/auth-status');
      const body = await res.json();
      if (body.authenticated) {
        loginBtn.style.display = 'none';
        logoutBtn.style.display = '';
      } else {
        loginBtn.style.display = '';
        logoutBtn.style.display = 'none';
      }
    } catch (err) {
      console.error('Auth check failed', err);
    }
  }

  updateAuthButtons();

  if (loginBtn) loginBtn.addEventListener('click', () => window.location.href = '/login.html');
  if (logoutBtn) logoutBtn.addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    updateAuthButtons();
    window.location.href = '/login.html';
  });
});

// Fan chat: fetch, render, post and poll for messages
document.addEventListener('DOMContentLoaded', () => {
  const messagesContainer = document.getElementById('chat-messages');
  const chatForm = document.getElementById('chat-form');
  const refreshBtn = document.getElementById('refresh-chat');

  if (!messagesContainer || !chatForm) return;

  async function fetchMessages() {
    try {
      const res = await fetch('/api/messages');
      if (!res.ok) return;
      const messages = await res.json();
      renderMessages(messages);
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  }

  function renderMessages(messages) {
    messagesContainer.innerHTML = '';
    messages.slice().reverse().forEach(m => {
      const el = document.createElement('div');
      el.className = `chat-message ${m.type || 'chat'}`;
      el.innerHTML = `<div class="meta"><strong>${escapeHtml(m.author)}</strong> · <small>${new Date(m.timestamp).toLocaleString()}</small> · <em>${escapeHtml(m.type)}</em></div><div class="content">${escapeHtml(m.content)}</div>`;
      messagesContainer.appendChild(el);
    });
  }

  function escapeHtml(s){
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const author = document.getElementById('chat-author').value.trim();
    const content = document.getElementById('chat-content').value.trim();
    const type = document.getElementById('chat-type').value;
    if (!author || !content) return;
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, content, type })
      });
      if (res.ok) {
        document.getElementById('chat-content').value = '';
        fetchMessages();
      } else {
        console.error('Failed to post message', await res.text());
      }
    } catch (err) {
      console.error('Failed to post message', err);
    }
  });

  refreshBtn.addEventListener('click', (e) => { e.preventDefault(); fetchMessages(); });

  // Poll for new messages every 10 seconds
  fetchMessages();
  setInterval(fetchMessages, 10000);
});
