// Content script for Prompt Enhancer extension

class PromptEnhancer {
    constructor() {
        this.isActive = false;
        this.whitelistedDomains = [];
        this.enhanceButtons = new Map();
        this.observer = null;
        this.currentDomain = window.location.hostname;
        
        this.init();
    }

    async init() {
        // Load settings and check if extension should be active on this domain
        await this.loadSettings();
        
        if (this.isActive) {
            this.injectStyles();
            this.scanForTextElements();
            this.setupMutationObserver();
            this.setupMessageListener();
        }
    }

    async loadSettings() {
        try {
            // Get whitelisted domains from storage
            const result = await chrome.storage.sync.get(['whitelistedDomains']);
            const domainsString = result.whitelistedDomains || '';
            
            this.whitelistedDomains = domainsString
                .split(',')
                .map(domain => domain.trim())
                .filter(domain => domain.length > 0);

            // Check if current domain is whitelisted
            this.isActive = this.isDomainWhitelisted(this.currentDomain);
            
            console.log('Prompt Enhancer:', this.isActive ? 'Active' : 'Inactive', 'on', this.currentDomain);
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    isDomainWhitelisted(domain) {
        if (this.whitelistedDomains.length === 0) {
            return false; // No domains whitelisted
        }

        return this.whitelistedDomains.some(whitelistedDomain => {
            // Handle wildcard subdomains
            if (whitelistedDomain.startsWith('*.')) {
                const baseDomain = whitelistedDomain.substring(2);
                return domain === baseDomain || domain.endsWith('.' + baseDomain);
            }
            
            // Exact match or subdomain match
            return domain === whitelistedDomain || domain.endsWith('.' + whitelistedDomain);
        });
    }

    injectStyles() {
        const styleId = 'prompt-enhancer-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .pe-enhance-button {
                position: absolute;
                background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                color: white;
                border: none;
                border-radius: 6px;
                padding: 6px 12px;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                z-index: 10000;
                box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
                transition: all 0.2s ease;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                align-items: center;
                gap: 4px;
                min-width: 100px;
                justify-content: center;
            }

            .pe-enhance-button:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
                background: linear-gradient(135deg, #5b52e8 0%, #8b46f0 100%);
            }

            .pe-enhance-button:active {
                transform: translateY(0);
            }

            .pe-enhance-button:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
            }

            .pe-enhance-button.loading {
                color: transparent;
                position: relative;
            }

            .pe-enhance-button.loading::after {
                content: '';
                position: absolute;
                width: 14px;
                height: 14px;
                border: 2px solid transparent;
                border-top: 2px solid white;
                border-radius: 50%;
                animation: pe-spin 1s linear infinite;
            }

            @keyframes pe-spin {
                to { transform: rotate(360deg); }
            }

            .pe-enhance-icon {
                width: 14px;
                height: 14px;
                fill: currentColor;
            }

            .pe-toast {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 12px 16px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                z-index: 10001;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                max-width: 300px;
                animation: pe-slideIn 0.3s ease;
            }

            .pe-toast.error {
                border-color: #fecaca;
                background: #fef2f2;
                color: #dc2626;
            }

            .pe-toast.success {
                border-color: #bbf7d0;
                background: #dcfce7;
                color: #166534;
            }

            @keyframes pe-slideIn {
                from {
                    opacity: 0;
                    transform: translateX(100%);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    scanForTextElements() {
        // Find all text input elements
        const textElements = this.findTextElements();
        
        textElements.forEach(element => {
            this.addEnhanceButton(element);
        });
    }

    findTextElements() {
        const selectors = [
            'textarea',
            'input[type="text"]',
            'input[type="search"]',
            '[contenteditable="true"]',
            '[contenteditable=""]',
            '.ql-editor', // Quill editor
            '.CodeMirror-code', // CodeMirror
            '.monaco-editor', // Monaco editor
            '[data-testid*="text"]',
            '[role="textbox"]'
        ];

        const elements = [];
        
        selectors.forEach(selector => {
            const found = document.querySelectorAll(selector);
            found.forEach(element => {
                if (this.isValidTextElement(element)) {
                    elements.push(element);
                }
            });
        });

        return elements;
    }

    isValidTextElement(element) {
        // Skip if already has a button
        if (this.enhanceButtons.has(element)) return false;
        
        // Skip if element is too small
        const rect = element.getBoundingClientRect();
        if (rect.width < 100 || rect.height < 30) return false;
        
        // Skip if element is hidden
        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        
        // Skip if element is readonly or disabled
        if (element.readOnly || element.disabled) return false;
        
        // Skip password fields
        if (element.type === 'password') return false;
        
        return true;
    }

    addEnhanceButton(textElement) {
        const button = document.createElement('button');
        button.className = 'pe-enhance-button';
        button.innerHTML = `
            <svg class="pe-enhance-icon" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Enhance
        `;
        
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleEnhanceClick(textElement, button);
        });

        // Position the button
        this.positionButton(button, textElement);
        
        // Store the relationship
        this.enhanceButtons.set(textElement, button);
        
        // Add to DOM
        document.body.appendChild(button);
        
        // Update position on scroll/resize
        this.setupPositionUpdater(button, textElement);
    }

    positionButton(button, textElement) {
        const rect = textElement.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        button.style.top = (rect.top + scrollTop - 35) + 'px';
        button.style.left = (rect.right + scrollLeft - 110) + 'px';
    }

    setupPositionUpdater(button, textElement) {
        const updatePosition = () => {
            if (!document.body.contains(textElement)) {
                // Element was removed, clean up
                this.removeEnhanceButton(textElement);
                return;
            }
            
            this.positionButton(button, textElement);
        };

        // Update on scroll and resize
        window.addEventListener('scroll', updatePosition, { passive: true });
        window.addEventListener('resize', updatePosition, { passive: true });
        
        // Store cleanup function
        button._cleanup = () => {
            window.removeEventListener('scroll', updatePosition);
            window.removeEventListener('resize', updatePosition);
        };
    }

    async handleEnhanceClick(textElement, button) {
        const originalText = this.getTextContent(textElement);
        
        // Validate prompt using ValidationUtils if available
        if (typeof ValidationUtils !== 'undefined') {
            const validation = ValidationUtils.validatePrompt(originalText);
            if (!validation.valid) {
                this.showToast(validation.message, 'error');
                return;
            }
        } else if (!originalText.trim()) {
            this.showToast('Please enter some text first', 'error');
            return;
        }

        try {
            // Set loading state
            button.classList.add('loading');
            button.disabled = true;

            // Get product key from storage
            const productKey = await this.getProductKey();
            if (!productKey) {
                this.showToast('Please configure your API key in the extension popup', 'error');
                return;
            }

            // Send message to background script
            const response = await this.sendMessage({
                action: 'enhancePrompt',
                prompt: originalText,
                productKey: productKey
            });

            if (response.success) {
                this.setTextContent(textElement, response.enhancedPrompt);
                this.showToast('Prompt enhanced successfully!', 'success');
            } else {
                this.showToast(response.error || 'Enhancement failed', 'error');
            }

        } catch (error) {
            console.error('Enhancement error:', error);
            this.showToast('Enhancement failed—please try again', 'error');
        } finally {
            // Remove loading state
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    getTextContent(element) {
        if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
            return element.value;
        } else if (element.contentEditable === 'true') {
            return element.textContent || element.innerText;
        }
        return '';
    }

    setTextContent(element, text) {
        if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
            element.value = text;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
        } else if (element.contentEditable === 'true') {
            element.textContent = text;
            element.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    async getProductKey() {
        try {
            const response = await this.sendMessage({ action: 'getProductKey' });
            if (response.success) {
                return response.productKey;
            } else {
                throw new Error(response.error || 'Failed to get product key');
            }
        } catch (error) {
            console.error('Error getting product key:', error);
            return null;
        }
    }

    sendMessage(message) {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage(message, resolve);
        });
    }

    showToast(message, type = 'info') {
        // Remove existing toast
        const existingToast = document.querySelector('.pe-toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `pe-toast ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 4000);
    }

    removeEnhanceButton(textElement) {
        const button = this.enhanceButtons.get(textElement);
        if (button) {
            if (button._cleanup) {
                button._cleanup();
            }
            if (button.parentNode) {
                button.remove();
            }
            this.enhanceButtons.delete(textElement);
        }
    }

    setupMutationObserver() {
        this.observer = new MutationObserver((mutations) => {
            let shouldScan = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            shouldScan = true;
                        }
                    });
                }
            });
            
            if (shouldScan) {
                // Debounce scanning
                clearTimeout(this.scanTimeout);
                this.scanTimeout = setTimeout(() => {
                    this.scanForTextElements();
                }, 500);
            }
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'settingsUpdated') {
                this.loadSettings().then(() => {
                    if (this.isActive) {
                        this.scanForTextElements();
                    } else {
                        this.cleanup();
                    }
                });
            }
        });
    }

    cleanup() {
        // Remove all buttons
        this.enhanceButtons.forEach((button, textElement) => {
            this.removeEnhanceButton(textElement);
        });
        
        // Disconnect observer
        if (this.observer) {
            this.observer.disconnect();
        }
        
        // Remove styles
        const style = document.getElementById('prompt-enhancer-styles');
        if (style) {
            style.remove();
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new PromptEnhancer();
    });
} else {
    new PromptEnhancer();
}

