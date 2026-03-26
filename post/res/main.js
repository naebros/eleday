/**
 * Pages System with Swipe Navigation
 * - Horizontal swipe to navigate pages
 * - Progress bar at top
 * - Smooth transitions with cubic-bezier easing
 * - Vertical scroll within each page
 */

class PagesSystem {
    constructor(options = {}) {
      this.wrapper = document.querySelector(options.wrapper || '.pages-wrapper');
      this.container = document.querySelector(options.container || '.pages-container');
      this.progressBar = document.querySelector(options.progress || '.pages-progress');
      
      if (!this.wrapper || !this.container) {
        console.warn('PagesSystem: wrapper or container not found');
        return;
      }
  
      this.pages = Array.from(this.container.querySelectorAll('.page'));
      this.currentIndex = 0;
      this.startX = 0;
      this.startY = 0;
      this.currentX = 0;
      this.currentY = 0;
      this.isDragging = false;
      this.isTransitioning = false;
      this.dragDirection = null; // 'horizontal', 'vertical', or null
      this.minSwipeDistance = 10; // pixels
      this.directionThreshold = 10; // pixels needed to determine direction
      this.isInteractiveElementFocused = false; // Track if user is interacting with elements
  
      // Bind methods once to use in remove listener
      this._onTouchStart = this.onTouchStart.bind(this);
      this._onTouchMove = this.onTouchMove.bind(this);
      this._onTouchEnd = this.onTouchEnd.bind(this);
      this._onMouseDown = this.onMouseDown.bind(this);
      this._onMouseMove = this.onMouseMove.bind(this);
      this._onMouseUp = this.onMouseUp.bind(this);
      this._onKeyDown = this.onKeyDown.bind(this);
      this._onFocusIn = this.onFocusIn.bind(this);
      this._onFocusOut = this.onFocusOut.bind(this);
  
      this.init();
    }
  
    init() {
      if (this.pages.length === 0) {
        console.warn('PagesSystem: no pages found');
        return;
      }
  
      // Initialize block animation indices
      this.initializeBlockAnimations();
  
      // Setup progress bar segments
      this.setupProgressBar();
  
      // Touch events
      this.wrapper.addEventListener('touchstart', this._onTouchStart, { passive: false });
      this.wrapper.addEventListener('touchmove', this._onTouchMove, { passive: false });
      this.wrapper.addEventListener('touchend', this._onTouchEnd, { passive: false });
  
      // Mouse events
      this.wrapper.addEventListener('mousedown', this._onMouseDown);
      document.addEventListener('mousemove', this._onMouseMove);
      document.addEventListener('mouseup', this._onMouseUp);
  
      // Keyboard navigation
      document.addEventListener('keydown', this._onKeyDown);
  
      // Focus management for interactive elements
      document.addEventListener('focusin', this._onFocusIn);
      document.addEventListener('focusout', this._onFocusOut);
  
      // Show first page
      this.goToPage(0, false);
    }
  
    initializeBlockAnimations() {
      this.pages.forEach((page) => {
        const blocks = page.querySelectorAll('.block');
        blocks.forEach((block, index) => {
          block.style.setProperty('--index', index);
        });
      });
    }
  
    setupProgressBar() {
      if (!this.progressBar) return;
  
      this.progressBar.innerHTML = '';
      this.progressSegments = [];
  
      this.pages.forEach((page, index) => {
        const segment = document.createElement('div');
        segment.className = 'pages-progress-segment';
        segment.setAttribute('data-index', index);
        segment.setAttribute('tabindex', '0');
        segment.setAttribute('role', 'button');
        segment.setAttribute('aria-label', `Go to page ${index + 1}`);
  
        segment.addEventListener('click', () => this.goToPage(index, true));
        segment.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.goToPage(index, true);
          }
        });
  
