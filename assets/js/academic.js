(function () {
  'use strict';

  document.documentElement.classList.add('has-js');

  var menuButton = document.querySelector('.menu-toggle');
  var navigation = document.querySelector('.site-nav');
  if (menuButton && navigation) {
    function closeMenu() {
      menuButton.setAttribute('aria-expanded', 'false');
      navigation.classList.remove('is-open');
    }
    menuButton.addEventListener('click', function () {
      var expanded = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!expanded));
      navigation.classList.toggle('is-open', !expanded);
    });
    navigation.addEventListener('click', function (event) {
      if (event.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
        closeMenu();
        menuButton.focus();
      }
    });
    document.addEventListener('click', function (event) {
      if (!event.target.closest('.header-inner')) closeMenu();
    });
  }

  var filterButtons = Array.from(document.querySelectorAll('[data-filter]'));
  var papers = Array.from(document.querySelectorAll('.publication-item[data-kind]'));
  var results = document.querySelector('[data-results]');
  if (filterButtons.length && papers.length) {
    document.querySelectorAll('.filter-bar').forEach(function (bar) { bar.classList.add('is-enhanced'); });
    function filterPapers(kind) {
      var visibleCount = 0;
      papers.forEach(function (paper) {
        var visible = kind === 'all' || paper.dataset.kind === kind;
        paper.hidden = !visible;
        if (visible) visibleCount += 1;
      });
      filterButtons.forEach(function (button) {
        var active = button.dataset.filter === kind;
        button.setAttribute('aria-pressed', String(active));
        button.classList.toggle('is-active', active);
      });
      document.querySelectorAll('.year-group').forEach(function (group) {
        var groupPapers = Array.from(group.querySelectorAll('.publication-item[data-kind]'));
        group.hidden = groupPapers.length > 0 && groupPapers.every(function (paper) { return paper.hidden; });
      });
      if (results) {
        results.setAttribute('aria-live', 'polite');
        results.textContent = visibleCount + (visibleCount === 1 ? ' publication' : ' publications') + (kind === 'all' ? ' shown' : ' in this category');
      }
      document.querySelectorAll('[data-no-results]').forEach(function (emptyState) {
        emptyState.hidden = visibleCount !== 0;
      });
    }
    filterButtons.forEach(function (button) {
      button.addEventListener('click', function () { filterPapers(button.dataset.filter); });
    });
    filterPapers('all');
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var previousFocus = document.activeElement;
      var textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      var copied = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (previousFocus) previousFocus.focus();
      if (copied) resolve();
      else reject(new Error('Copy unavailable'));
    });
  }

  document.querySelectorAll('[data-copy-link], [data-copy-citation]').forEach(function (button) {
    button.addEventListener('click', function () {
      var isCitation = button.hasAttribute('data-copy-citation');
      var targetId = isCitation ? button.dataset.copyCitation.replace(/^#/, '') : '';
      var citation = targetId ? document.getElementById(targetId) : null;
      var content = isCitation && citation ? citation.textContent.trim() : (button.dataset.copyLink || window.location.href);
      var scope = button.closest('.project-section, .project-citation, .project-hero, .project-resources, .paper-links') || document;
      var status = scope.querySelector('[data-copy-status]') || document.querySelector('[data-copy-status]');
      if (status) status.setAttribute('aria-live', 'polite');
      if (isCitation && !citation) {
        if (status) status.textContent = 'Please select and copy the citation manually.';
        return;
      }
      copyText(content).then(function () {
        if (status) status.textContent = isCitation ? 'Citation copied.' : 'Link copied.';
        else {
          var label = button.textContent;
          button.textContent = 'Copied';
          window.setTimeout(function () { button.textContent = label; }, 2000);
        }
      }).catch(function () {
        if (status) status.textContent = 'Please select and copy the ' + (isCitation ? 'citation' : 'address') + ' manually.';
      });
    });
  });
}());
