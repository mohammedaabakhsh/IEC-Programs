(function () {
  function removeTrainerSections() {
    const content = document.getElementById('content');
    if (!content) return;

    const headings = Array.from(content.querySelectorAll('h3'));
    const targets = [
      'تحليل الأداء حسب المدرب',
      'أكثر المدربين نشاطًا'
    ];

    headings.forEach(function (heading) {
      const text = (heading.textContent || '').trim();
      if (!targets.includes(text)) return;
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
