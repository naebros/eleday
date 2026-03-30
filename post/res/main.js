/**
 * HTTP Request Builder
 * Safe educational tool for sending HTTP requests from the browser
 */

document.getElementById('theme-btn').addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
});

class HTTPRequestBuilder {
    constructor() {
        this.methodSelect = document.getElementById('req-method');
        this.urlInput = document.getElementById('req-url');
        this.headersTextarea = document.getElementById('req-headers');
        this.bodyTextarea = document.getElementById('req-body');
        this.bodyGroup = document.getElementById('req-body-group');
        this.sendBtn = document.getElementById('req-send');

        this.resultDiv = document.getElementById('req-result');
        this.loadingDiv = document.getElementById('req-loading');
        this.errorDiv = document.getElementById('req-error');
        this.statusCode = document.getElementById('req-status');
        this.responseHeaders = document.getElementById('req-response-headers');
        this.responseBody = document.getElementById('req-response-body');
        this.errorText = document.getElementById('req-error-text');

        this.init();
    }

    init() {
        this.methodSelect.addEventListener('change', () => this.updateBodyFieldVisibility());
        this.sendBtn.addEventListener('click', () => this.sendRequest());

        this.urlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.sendRequest();
            }
        });

        document.querySelectorAll('.example-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.loadExample(e.target));
        });

        this.updateBodyFieldVisibility();
    }

    loadExample(btn) {
        const method = btn.getAttribute('data-method');
        const url = btn.getAttribute('data-url');
        const body = btn.getAttribute('data-body');

        this.methodSelect.value = method;
        this.urlInput.value = url;

        if (body) {
            this.bodyTextarea.value = body;
        } else {
            this.bodyTextarea.value = '';
        }

        this.updateBodyFieldVisibility();
        setTimeout(() => this.sendRequest(), 100);
    }

    updateBodyFieldVisibility() {
        const method = this.methodSelect.value;
        const shouldShowBody = ['POST', 'PUT', 'PATCH'].includes(method);
        this.bodyGroup.style.display = shouldShowBody ? 'flex' : 'none';
    }

    validateUrl(url) {
        try {
            const urlObj = new URL(url);

            const warnings = [];

            if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
                warnings.push('Это localhost. Убедись, что сервер запущен локально.');
            }

            if (this.isPrivateIP(urlObj.hostname)) {
                warnings.push('Это приватный IP-адрес. Запрос может быть заблокирован браузером.');
            }

            if (urlObj.protocol === 'http:') {
                warnings.push('Это HTTP (незащищённый). Используй HTTPS для чувствительных данных.');
            }

            if (warnings.length > 0) {
                console.warn('URL warnings:', warnings.join('\n'));
            }

            return true;
        } catch (e) {
            throw new Error(`Неверный URL: ${e.message}`);
        }
    }

    isPrivateIP(hostname) {
        const privateRanges = [
            /^10\./,
            /^172\.(1[6-9]|2[0-9]|3[01])\./,
            /^192\.168\./,
            /^::1$/,
            /^fc[0-9a-f]{2}:/i,
            /^fd[0-9a-f]{2}:/i,
        ];

        return privateRanges.some(range => range.test(hostname));
    }

    parseHeaders(text) {
        const headers = {};

        if (!text.trim()) return headers;

        const lines = text.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;

            const colonIndex = trimmed.indexOf(':');
            if (colonIndex === -1) {
                throw new Error(`Неверный формат заголовка: "${trimmed}". Используй "Имя: значение"`);
            }

            const name = trimmed.substring(0, colonIndex).trim();
            const value = trimmed.substring(colonIndex + 1).trim();

            if (!name) {
                throw new Error('Имя заголовка не может быть пустым');
            }

            headers[name] = value;
        }

        return headers;
    }

    showError(message) {
        this.hideResults();
        this.errorDiv.style.display = 'block';
        this.errorText.textContent = message;
        this.loadingDiv.style.display = 'none';
    }

    hideResults() {
        this.resultDiv.style.display = 'none';
        this.errorDiv.style.display = 'none';
        this.loadingDiv.style.display = 'none';
    }

    formatJSON(jsonString) {
        try {
            const obj = JSON.parse(jsonString);
            return JSON.stringify(obj, null, 2);
        } catch {
            return jsonString;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatHeaders(headers) {
        let result = '';
        for (const [key, value] of Object.entries(headers)) {
            result += `<div><strong>${this.escapeHtml(key)}:</strong> ${this.escapeHtml(String(value))}</div>`;
        }
        return result || '<em>Нет заголовков</em>';
    }

    async sendRequest() {
        this.hideResults();
        this.loadingDiv.style.display = 'flex';
        this.sendBtn.disabled = true;

        try {
            const url = this.urlInput.value.trim();
            if (!url) {
                throw new Error('Введи URL');
            }
            this.validateUrl(url);

            const method = this.methodSelect.value;
            let body = null;
            if (['POST', 'PUT', 'PATCH'].includes(method)) {
                const bodyText = this.bodyTextarea.value.trim();
                if (bodyText) {
                    body = bodyText;
                }
            }

            const customHeaders = this.parseHeaders(this.headersTextarea.value);

            const fetchOptions = {
                method,
                headers: customHeaders,
                mode: 'cors',
            };

            if (body) {
                fetchOptions.body = body;

                if (!customHeaders['Content-Type']) {
                    if (body.trim().startsWith('{') || body.trim().startsWith('[')) {
                        fetchOptions.headers['Content-Type'] = 'application/json';
                    }
                }
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            fetchOptions.signal = controller.signal;

            const response = await fetch(url, fetchOptions);
            clearTimeout(timeoutId);

            const responseText = await response.text();

            this.loadingDiv.style.display = 'none';
            this.resultDiv.style.display = 'block';

            this.statusCode.textContent = `${response.status} ${response.statusText}`;
            this.statusCode.className = response.ok ? 'status-ok' : 'status-error';

            const responseHeadersObj = {};
            for (const [key, value] of response.headers) {
                responseHeadersObj[key] = value;
            }
            this.responseHeaders.innerHTML = this.formatHeaders(responseHeadersObj);

            const formattedBody = this.formatJSON(responseText);
            this.responseBody.textContent = formattedBody;

        } catch (error) {
            if (error.name === 'AbortError') {
                this.showError('Таймаут: сервер не ответил за 10 секунд');
            } else if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
                this.showError(
                    `CORS ошибка или сетевая проблема.\n\n` +
                    `Возможные причины:\n` +
                    `• Сервер не поддерживает CORS\n` +
                    `• Неверный URL\n` +
                    `• Сервер недоступен\n\n` +
                    `Детали: ${error.message}`
                );
            } else {
                this.showError(error.message || 'Неизвестная ошибка');
            }
        } finally {
            this.sendBtn.disabled = false;
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        lucide.createIcons();
        window.httpRequestBuilder = new HTTPRequestBuilder();
        addCopyButtons();
    });
} else {
    lucide.createIcons();
    window.httpRequestBuilder = new HTTPRequestBuilder();
    addCopyButtons();
}

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
