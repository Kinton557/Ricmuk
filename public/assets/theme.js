(function () {
  try {
    var t = localStorage.getItem('ric_theme');
    if (!t && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) t = 'dark';
    if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  } catch (e) { /* storage blocked: stay light */ }
})();
