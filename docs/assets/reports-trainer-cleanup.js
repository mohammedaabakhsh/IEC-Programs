(function () {
  function normalize(text) {
    return String(text || '')
      .replace(/[🔥👤📊]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function removeTrainerSections() {
    const content = document.getElementById('content');
    if (!content) return;

    const targets = [
      'تحليل الأداء حسب المدرب',
      'أكثر المدربين نشاطًا'
    ];

    content.querySelectorAll('h3').forEach(function (heading) {
      if (!targets.includes(normalize(heading.textContent))) return;
      const card = heading.closest('.card');
      if (card) card.remove();
    });
  }

  const content = document.getElementById('content');
  if (!content) return;

  const observer = new MutationObserver(removeTrainerSections);
  observer.observe(content, { childList: true, subtree: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removeTrainerSections);
  } else {
    removeTrainerSections();
  }
})();
