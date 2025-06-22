// Background service worker for Prompt Enhancer extension

// Import utilities
importScripts('encryption.js', 'storage.js');

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Prompt Enhancer extension installed');
    
    // Set default settings
    chrome.storage.sync.set({
      whitelistedDomains: '',
      productKey: ''
    });
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'enhancePrompt') {
    handlePromptEnhancement(request.prompt, request.productKey)
      .then(enhancedPrompt => {
        sendResponse({ success: true, enhancedPrompt });
      })
      .catch(error => {
        console.error('Prompt enhancement failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    // Return true to indicate we'll send a response asynchronously
    return true;
  }
  
  if (request.action === 'getProductKey') {
    getSecureProductKey()
      .then(productKey => {
        sendResponse({ success: true, productKey });
      })
      .catch(error => {
        console.error('Error getting product key:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true;
  }
});

// Function to get product key from secure storage
async function getSecureProductKey() {
  try {
    const storage = new SecureStorage();
    const productKey = await storage.getSecure('productKey');
    
    if (!productKey) {
      throw new Error('Product key not found. Please configure it in the extension popup.');
    }
    
    return productKey;
  } catch (error) {
    throw new Error(`Failed to retrieve product key: ${error.message}`);
  }
}

// Function to handle prompt enhancement via Together.ai API
async function handlePromptEnhancement(originalPrompt, productKey) {
  // Validate inputs
  if (!originalPrompt || typeof originalPrompt !== 'string') {
    throw new Error('Invalid prompt provided');
  }
  
  if (!productKey || typeof productKey !== 'string') {
    throw new Error('Product key is required');
  }

  // Trim and validate prompt length
  const trimmedPrompt = originalPrompt.trim();
  if (trimmedPrompt.length === 0) {
    throw new Error('Prompt cannot be empty');
  }
  
  if (trimmedPrompt.length > 4000) {
    throw new Error('Prompt is too long (maximum 4000 characters)');
  }

  const systemPrompt = `You are an expert AI prompt engineer. Your task is to rewrite user prompts to make them more effective for large language models.

Guidelines:
- Make the prompt clear, specific, and unambiguous
- Add relevant context and constraints when helpful
- Use structured formatting when appropriate
- Maintain the original intent while improving clarity
- Keep the enhanced prompt concise but comprehensive
- Return ONLY the improved prompt without any additional commentary

Original prompt to enhance:`;

  const requestBody = {
    model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: trimmedPrompt
      }
    ],
    max_tokens: 1500,
    temperature: 0.3,
    top_p: 0.9,
    stream: false
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${productKey}`,
        'User-Agent': 'PromptEnhancer/1.0'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error && errorData.error.message) {
          errorMessage = errorData.error.message;
        }
      } catch (e) {
        // Use default error message if JSON parsing fails
      }
      
      // Handle specific error codes
      if (response.status === 401) {
        errorMessage = 'Invalid API key. Please check your product key in the extension settings.';
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again in a moment.';
      } else if (response.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response received from the AI model');
    }

    const enhancedPrompt = data.choices[0].message.content.trim();
    
    if (!enhancedPrompt) {
      throw new Error('Empty response received from the AI model');
    }

    // Validate the enhanced prompt
    if (enhancedPrompt.length > 8000) {
      throw new Error('Enhanced prompt is too long');
    }

    return enhancedPrompt;
    
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Network error. Please check your internet connection.');
    }
    
    // Re-throw the error with original message
    throw error;
  }
}

// Rate limiting helper
const rateLimiter = {
  requests: [],
  maxRequests: 10,
  timeWindow: 60000, // 1 minute
  
  canMakeRequest() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    return this.requests.length < this.maxRequests;
  },
  
  recordRequest() {
    this.requests.push(Date.now());
  }
};

// Enhanced prompt enhancement with rate limiting
async function enhancePromptWithRateLimit(originalPrompt, productKey) {
  if (!rateLimiter.canMakeRequest()) {
    throw new Error('Rate limit exceeded. Please wait a moment before trying again.');
  }
  
  rateLimiter.recordRequest();
  return await handlePromptEnhancement(originalPrompt, productKey);
}

