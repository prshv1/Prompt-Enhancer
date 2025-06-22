// Secure storage utilities for Prompt Enhancer extension

class SecureStorage {
    constructor() {
        this.encryptionUtils = new EncryptionUtils();
        this.storagePrefix = 'pe_secure_';
    }

    // Securely store encrypted data
    async setSecure(key, value) {
        try {
            if (value === null || value === undefined) {
                return await this.removeSecure(key);
            }

            const encryptedValue = await this.encryptionUtils.encrypt(String(value));
            const storageKey = this.storagePrefix + key;
            
            await chrome.storage.sync.set({
                [storageKey]: {
                    encrypted: true,
                    data: encryptedValue,
                    timestamp: Date.now()
                }
            });

            return true;
        } catch (error) {
            console.error('Error storing secure data:', error);
            throw new Error(`Failed to store secure data for key: ${key}`);
        }
    }

    // Retrieve and decrypt stored data
    async getSecure(key) {
        try {
            const storageKey = this.storagePrefix + key;
            const result = await chrome.storage.sync.get([storageKey]);
            const storedData = result[storageKey];

            if (!storedData) {
                return null;
            }

            if (!storedData.encrypted || !storedData.data) {
                console.warn('Invalid secure storage format for key:', key);
                return null;
            }

            const decryptedValue = await this.encryptionUtils.decrypt(storedData.data);
            return decryptedValue;
        } catch (error) {
            console.error('Error retrieving secure data:', error);
            // Return null instead of throwing to handle corrupted data gracefully
            return null;
        }
    }

    // Remove secure data
    async removeSecure(key) {
        try {
            const storageKey = this.storagePrefix + key;
            await chrome.storage.sync.remove([storageKey]);
            return true;
        } catch (error) {
            console.error('Error removing secure data:', error);
            throw new Error(`Failed to remove secure data for key: ${key}`);
        }
    }

    // Store regular (non-encrypted) data
    async setRegular(key, value) {
        try {
            await chrome.storage.sync.set({ [key]: value });
            return true;
        } catch (error) {
            console.error('Error storing regular data:', error);
            throw new Error(`Failed to store data for key: ${key}`);
        }
    }

    // Retrieve regular (non-encrypted) data
    async getRegular(key) {
        try {
            const result = await chrome.storage.sync.get([key]);
            return result[key] || null;
        } catch (error) {
            console.error('Error retrieving regular data:', error);
            return null;
        }
    }

    // Remove regular data
    async removeRegular(key) {
        try {
            await chrome.storage.sync.remove([key]);
            return true;
        } catch (error) {
            console.error('Error removing regular data:', error);
            throw new Error(`Failed to remove data for key: ${key}`);
        }
    }

    // Get all stored keys (both secure and regular)
    async getAllKeys() {
        try {
            const allData = await chrome.storage.sync.get(null);
            return {
                secure: Object.keys(allData).filter(key => key.startsWith(this.storagePrefix)),
                regular: Object.keys(allData).filter(key => !key.startsWith(this.storagePrefix))
            };
        } catch (error) {
            console.error('Error getting all keys:', error);
            return { secure: [], regular: [] };
        }
    }

    // Clear all secure data
    async clearSecureData() {
        try {
            const keys = await this.getAllKeys();
            if (keys.secure.length > 0) {
                await chrome.storage.sync.remove(keys.secure);
            }
            return true;
        } catch (error) {
            console.error('Error clearing secure data:', error);
            throw new Error('Failed to clear secure data');
        }
    }

    // Validate storage integrity
    async validateStorage() {
        try {
            const keys = await this.getAllKeys();
            const results = {
                valid: 0,
                invalid: 0,
                errors: []
            };

            for (const key of keys.secure) {
                try {
                    const originalKey = key.replace(this.storagePrefix, '');
                    const value = await this.getSecure(originalKey);
                    if (value !== null) {
                        results.valid++;
                    } else {
                        results.invalid++;
                        results.errors.push(`Invalid data for key: ${originalKey}`);
                    }
                } catch (error) {
                    results.invalid++;
                    results.errors.push(`Error validating key ${key}: ${error.message}`);
                }
            }

            return results;
        } catch (error) {
            console.error('Error validating storage:', error);
            throw new Error('Failed to validate storage');
        }
    }

    // Migrate old data to secure storage
    async migrateToSecure(key) {
        try {
            const oldValue = await this.getRegular(key);
            if (oldValue !== null) {
                await this.setSecure(key, oldValue);
                await this.removeRegular(key);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error migrating data to secure storage:', error);
            throw new Error(`Failed to migrate data for key: ${key}`);
        }
    }
}

// Create a global instance
const secureStorage = new SecureStorage();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecureStorage;
}