        this.progressBar.appendChild(segment);
        this.progressSegments.push(segment);
      });
    }
  
    updateProgress() {
      if (!this.progressSegments) return;
      this.progressSegments.forEach((seg, index) => {
        seg.classList.toggle('active', index <= this.currentIndex);
      });
    }
  
    onTouchStart(e) {
      if (this.isTransitioning) return;
      
      this.startX = e.touches[0].clientX;
      this.startY = e.touches[0].clientY;
      this.currentX = this.startX;
      this.currentY = this.startY;
      this.isDragging = true;
      this.dragDirection = null; // Reset direction until we can determine it
      this.wrapper.classList.add('dragging');
      this.container.style.transition = 'none';
    }
  
    onTouchMove(e) {
      if (!this.isDragging) return;
      
      this.currentX = e.touches[0].clientX;
      this.currentY = e.touches[0].clientY;
      
      const diffX = Math.abs(this.currentX - this.startX);
      const diffY = Math.abs(this.currentY - this.startY);
      
      // Determine direction on first significant movement
      if (this.dragDirection === null && (diffX > this.directionThreshold || diffY > this.directionThreshold)) {
        if (diffX > diffY) {
          this.dragDirection = 'horizontal';
        } else {
          this.dragDirection = 'vertical';
        }
      }
      
      // Only apply horizontal drag transform if horizontal movement detected
      if (this.dragDirection === 'horizontal') {
        e.preventDefault();
        this.updateDragPosition();
      }
    }
  
    onTouchEnd(e) {
      if (!this.isDragging) return;
      
      this.isDragging = false;
      this.wrapper.classList.remove('dragging');
      
      // Only handle swipe if it was a horizontal drag
      if (this.dragDirection === 'horizontal') {
        this.handleSwipeEnd();
      } else {
        // For vertical drags, just ensure container is at correct position
        this.container.style.transition = 'transform 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        this.container.style.transform = `translateX(${-this.currentIndex * 100}%)`;
        setTimeout(() => {
          this.isTransitioning = false;
        }, 200);
      }
      
      this.dragDirection = null;
    }
  
    onMouseDown(e) {
      if (this.isTransitioning) return;
      // Ignore if clicking on interactive elements
      if (e.target.closest('a, button, input, textarea, select, [role="button"], [role="tab"]')) return;
      
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.currentX = this.startX;
      this.currentY = this.startY;
      this.isDragging = true;
      this.dragDirection = null;
      this.wrapper.classList.add('dragging');
      this.container.style.transition = 'none';
      this.clickStartTime = Date.now();
    }
  
    onMouseMove(e) {
      if (!this.isDragging) return;
      
      this.currentX = e.clientX;
      this.currentY = e.clientY;
      
      const diffX = Math.abs(this.currentX - this.startX);
      const diffY = Math.abs(this.currentY - this.startY);
      
      // Determine direction on first significant movement
      if (this.dragDirection === null && (diffX > this.directionThreshold || diffY > this.directionThreshold)) {
        if (diffX > diffY) {
          this.dragDirection = 'horizontal';
        } else {
          this.dragDirection = 'vertical';
        }
      }
      
      // Only apply horizontal drag transform if horizontal movement detected
      if (this.dragDirection === 'horizontal') {
        this.updateDragPosition();
      }
    }
  
    onMouseUp(e) {
      if (!this.isDragging) return;
      
      this.isDragging = false;
      this.wrapper.classList.remove('dragging');
      
      // Check if it was a simple click (not a drag/swipe)
      const clickDuration = Date.now() - this.clickStartTime;
      const distance = Math.abs(this.currentX - this.startX);
      const isClick = clickDuration < 300 && distance < 10;
      
      // Only handle swipe if it was a horizontal drag
      if (this.dragDirection === 'horizontal') {
        this.handleSwipeEnd();
      } else if (isClick) {
        // Handle click navigation
        this.handleClick(e);
      } else {
        // For vertical drags, just ensure container is at correct position
        this.container.style.transition = 'transform 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        this.container.style.transform = `translateX(${-this.currentIndex * 100}%)`;
        setTimeout(() => {
          this.isTransitioning = false;
        }, 200);
      }
      
      this.dragDirection = null;
    }
  
    onKeyDown(e) {
      if (this.isTransitioning) return;
      // Don't navigate with arrow keys if an interactive element is focused
      if (this.isInteractiveElementFocused) return;
  
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.wrapper.classList.add('keyboard-nav');
        this.prevPage();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.wrapper.classList.add('keyboard-nav');
        this.nextPage();
      }
  
      setTimeout(() => this.wrapper.classList.remove('keyboard-nav'), 300);
    }
  
    updateDragPosition() {
      const diff = this.currentX - this.startX;
      const offset = -this.currentIndex * 100 + (diff / this.wrapper.offsetWidth) * 100;
      this.container.style.transform = `translateX(${offset}%)`;
    }
  
    handleSwipeEnd() {
      const diff = this.currentX - this.startX;
      const distance = Math.abs(diff);
      const threshold = this.wrapper.offsetWidth * 0.25; // 25% of screen width
  
      let targetIndex = this.currentIndex;
  
      if (distance > threshold) {
        if (diff > 0) {
          // Swiped right -> go to previous page
          targetIndex = Math.max(0, this.currentIndex - 1);
        } else {
          // Swiped left -> go to next page
          targetIndex = Math.min(this.pages.length - 1, this.currentIndex + 1);
        }
      }
  
      // Always animate back to target page (even if same index)
      this.goToPage(targetIndex, true);
    }
  
    handleClick(e) {
      // Don't navigate if interactive element is focused
      if (this.isInteractiveElementFocused) return;
      
      // Check if click is on the left or right side of the screen
      const clickX = e.clientX;
      const screenWidth = this.wrapper.offsetWidth;
      const midPoint = screenWidth / 2;
  
      if (clickX < midPoint) {
        // Clicked on left side -> go to previous page
        this.prevPage();
      } else {
        // Clicked on right side -> go to next page
        this.nextPage();
      }
    }
  
    prevPage() {
      const targetIndex = Math.max(0, this.currentIndex - 1);
      this.goToPage(targetIndex, true);
    }
  
    nextPage() {
      const targetIndex = Math.min(this.pages.length - 1, this.currentIndex + 1);
      this.goToPage(targetIndex, true);
    }
  
    goToPage(index, animate = true) {
      index = Math.max(0, Math.min(index, this.pages.length - 1));
  
      this.currentIndex = index;
      this.isTransitioning = true;
  
      // Always set transition, even if animating to same page (for snap-back)
      this.container.style.transition = animate 
        ? 'transform 350ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        : 'none';
  
      this.container.style.transform = `translateX(${-index * 100}%)`;
  
      this.updateProgress();
  
      const duration = animate ? 350 : 0;
      setTimeout(() => {
        this.isTransitioning = false;
      }, duration);
    }
  
    getCurrentIndex() {
      return this.currentIndex;
    }
  
    getTotalPages() {
      return this.pages.length;
    }
  
    onFocusIn(e) {
      // Check if focused element is interactive
      const interactiveSelectors = 'a, button, input, textarea, select, [role="button"], [role="tab"], [contenteditable="true"]';
      if (e.target.closest(interactiveSelectors)) {
        this.isInteractiveElementFocused = true;
      }
    }
  
    onFocusOut(e) {
      // Check if the element that lost focus was interactive
      const interactiveSelectors = 'a, button, input, textarea, select, [role="button"], [role="tab"], [contenteditable="true"]';
      if (e.target.closest(interactiveSelectors)) {
        this.isInteractiveElementFocused = false;
      }
    }
  
    destroy() {
      this.wrapper.removeEventListener('touchstart', this._onTouchStart);
      this.wrapper.removeEventListener('touchmove', this._onTouchMove);
      this.wrapper.removeEventListener('touchend', this._onTouchEnd);
      this.wrapper.removeEventListener('mousedown', this._onMouseDown);
      document.removeEventListener('mousemove', this._onMouseMove);
      document.removeEventListener('mouseup', this._onMouseUp);
      document.removeEventListener('keydown', this._onKeyDown);
      document.removeEventListener('focusin', this._onFocusIn);
      document.removeEventListener('focusout', this._onFocusOut);
    }
  }
  
  // Auto-initialize if DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.pagesSystem = new PagesSystem();
    });
  } else {
    window.pagesSystem = new PagesSystem();
  }
  /**
 * HTTP Request Builder
 * Safe educational tool for sending HTTP requests from the browser
 */

