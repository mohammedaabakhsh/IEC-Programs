(function () {
  const form = document.getElementById('certForm');
  const errorEl = document.getElementById('certError');
  const successEl = document.getElementById('certSuccess');
  const downloadLink = document.getElementById('downloadLink');
  const anotherBtn = document.getElementById('anotherBtn');

  function isConfigured() {
    return APP_CONFIG.API_URL && APP_CONFIG.API_URL.indexOf('PASTE_YOUR') === -1;
  }

  function base64ToBlob(base64, mime) {
    const bytes = atob(base64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    errorEl.style.display = 'none';

    if (!isConfigured()) {
      errorEl.textContent = 'لم يتم ربط رابط الخادم (API_URL) بعد.';
      errorEl.style.display = 'block';
      return;
    }

    const name = document.getElementById('c_name').value.trim();
    if (!name) return;

    const submitBtn = form.querySelector('button[type=submit]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'جاري التوليد...';

    try {
      const res = await fetch(APP_CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'generateCertificate', name: name }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'تعذّر توليد الشهادة');

      const blob = base64ToBlob(json.pdfBase64, 'application/pdf');
      const url = URL.createObjectURL(blob);

      downloadLink.href = url;
      downloadLink.download = json.filename || (name + '.pdf');

      form.style.display = 'none';
      successEl.style.display = 'block';

      downloadLink.click();
    } catch (err) {
      errorEl.textContent = 'حدث خطأ: ' + err.message;
      errorEl.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '🏅 توليد الشهادة وتنزيلها';
    }
  });

  anotherBtn.addEventListener('click', function () {
    successEl.style.display = 'none';
    form.style.display = 'block';
    document.getElementById('c_name').value = '';
  });
})();
