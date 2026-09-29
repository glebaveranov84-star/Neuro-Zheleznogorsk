/* ============================================================
   ЛОГИКА САЙТА
   Читает массив NEWS из news.js и CommentsStore из comments.js
   ============================================================ */
(function () {
  'use strict';

  /* ---------- DOM: главная ---------- */
  const homeView    = document.getElementById('home-view');
  const articleView = document.getElementById('article-view');

  const grid       = document.getElementById('grid');
  const filtersEl  = document.getElementById('filters');
  const searchEl   = document.getElementById('search');
  const emptyEl    = document.getElementById('empty');
  const emptyText  = document.getElementById('empty-text');
  const emptyHint  = document.getElementById('empty-hint');

  /* ---------- DOM: статья ---------- */
  const aCat    = document.getElementById('a-cat');
  const aDate   = document.getElementById('a-date');
  const aTitle  = document.getElementById('a-title');
  const aTags   = document.getElementById('a-tags');
  const aBody   = document.getElementById('a-body');
  const aSrc    = document.getElementById('a-src');
  const aBefore = document.getElementById('a-before');
  const aAfter  = document.getElementById('a-after');
  const compare = document.getElementById('compare');
  const rangeEl = document.getElementById('range');
  const backBtn = document.querySelector('[data-back]');

  /* ---------- DOM: комментарии ---------- */
  const commentsList  = document.getElementById('comments-list');
  const commentsCount = document.getElementById('comments-count');
  const commentForm   = document.getElementById('comment-form');
  const commentAuthor = document.getElementById('comment-author');
  const commentText   = document.getElementById('comment-text');
  const commentHint   = document.getElementById('comment-hint');

  /* ---------- Состояние ---------- */
  let activeCat = 'all';
  let query     = '';
  let currentItem = null;
  let homeScrollY = 0;

  /* ---------- Утилиты ---------- */
  const MONTHS = ['января','февраля','марта','апреля','мая','июня',
                  'июля','августа','сентября','октября','ноября','декабря'];

  function formatDate(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }

  function formatDateTime(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${formatDate(iso)} · ${hh}:${mm}`;
  }

  function plural(n, one, few, many) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
    return many;
  }

  function esc(str) {
    return String(str).replace(/[&<>"']/g, s => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[s]));
  }

  /* ============================================================
     ГЛАВНАЯ
     ============================================================ */
  function buildFilters() {
    const cats = [...new Set(NEWS.map(n => n.category).filter(Boolean))];
    const items = [{ key: 'all', label: 'Все' }]
      .concat(cats.map(c => ({ key: c, label: c })));

    filtersEl.innerHTML = items.map(it => `
      <button class="filter-btn${it.key === activeCat ? ' active' : ''}"
              data-cat="${esc(it.key)}">${esc(it.label)}</button>
    `).join('');

    filtersEl.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCat = btn.dataset.cat;
        filtersEl.querySelectorAll('.filter-btn')
          .forEach(b => b.classList.toggle('active', b === btn));
        renderGrid();
      });
    });
  }

  function getFiltered() {
    const q = query.trim().toLowerCase();
    return NEWS.filter(item => {
      if (activeCat !== 'all' && item.category !== activeCat) return false;
      if (!q) return true;
      const haystack = [
        item.title, item.excerpt, item.category,
        (item.tags || []).join(' ')
      ].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }

  function renderGrid() {
    const items = getFiltered();
    grid.innerHTML = '';

    if (!items.length) {
      emptyEl.hidden = false;
      if (!NEWS.length) {
        emptyText.textContent = 'Публикаций пока нет.';
        emptyHint.hidden = false;
      } else {
        emptyText.textContent = 'Ничего не найдено. Попробуй другую категорию или запрос.';
        emptyHint.hidden = true;
      }
      return;
    }

    emptyEl.hidden = true;

    items.forEach((item, i) => {
      const card = document.createElement('article');
      card.className = 'card';
      card.style.animationDelay = Math.min(i * 60, 420) + 'ms';
      card.tabIndex = 0;
      card.setAttribute('role', 'link');
      card.setAttribute('aria-label', 'Открыть: ' + item.title);

      card.innerHTML = `
        <div class="card-cover">
          ${item.category ? `<span class="card-cat">${esc(item.category)}</span>` : ''}
          <img src="${esc(item.cover || '')}" alt="${esc(item.title)}" loading="lazy">
        </div>
        <div class="card-body">
          <span class="card-date">${esc(formatDate(item.date))}</span>
          <h3>${esc(item.title)}</h3>
          <p>${esc(item.excerpt || '')}</p>
          <span class="card-more">Читать <span aria-hidden="true">→</span></span>
        </div>
      `;

      const open = () => { location.hash = '#/news/' + item.id; };
      card.addEventListener('click', open);
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });

      grid.appendChild(card);
    });
  }

  /* ============================================================
     СТАТЬЯ
     ============================================================ */
  function showArticle(item) {
    currentItem = item;

    if (!homeView.hidden) homeScrollY = window.scrollY;

    aCat.textContent = item.category || '';
    aCat.hidden = !item.category;

    aDate.textContent = formatDate(item.date);
    aDate.setAttribute('datetime', item.date || '');

    aTitle.textContent = item.title;

    aTags.innerHTML = (item.tags || [])
      .map(t => `<span class="tag">#${esc(t)}</span>`).join('');

    aBody.innerHTML = item.body || '';

    aSrc.textContent = item.source
      ? '◈ ' + item.source
      : '◈ Изображение сгенерировано ИИ';

    const hasCompare = !!(item.before && item.after);
    compare.hidden = !hasCompare;
    if (hasCompare) {
      aBefore.src = item.before;
      aAfter.src  = item.after;
      aBefore.alt = 'Исходное фото — ' + item.title;
      aAfter.alt  = 'ИИ-визуализация — ' + item.title;
      setCompare(50);
      rangeEl.value = 50;
    }

    homeView.hidden = true;
    articleView.hidden = false;
    document.title = item.title + ' — Нейро-Железногорск';

    window.scrollTo({ top: 0, behavior: 'auto' });

    loadComments(item.id);

    requestAnimationFrame(() => aTitle.setAttribute('tabindex', '-1'));
  }

  function showHome() {
    articleView.hidden = true;
    homeView.hidden = false;
    currentItem = null;
    document.title = 'Нейро-Железногорск — город, каким он мог бы быть';

    const isAnchor = /^#(top|news|about)$/.test(location.hash);
    if (!isAnchor && homeScrollY) {
      requestAnimationFrame(() => window.scrollTo({ top: homeScrollY, behavior: 'auto' }));
    }
  }

  function setCompare(percent) {
    compare.style.setProperty('--pos', percent + '%');
  }

  rangeEl.addEventListener('input', e => setCompare(e.target.value));
  backBtn.addEventListener('click', () => { location.hash = '#news'; });

  /* ============================================================
     КОММЕНТАРИИ
     ============================================================ */
  async function loadComments(newsId) {
    commentsList.innerHTML = '<div class="comments-empty">Загрузка…</div>';
    commentsCount.textContent = '0';

    try {
      const comments = await CommentsStore.list(newsId);
      renderComments(comments);
    } catch (err) {
      console.error(err);
      commentsList.innerHTML = '<div class="comments-empty">Не удалось загрузить комментарии.</div>';
    }
  }

  function renderComments(comments) {
  commentsCount.textContent = comments.length;
  commentsList.innerHTML = '';

  if (!comments.length) {
    commentsList.innerHTML = '<div class="comments-empty">Комментариев пока нет. Будьте первым!</div>';
    return;
  }

  const ownIds    = (typeof CommentsStore.ownIds === 'function') ? CommentsStore.ownIds() : [];
  const compareBy = CommentsStore.compareBy || 'id';

  comments.forEach(c => {
    // «Свой» — если совпадает id (localStorage) или uid (Firebase)
    const canDelete = compareBy === 'uid'
      ? ownIds.includes(c.uid)
      : ownIds.includes(c.id);

    const el = document.createElement('div');
    el.className = 'comment';
    el.dataset.id = c.id;
    el.innerHTML = `
      <div class="comment-head">
        <span class="comment-author">${esc(c.author)}</span>
        <time class="comment-date" datetime="${esc(c.date)}">${esc(formatDateTime(c.date))}</time>
        ${canDelete ? `<button class="comment-delete" type="button"
                        data-delete="${esc(c.id)}"
                        aria-label="Удалить комментарий">Удалить</button>` : ''}
      </div>
      <div class="comment-text">${esc(c.text)}</div>
    `;
    commentsList.appendChild(el);
  });
}

  // Делегирование клика по «Удалить»
  commentsList.addEventListener('click', async e => {
    const btn = e.target.closest('[data-delete]');
    if (!btn || !currentItem) return;

    const commentId = btn.dataset.delete;
    if (!confirm('Удалить этот комментарий?')) return;

    btn.disabled = true;
    try {
      await CommentsStore.remove(currentItem.id, commentId);
      const comments = await CommentsStore.list(currentItem.id);
      renderComments(comments);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Не удалось удалить комментарий.');
      btn.disabled = false;
    }
  });

  function setHint(text, type) {
    commentHint.textContent = text || '';
    commentHint.className = 'comment-hint' + (type ? ' ' + type : '');
  }

  commentForm.addEventListener('submit', async e => {
    e.preventDefault();
    if (!currentItem) return;

    const text = commentText.value.trim();
    if (!text) {
      setHint('Комментарий не может быть пустым.', 'error');
      commentText.focus();
      return;
    }
    if (text.length > 800) {
      setHint('Слишком длинный комментарий (макс. 800 символов).', 'error');
      return;
    }

    const submitBtn = commentForm.querySelector('.comment-submit');
    submitBtn.disabled = true;
    setHint('Отправка…');

    try {
      await CommentsStore.add(currentItem.id, {
        author: commentAuthor.value,
        text
      });

      commentText.value = '';
      setHint('Комментарий опубликован.', 'success');
      setTimeout(() => setHint(''), 2500);

      const comments = await CommentsStore.list(currentItem.id);
      renderComments(comments);
    } catch (err) {
      console.error(err);
      setHint('Не удалось отправить. Попробуйте ещё раз.', 'error');
    } finally {
      submitBtn.disabled = false;
    }
  });

  /* ============================================================
     РОУТЕР
     ============================================================ */
  function route() {
    const hash = location.hash || '';
    const match = hash.match(/^#\/news\/(.+)$/);

    if (match) {
      const item = NEWS.find(n => n.id === match[1]);
      if (item) { showArticle(item); return; }
      location.hash = '#news';
      return;
    }

    showHome();
  }

  window.addEventListener('hashchange', route);

  /* ============================================================
     СТАТИСТИКА
     ============================================================ */
  function animateNumber(el, target, duration = 900) {
    if (target === 0) { el.textContent = '0'; return; }
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function renderStats() {
    const cats = new Set(NEWS.map(n => n.category).filter(Boolean));
    animateNumber(document.getElementById('stat-count'), NEWS.length);
    animateNumber(document.getElementById('stat-cats'), cats.size);
    const totalLabel = document.querySelector('#stat-count + span');
    if (totalLabel) {
      totalLabel.textContent = plural(NEWS.length, 'публикация', 'публикации', 'публикаций');
    }
  }

  /* ============================================================
     ИНИЦИАЛИЗАЦИЯ
     ============================================================ */
  document.getElementById('year').textContent = new Date().getFullYear();

  buildFilters();
  renderGrid();
  renderStats();

  route();

})();