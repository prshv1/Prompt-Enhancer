// Encryption utilities for Prompt Enhancer extension

class EncryptionUtils {
    constructor() {
        this.algorithm = 'AES-GCM';
        this.keyLength = 256;
    }

    // Generate a random key for encryption
    async generateKey() {
        return await crypto.subtle.generateKey(
            {
                name: this.algorithm,
                length: this.keyLength
            },
            true,
            ['encrypt', 'decrypt']
        );
    }

    // Derive a key from a password using PBKDF2
    async deriveKey(password, salt) {
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveBits', 'deriveKey']
        );

        return await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            {
                name: this.algorithm,
                length: this.keyLength
            },
            true,
            ['encrypt', 'decrypt']
        );
    }

    // Encrypt data using AES-GCM
    async encrypt(data, password = null) {
        try {
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(data);

            // Generate a random salt and IV
            const salt = crypto.getRandomValues(new Uint8Array(16));
            const iv = crypto.getRandomValues(new Uint8Array(12));

            // Use a default password if none provided (for extension context)
            const encryptionPassword = password || await this.getExtensionKey();
            
            // Derive key from password
            const key = await this.deriveKey(encryptionPassword, salt);

            // Encrypt the data
            const encryptedData = await crypto.subtle.encrypt(
                {
                    name: this.algorithm,
                    iv: iv
                },
                key,
                dataBuffer
            );

            // Combine salt, iv, and encrypted data
            const result = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
            result.set(salt, 0);
            result.set(iv, salt.length);
            result.set(new Uint8Array(encryptedData), salt.length + iv.length);

            // Convert to base64 for storage
            return this.arrayBufferToBase64(result);
        } catch (error) {
            console.error('Encryption error:', error);
            throw new Error('Failed to encrypt data');
        }
    }

    // Decrypt data using AES-GCM
    async decrypt(encryptedData, password = null) {
        try {
            // Convert from base64
            const dataBuffer = this.base64ToArrayBuffer(encryptedData);
            const data = new Uint8Array(dataBuffer);

            // Extract salt, iv, and encrypted data
            const salt = data.slice(0, 16);
            const iv = data.slice(16, 28);
            const encrypted = data.slice(28);

            // Use a default password if none provided (for extension context)
            const encryptionPassword = password || await this.getExtensionKey();
            
            // Derive key from password
            const key = await this.deriveKey(encryptionPassword, salt);

            // Decrypt the data
            const decryptedData = await crypto.subtle.decrypt(
                {
                    name: this.algorithm,
                    iv: iv
                },
                key,
                encrypted
            );

            // Convert back to string
            const decoder = new TextDecoder();
            return decoder.decode(decryptedData);
        } catch (error) {
            console.error('Decryption error:', error);
            throw new Error('Failed to decrypt data');
        }
    }

    // Get a unique key for this extension instance
    async getExtensionKey() {
        // Use extension ID and a fixed string to create a consistent key
        const extensionId = chrome.runtime.id || 'prompt-enhancer-extension';
        return `${extensionId}-encryption-key-2024`;
    }

    // Convert ArrayBuffer to base64
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    // Convert base64 to ArrayBuffer
    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    // Validate encrypted data format
    isValidEncryptedData(data) {
        try {
            if (typeof data !== 'string') return false;
            
            // Try to decode base64
            const decoded = this.base64ToArrayBuffer(data);
            
            // Check minimum length (salt + iv + some encrypted data)
            return decoded.byteLength >= 32;
        } catch (error) {
            return false;
        }
    }
}

// Create a global instance
const encryptionUtils = new EncryptionUtils();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EncryptionUtils;
}

