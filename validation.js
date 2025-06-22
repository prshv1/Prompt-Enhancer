// Validation utilities for Prompt Enhancer extension

class ValidationUtils {
    // Validate API key format
    static validateApiKey(apiKey) {
        if (!apiKey || typeof apiKey !== 'string') {
            return { valid: false, message: 'API key is required' };
        }

        const trimmed = apiKey.trim();
        if (trimmed.length === 0) {
            return { valid: false, message: 'API key cannot be empty' };
        }

        if (trimmed.length < 10) {
            return { valid: false, message: 'API key appears to be too short' };
        }

        if (trimmed.length > 200) {
            return { valid: false, message: 'API key appears to be too long' };
        }

        // Check for common patterns that indicate invalid keys
        if (trimmed.includes(' ') || trimmed.includes('\n') || trimmed.includes('\t')) {
            return { valid: false, message: 'API key should not contain spaces or line breaks' };
        }

        return { valid: true, message: 'API key format is valid' };
    }

    // Validate domain list
    static validateDomainList(domainsString) {
        if (!domainsString || typeof domainsString !== 'string') {
            return { valid: true, message: 'No domains specified', domains: [] };
        }

        const trimmed = domainsString.trim();
        if (trimmed.length === 0) {
            return { valid: true, message: 'No domains specified', domains: [] };
        }

        const domains = trimmed.split(',').map(d => d.trim()).filter(d => d.length > 0);
        const invalidDomains = [];
        const validDomains = [];

        const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

        domains.forEach(domain => {
            let testDomain = domain;
            
            // Handle wildcard subdomains
            if (domain.startsWith('*.')) {
                testDomain = domain.substring(2);
            }

            if (domainRegex.test(testDomain)) {
                validDomains.push(domain);
            } else {
                invalidDomains.push(domain);
            }
        });

        if (invalidDomains.length > 0) {
            return {
                valid: false,
                message: `Invalid domains: ${invalidDomains.join(', ')}`,
                domains: validDomains,
                invalidDomains
            };
        }

        return {
            valid: true,
            message: `${validDomains.length} valid domain(s)`,
            domains: validDomains
        };
    }

    // Validate prompt text
    static validatePrompt(prompt) {
        if (!prompt || typeof prompt !== 'string') {
            return { valid: false, message: 'Prompt is required' };
        }

        const trimmed = prompt.trim();
        if (trimmed.length === 0) {
            return { valid: false, message: 'Prompt cannot be empty' };
        }

        if (trimmed.length < 3) {
            return { valid: false, message: 'Prompt is too short (minimum 3 characters)' };
        }

        if (trimmed.length > 4000) {
            return { valid: false, message: 'Prompt is too long (maximum 4000 characters)' };
        }

        // Check for potentially problematic content
        const suspiciousPatterns = [
            /^[\s\n\r]*$/,  // Only whitespace
            /(.)\1{50,}/,   // Repeated characters
        ];

        for (const pattern of suspiciousPatterns) {
            if (pattern.test(trimmed)) {
                return { valid: false, message: 'Prompt contains invalid patterns' };
            }
        }

        return { valid: true, message: 'Prompt is valid' };
    }

    // Sanitize input text
    static sanitizeInput(input) {
        if (!input || typeof input !== 'string') {
            return '';
        }

        return input
            .trim()
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
            .replace(/\s+/g, ' '); // Normalize whitespace
    }

    // Check if extension has required permissions
    static async checkPermissions() {
        try {
            const hasStorage = await chrome.permissions.contains({ permissions: ['storage'] });
            const hasActiveTab = await chrome.permissions.contains({ permissions: ['activeTab'] });
            
            return {
                valid: hasStorage && hasActiveTab,
                storage: hasStorage,
                activeTab: hasActiveTab
            };
        } catch (error) {
            console.error('Error checking permissions:', error);
            return { valid: false, error: error.message };
        }
    }

    // Validate extension environment
    static validateEnvironment() {
        const issues = [];

        // Check if running in extension context
        if (!chrome || !chrome.runtime) {
            issues.push('Not running in Chrome extension context');
        }

        // Check if required APIs are available
        if (!chrome.storage) {
            issues.push('Chrome storage API not available');
        }

        if (!chrome.runtime.sendMessage) {
            issues.push('Chrome messaging API not available');
        }

        // Check if crypto API is available for encryption
        if (!crypto || !crypto.subtle) {
            issues.push('Web Crypto API not available');
        }

        return {
            valid: issues.length === 0,
            issues: issues
        };
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ValidationUtils;
}

