// Run before the page paints; keep this dependency-free for prerendered pages.
(function () {
  var preference = 'system';
  try {
    var saved = localStorage.getItem('smartjsa_theme_preference');
    if (saved === 'light' || saved === 'dark') preference = saved;
  } catch (_) { /* Storage can be disabled; system mode still works. */ }
  var dark = preference === 'dark' || (preference === 'system' &&
    typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches);
  var theme = dark ? 'dark' : 'light';
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.themePreference = preference === 'system' ? 'auto' : preference;
  document.documentElement.style.colorScheme = theme;
})();
