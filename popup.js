// Popup JavaScript for Prompt Enhancer extension

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('settingsForm');
    const productKeyInput = document.getElementById('productKey');
    const whitelistedDomainsInput = document.getElementById('whitelistedDomains');
    const saveBtn = document.getElementById('saveBtn');
    const testBtn = document.getElementById('testBtn');
    const statusMessage = document.getElementById('statusMessage');
    const howItWorksBtn = document.getElementById('howItWorksBtn');
    const howItWorksContent = document.getElementById('howItWorksContent');
    const darkModeSwitch = document.getElementById('darkModeSwitch');
    const iconSun = darkModeSwitch.querySelector('.icon-sun');
    const iconMoon = darkModeSwitch.querySelector('.icon-moon');
    const keyStrength = document.getElementById('keyStrength');
    const statusIcon = document.getElementById('statusIcon');
    const statusText = document.getElementById('statusText');

    // Load saved settings
    loadSettings();

    // Event listeners
    form.addEventListener('submit', handleSave);
    testBtn.addEventListener('click', handleTest);
    
    // Add real-time validation
    productKeyInput.addEventListener('input', validateProductKeyInput);
    whitelistedDomainsInput.addEventListener('input', validateDomainsInput);
    
    // Collapsible How it Works
    howItWorksBtn.addEventListener('click', function() {
        howItWorksBtn.classList.toggle('active');
        howItWorksContent.classList.toggle('open');
        const arrow = howItWorksBtn.querySelector('.arrow');
        if (howItWorksContent.classList.contains('open')) {
            howItWorksContent.style.maxHeight = howItWorksContent.scrollHeight + 'px';
            arrow.textContent = '▲';
        } else {
            howItWorksContent.style.maxHeight = '0px';
            arrow.textContent = '▼';
        }
    });
    // On load, ensure maxHeight is set correctly
    if (howItWorksContent.classList.contains('open')) {
        howItWorksContent.style.maxHeight = howItWorksContent.scrollHeight + 'px';
    } else {
        howItWorksContent.style.maxHeight = '0px';
    }

    // Dark mode toggle (button with sun/moon icons)
    function setDarkMode(enabled) {
        if (enabled) {
            document.body.classList.add('dark');
            localStorage.setItem('pe_dark_mode', '1');
            iconSun.style.display = 'none';
            iconMoon.style.display = 'inline';
        } else {
            document.body.classList.remove('dark');
            localStorage.setItem('pe_dark_mode', '0');
            iconSun.style.display = 'inline';
            iconMoon.style.display = 'none';
        }
    }
    darkModeSwitch.addEventListener('click', function() {
        const isDark = document.body.classList.contains('dark');
        setDarkMode(!isDark);
    });
    // On load, set dark mode from localStorage
    if (localStorage.getItem('pe_dark_mode') === '1') {
        setDarkMode(true);
    } else {
        setDarkMode(false);
    }

    // API key strength indicator
    function updateKeyStrength() {
        const value = productKeyInput.value.trim();
        let strength = 'weak';
        let label = 'Weak';
        if (value.length > 24 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /[0-9]/.test(value)) {
            strength = 'strong';
            label = 'Strong';
        } else if (value.length > 16) {
            strength = 'medium';
            label = 'Medium';
        }
        keyStrength.className = 'key-strength ' + strength;
        keyStrength.textContent = value ? label : '';
    }
    productKeyInput.addEventListener('input', updateKeyStrength);
    updateKeyStrength();

    // Tooltip for product key
    const tooltip = document.querySelector('.tooltip');
    tooltip.addEventListener('mouseenter', function() {
        tooltip.setAttribute('aria-label', tooltip.title);
    });

    // Real-time validation functions
    function validateProductKeyInput() {
        const value = productKeyInput.value.trim();
        const validation = ValidationUtils.validateApiKey(value);
        
        updateInputValidation(productKeyInput, validation);
    }
    
    function validateDomainsInput() {
        const value = whitelistedDomainsInput.value.trim();
        const validation = ValidationUtils.validateDomainList(value);
        
        updateInputValidation(whitelistedDomainsInput, validation);
    }
    
    function updateInputValidation(input, validation) {
        const hintElement = input.parentNode.querySelector('.input-hint');
        
        if (validation.valid) {
            input.style.borderColor = '#10b981';
            if (hintElement) {
                hintElement.style.color = '#10b981';
                hintElement.textContent = validation.message;
            }
        } else {
            input.style.borderColor = '#ef4444';
            if (hintElement) {
                hintElement.style.color = '#ef4444';
                hintElement.textContent = validation.message;
            }
        }
    }

    // Load settings from storage
    async function loadSettings() {
        try {
            // Try to get from secure storage first
            const productKey = await secureStorage.getSecure('productKey');
            const whitelistedDomains = await secureStorage.getRegular('whitelistedDomains');
            
            if (productKey) {
                productKeyInput.value = productKey;
            }
            
            if (whitelistedDomains) {
                whitelistedDomainsInput.value = whitelistedDomains;
            }

            // Migrate old data if exists
            await migrateOldData();
        } catch (error) {
            console.error('Error loading settings:', error);
            showStatus('Error loading settings', 'error');
        }
    }

    // Migrate old unencrypted data to secure storage
    async function migrateOldData() {
        try {
            const result = await chrome.storage.sync.get(['productKey']);
            if (result.productKey && typeof result.productKey === 'string') {
                // Check if it's old base64 encoded data
                try {
                    const decoded = atob(result.productKey);
                    if (decoded) {
                        // Migrate to secure storage
                        await secureStorage.setSecure('productKey', decoded);
                        await chrome.storage.sync.remove(['productKey']);
                        console.log('Migrated old product key to secure storage');
                    }
                } catch (e) {
                    // Not base64, might be already encrypted or invalid
                }
            }
        } catch (error) {
            console.error('Error migrating old data:', error);
        }
    }

    // Handle form submission
    async function handleSave(event) {
        event.preventDefault();
        
        const productKey = productKeyInput.value.trim();
        const whitelistedDomains = whitelistedDomainsInput.value.trim();

        // Validate API key
        const keyValidation = ValidationUtils.validateApiKey(productKey);
        if (!keyValidation.valid) {
            showStatus(keyValidation.message, 'error');
            productKeyInput.focus();
            return;
        }

        // Validate domains
        const domainValidation = ValidationUtils.validateDomainList(whitelistedDomains);
        if (!domainValidation.valid) {
            showStatus(domainValidation.message, 'error');
            whitelistedDomainsInput.focus();
            return;
        }

        try {
            setButtonLoading(saveBtn, true);

            // Sanitize inputs
            const sanitizedKey = ValidationUtils.sanitizeInput(productKey);
            const sanitizedDomains = ValidationUtils.sanitizeInput(whitelistedDomains);

            // Save product key securely and domains regularly
            await secureStorage.setSecure('productKey', sanitizedKey);
            await secureStorage.setRegular('whitelistedDomains', sanitizedDomains);

            showStatus('Settings saved successfully!', 'success');
            
            // Notify content scripts about updated settings
            notifyContentScripts();
            
        } catch (error) {
            console.error('Error saving settings:', error);
            showStatus('Error saving settings: ' + error.message, 'error');
        } finally {
            setButtonLoading(saveBtn, false);
        }
    }

    // Handle test connection
    async function handleTest(event) {
        event.preventDefault();
        
        const productKey = productKeyInput.value.trim();
        
        if (!productKey) {
            showStatus('Please enter a product key first', 'error');
            return;
        }

        try {
            setButtonLoading(testBtn, true);
            
            const testPrompt = "Hello, this is a test prompt.";
            const response = await testApiConnection(productKey, testPrompt);
            
            if (response.success) {
                showStatus('Connection successful! API is working.', 'success');
            } else {
                showStatus(`Connection failed: ${response.error}`, 'error');
            }
            
        } catch (error) {
            console.error('Error testing connection:', error);
            showStatus('Connection test failed', 'error');
        } finally {
            setButtonLoading(testBtn, false);
        }
    }

    // Test API connection
    async function testApiConnection(productKey, testPrompt) {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({
                action: 'enhancePrompt',
                prompt: testPrompt,
                productKey: productKey
            }, (response) => {
                resolve(response);
            });
        });
    }

    // Validate domain list
    function validateDomains(domainsString) {
        if (!domainsString.trim()) return true; // Empty is valid
        
        const domains = domainsString.split(',').map(d => d.trim()).filter(d => d);
        const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        
        return domains.every(domain => {
            // Allow wildcards for subdomains
            if (domain.startsWith('*.')) {
                return domainRegex.test(domain.substring(2));
            }
            return domainRegex.test(domain);
        });
    }

    // Enhanced status message with icon
    function showStatus(message, type) {
        statusMessage.className = `status-message ${type}`;
        statusIcon.textContent = type === 'success' ? '✔️' : '❌';
        statusText.textContent = message;
        statusMessage.style.display = 'flex';
        setTimeout(() => {
            statusMessage.className = 'status-message hidden';
            statusMessage.style.display = 'none';
        }, 5000);
    }

    // Set button loading state
    function setButtonLoading(button, loading) {
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    // Notify content scripts about updated settings
    function notifyContentScripts() {
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'settingsUpdated'
                }).catch(() => {
                    // Ignore errors for tabs that don't have content script
                });
            });
        });
    }
});

// Handle keyboard shortcuts
document.addEventListener('keydown', function(event) {
    if (event.ctrlKey || event.metaKey) {
        if (event.key === 's') {
            event.preventDefault();
            document.getElementById('settingsForm').dispatchEvent(new Event('submit'));
        }
    }
});

