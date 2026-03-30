lucide.createIcons();

function addCopyButtons() {
    document.querySelectorAll('pre').forEach(pre => {
        const button = document.createElement('button');
        button.className = 'copy-btn';
        button.textContent = 'Копировать';
        button.addEventListener('click', async () => {
            const code = pre.querySelector('code') || pre;
            try {
                await navigator.clipboard.writeText(code.textContent);
                button.textContent = 'Скопировано!';
                setTimeout(() => button.textContent = 'Копировать', 2000);
            } catch (err) {
                console.error('Failed to copy: ', err);
                button.textContent = 'Ошибка';
                setTimeout(() => button.textContent = 'Копировать', 2000);
            }
        });
        pre.appendChild(button);
    });
}

addCopyButtons();