class HTTPRequestBuilder {
    constructor() {
      // Form elements
      this.methodSelect = document.getElementById('req-method');
      this.urlInput = document.getElementById('req-url');
      this.headersTextarea = document.getElementById('req-headers');
      this.bodyTextarea = document.getElementById('req-body');
      this.bodyGroup = document.getElementById('req-body-group');
      this.sendBtn = document.getElementById('req-send');
  
      // Result elements
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
      // Show body field only for methods that typically have body
      this.methodSelect.addEventListener('change', () => this.updateBodyFieldVisibility());
      this.sendBtn.addEventListener('click', () => this.sendRequest());
  
      // Allow Enter to send if focused on URL
      this.urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
          this.sendRequest();
        }
      });
  
      // Обработка примеров
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
      
      // Автоматически отправляем запрос
      setTimeout(() => this.sendRequest(), 100);
    }
  
    updateBodyFieldVisibility() {
      const method = this.methodSelect.value;
      const shouldShowBody = ['POST', 'PUT', 'PATCH'].includes(method);
      this.bodyGroup.style.display = shouldShowBody ? 'block' : 'none';
    }
  
    /**
     * Validate URL for security
     */
    validateUrl(url) {
      try {
        const urlObj = new URL(url);
        
        // Security warnings
        const warnings = [];
  
        // Warn about localhost
        if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
          warnings.push('⚠️ Это localhost. Убедись, что сервер запущен локально.');
        }
  
        // Warn about private IP ranges
        if (this.isPrivateIP(urlObj.hostname)) {
          warnings.push('⚠️ Это приватный IP-адрес. Запрос может быть заблокирован браузером.');
        }
  
        // Warn about HTTP
        if (urlObj.protocol === 'http:') {
          warnings.push('⚠️ Это HTTP (незащищённый). Используй HTTPS для чувствительных данных.');
        }
  
        if (warnings.length > 0) {
          console.warn('URL warnings:', warnings.join('\n'));
        }
  
        return true;
      } catch (e) {
        throw new Error(`Неверный URL: ${e.message}`);
      }
    }
  
    /**
     * Check if hostname is a private IP
     */
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
  
    /**
     * Parse headers from textarea
     */
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
  
    /**
     * Show error message
     */
    showError(message) {
      this.hideResults();
      this.errorDiv.style.display = 'block';
      this.errorText.textContent = message;
      this.loadingDiv.style.display = 'none';
    }
  
    /**
     * Hide all result sections
     */
    hideResults() {
      this.resultDiv.style.display = 'none';
      this.errorDiv.style.display = 'none';
      this.loadingDiv.style.display = 'none';
    }
  
    /**
     * Format JSON for display
     */
    formatJSON(jsonString) {
      try {
        const obj = JSON.parse(jsonString);
        return JSON.stringify(obj, null, 2);
      } catch {
        // Not JSON, return as is
        return jsonString;
      }
    }
  
    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  
    /**
     * Build readable header string from object
     */
    formatHeaders(headers) {
      let result = '';
      for (const [key, value] of Object.entries(headers)) {
        result += `<div><strong>${this.escapeHtml(key)}:</strong> ${this.escapeHtml(String(value))}</div>`;
      }
      return result || '<p><em>Нет заголовков</em></p>';
    }
  
    /**
     * Send HTTP request
     */
    async sendRequest() {
      this.hideResults();
      this.loadingDiv.style.display = 'block';
      this.sendBtn.disabled = true;
  
      try {
        // Validate URL
        const url = this.urlInput.value.trim();
        if (!url) {
          throw new Error('Введи URL');
        }
        this.validateUrl(url);
  
        // Get method and body
        const method = this.methodSelect.value;
        let body = null;
        if (['POST', 'PUT', 'PATCH'].includes(method)) {
          const bodyText = this.bodyTextarea.value.trim();
          if (bodyText) {
            body = bodyText;
          }
        }
  
        // Parse headers
        const customHeaders = this.parseHeaders(this.headersTextarea.value);
  
        // Prepare fetch options
        const fetchOptions = {
          method,
          headers: customHeaders,
          mode: 'cors',
          timeout: 10000, // 10 second timeout
        };
  
        if (body) {
          fetchOptions.body = body;
  
          // Auto-detect content-type if not set
          if (!customHeaders['Content-Type']) {
            if (body.trim().startsWith('{') || body.trim().startsWith('[')) {
              fetchOptions.headers['Content-Type'] = 'application/json';
            }
          }
        }
  
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        fetchOptions.signal = controller.signal;
  
        // Send request
        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);
  
        // Get response body as text first
        const responseText = await response.text();
  
        // Format response
        this.loadingDiv.style.display = 'none';
        this.resultDiv.style.display = 'block';
  
        // Status
        this.statusCode.textContent = `${response.status} ${response.statusText}`;
        this.statusCode.className = response.ok ? 'status-ok' : 'status-error';
  
        // Headers
        const responseHeadersObj = {};
        for (const [key, value] of response.headers) {
          responseHeadersObj[key] = value;
        }
        this.responseHeaders.innerHTML = this.formatHeaders(responseHeadersObj);
  
        // Body
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
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.httpRequestBuilder = new HTTPRequestBuilder();
    });
  } else {
    window.httpRequestBuilder = new HTTPRequestBuilder();
  }
  