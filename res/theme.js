function initTheme() {
    const themeBtn = document.getElementById('theme-btn');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100]);
            }
            themeBtn.classList.add('spinning');
            const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
            document.documentElement.dataset.theme = next;
            localStorage.setItem('theme', next);
            setTimeout(() => themeBtn.classList.remove('spinning'), 500);
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
} else {
    initTheme();
}
