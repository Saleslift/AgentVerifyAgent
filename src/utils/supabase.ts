import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Helper function to determine if we're in WebContainer environment
export const isWebContainerEnvironment = () => {
  // Enhanced check for WebContainer URL patterns
  const webContainerHosts = [
    'webcontainer', 
    'stackblitz', 
    'local-credentialless',
    'codesandbox',
    'csb.app',
    'github.dev',
    'githubpreview'
  ];
  
  const isWebContainer = webContainerHosts.some(host => 
    window.location.hostname.includes(host)
  );
  
  if (isWebContainer && import.meta.env.DEV) {
    console.info('Running in WebContainer environment - localhost Supabase connections will not work');
  }
  
  return isWebContainer;
};

// Check and warn about localhost URLs in WebContainer
const isLocalhost = (url) => url?.includes('localhost') || url?.includes('127.0.0.1');
const isInWebContainer = isWebContainerEnvironment();

// Create a fallback URL for development that won't cause repeated connection attempts
const getFallbackUrl = () => {
  if (isInWebContainer && isLocalhost(supabaseUrl)) {
    return 'https://example-disabled-local-connection.supabase.co';
  }
  return 'https://placeholder-project-id.supabase.co';
};

// Display prominent warning for localhost URLs in WebContainer
if (isInWebContainer && isLocalhost(supabaseUrl)) {
  console.error('⚠️ CRITICAL ERROR: Cannot connect to localhost Supabase instance from WebContainer');
  console.error('----------------------------------------');
  console.error('Your .env file contains a localhost Supabase URL, but you are running in a WebContainer environment.');
  console.error('This will never work because WebContainer cannot access your local machine\'s services.');
  console.error('');
  console.error('To fix this:');
  console.error('1. Use a remote Supabase instance (create one at https://supabase.com)');
  console.error('2. Update your .env file with the remote Supabase URL and anon key');
  console.error('----------------------------------------');
  
  // Add an error notification to the DOM for better visibility
  setTimeout(() => {
    try {
      const errorDiv = document.createElement('div');
      errorDiv.style.position = 'fixed';
      errorDiv.style.top = '0';
      errorDiv.style.left = '0';
      errorDiv.style.right = '0';
      errorDiv.style.padding = '15px';
      errorDiv.style.background = '#f44336';
      errorDiv.style.color = 'white';
      errorDiv.style.zIndex = '9999';
      errorDiv.style.textAlign = 'center';
      errorDiv.style.fontSize = '16px';
      errorDiv.style.fontWeight = 'bold';
      errorDiv.innerHTML = `⚠️ Cannot connect to localhost Supabase in WebContainer. Please use a remote Supabase instance. <br>
                           Check console for details.`;
      document.body.prepend(errorDiv);
    } catch (e) {
      // Ignore errors if this runs before DOM is ready
    }
  }, 1000);
}

// Validate environment variables
if (!supabaseUrl) {
  console.error('Missing VITE_SUPABASE_URL environment variable');
  
  // WebContainer-specific message
  if (isInWebContainer) {
    console.info('You need to provide a remote Supabase URL in your .env file when running in WebContainer');
  }
}

if (!supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

// Create Supabase client with enhanced configuration
export const supabase = createClient(
  // Use a fallback URL if we're in WebContainer with localhost URL to prevent repeated connection attempts
  (isInWebContainer && isLocalhost(supabaseUrl)) ? getFallbackUrl() : (supabaseUrl || getFallbackUrl()),
  supabaseAnonKey || 'placeholder-anon-key',
  {
  auth: {
    persistSession: true,
    storageKey: 'agent-verify-auth',
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    fetch: async (...args) => {
      // Enhanced network connectivity check with detailed error
      if (!navigator.onLine) {
        const networkError = new Error('No internet connection detected. Please check your network connection and try again.');
        networkError.name = 'NetworkError';
        throw networkError;
      }

      // Early fail for localhost URLs in WebContainer to prevent retry loop
      if (isInWebContainer && typeof args[0] === 'string' && isLocalhost(args[0])) {
        const containerError = new Error(
          'Cannot connect to localhost/127.0.0.1 services from WebContainer environment. ' +
          'Please use a remote Supabase instance.'
        );
        containerError.name = 'WebContainerConnectionError';
        throw containerError;
      }

      // Implement retry logic for fetch with exponential backoff
      const MAX_RETRIES = 3;
      const INITIAL_RETRY_DELAY = 1000;
      // Increase timeout for WebContainer environments
      const TIMEOUT_MS = isInWebContainer ? 60000 : 45000; // 60 seconds in WebContainer, 45 seconds elsewhere
      let lastError = null;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

          try {
            // Log connection attempt in development
            if (import.meta.env.DEV) {
              console.info(`Supabase connection attempt ${attempt + 1} to ${args[0]}`);
            }
            
            // Add proper signal handling and abort error catch
            const signal = controller.signal;
            const options = { ...args[1] };
            
            // Ensure we don't override an existing signal
            if (!options.signal) {
              options.signal = signal;
            } else {
              // Handle case where a signal is already provided
              const existingSignal = options.signal;
              options.signal = signal;
              
              // If original signal aborts, abort our controller too
              if (existingSignal.aborted) {
                controller.abort(existingSignal.reason);
              } else {
                existingSignal.addEventListener('abort', () => {
                  controller.abort(existingSignal.reason);
                });
              }
            }
            
            const response = await fetch(args[0], options);

            clearTimeout(timeout);

            // Check if the response is ok
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            // Validate JSON format for JSON responses before returning
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const clonedResponse = response.clone();
              try {
                // First check if we got an empty response
                const jsonText = await clonedResponse.text();
                if (!jsonText.trim()) {
                  throw new Error('Empty response received when JSON expected');
                }
                
                try {
                  // Explicitly check if the text is valid JSON
                  JSON.parse(jsonText);
                } catch (parseError) {
                  console.error('Invalid JSON response:', jsonText.substring(0, 200) + (jsonText.length > 200 ? '...' : ''));
                  throw new Error(`Invalid JSON response from server: ${parseError.message}`);
                }
              } catch (e) {
                if (e.message.includes('Empty response')) {
                  // For empty responses, return an empty object as valid JSON
                  return new Response(JSON.stringify({}), {
                    status: 200,
                    headers: {
                      'Content-Type': 'application/json'
                    }
                  });
                }
                throw new Error(`Invalid JSON response from server: ${e.message}`);
              }
            }

            return response;
          } catch (err) {
            clearTimeout(timeout);
            
            // Handle AbortError with more details
            if (err.name === 'AbortError') {
              if (attempt === MAX_RETRIES - 1) {
                throw new Error(`Request timeout after ${TIMEOUT_MS}ms. The server may be experiencing high load or network issues.`);
              } else {
                console.warn(`Request timed out on attempt ${attempt + 1}, retrying...`);
                // Continue to retry
              }
            } else {
              throw err;
            }
          }
        } catch (err) {
          lastError = err;
          
          // Enhanced error logging
          console.warn('Supabase fetch attempt failed:', {
            attempt: attempt + 1,
            url: typeof args[0] === 'string' ? args[0] : 'Request object',
            error: err.message,
            name: err.name,
            status: err.status,
            timestamp: new Date().toISOString()
          });
          
          // Development mode specific error handling
          if (import.meta.env.DEV) {
            // Check for common issues in development
            const url = args[0].toString();
            if (url.includes('localhost') || url.includes('127.0.0.1')) {
              console.error('⚠️ Attempting to connect to localhost Supabase instance from WebContainer environment.');
              console.info('WebContainer cannot connect to services running on localhost. Use a remote Supabase instance.');
              
              // Break out of retry loop for localhost URLs in development
              if (attempt === 0) {
                const devError = new Error(
                  'Cannot connect to localhost Supabase from WebContainer. ' +
                  'Please use a remote Supabase instance or update your .env file with valid credentials.'
                );
                devError.name = 'WebContainerConnectionError';
                throw devError;
              }
            }
          }

          // If we've exhausted all retries, throw a detailed error
          if (attempt === MAX_RETRIES - 1) {
            const finalError = new Error(
              `Failed to connect to Supabase after ${MAX_RETRIES} attempts: ${err.message}. ` +
              `Please check your connection and try again. If the problem persists, contact support.`
            );
            finalError.name = 'SupabaseConnectionError';
            finalError.originalError = err;
            finalError.attempts = MAX_RETRIES;
            finalError.lastAttemptTime = new Date().toISOString();
            throw finalError;
          }

          // Use properly increasing exponential backoff with jitter
          const jitter = Math.random() * 0.3 + 0.85; // Random value between 0.85-1.15
          const delay = Math.floor(INITIAL_RETRY_DELAY * Math.pow(2, attempt) * jitter);
          await new Promise(resolve => setTimeout(resolve, delay));
          console.info(`Retrying after ${delay}ms delay...`);
        }
      }

      // This should never be reached due to the throw in the last retry
      throw lastError;
    },
    headers: {
      'X-Client-Info': 'agent-verify',
      'X-Client-Version': '1.0.0'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Export an enhanced function to check connection status
export const checkConnection = async () => {
  // First check basic network connectivity
  if (!navigator.onLine) {
    return {
      connected: false,
      error: 'No internet connection',
      details: {
        url: supabaseUrl,
        networkStatus: 'offline',
        timestamp: new Date().toISOString()
      }
    };
  }

  // Special case for WebContainer environments with localhost URLs
  if (isInWebContainer && isLocalhost(supabaseUrl)) {
    return {
      connected: false,
      error: 'Cannot connect to localhost Supabase from WebContainer environment',
      details: {
        url: supabaseUrl,
        networkStatus: 'WebContainer cannot access localhost',
        timestamp: new Date().toISOString(),
        solution: 'Configure a remote Supabase instance in your .env file'
      }
    };
  }

  try {
    // Dev mode specific check
    if (import.meta.env.DEV) {
      console.info('Checking Supabase connection to:', supabaseUrl);
      
      // Early detection for localhost URLs which won't work in WebContainer
      if (isLocalhost(supabaseUrl)) {
        console.error('⚠️ Detected localhost Supabase URL:', supabaseUrl);
        if (isInWebContainer) {
          console.info('WebContainer cannot connect to services running on localhost. Use a remote Supabase instance.');
          
          return {
            connected: false,
            error: 'Cannot connect to localhost Supabase from WebContainer',
            details: {
              url: supabaseUrl,
              networkStatus: 'localhost not accessible',
              timestamp: new Date().toISOString(),
              solution: 'Configure a remote Supabase instance in your .env file'
            }
          };
        }
      }
    }
    
    // Increase timeout for connection check to 45 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), isInWebContainer ? 60000 : 30000);

    try {
      // Skip actual query for localhost URLs in WebContainer to avoid unnecessary retries
      if (isInWebContainer && isLocalhost(supabaseUrl)) {
        clearTimeout(timeoutId);
        throw new Error('Cannot connect to localhost Supabase from WebContainer environment');
      }

      // Try to make a simple query to verify the connection
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
        .abortSignal(controller.signal);
      
      clearTimeout(timeoutId);
      
      if (error) {
        // Enhanced error logging
        console.error('Supabase connection check failed:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          timestamp: new Date().toISOString()
        });

        return {
          connected: false,
          error: error.message,
          details: {
            url: supabaseUrl,
            code: error.code,
            hint: error.hint,
            timestamp: new Date().toISOString()
          }
        };
      }
      
      return {
        connected: true,
        error: null,
        details: null
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (error) {
    // Handle timeout
    if (error.name === 'AbortError') {
      return {
        connected: false,
        error: `Connection timed out after ${isInWebContainer ? 60 : 30} seconds`,
        details: {
          url: supabaseUrl,
          name: 'TimeoutError',
          timestamp: new Date().toISOString()
        }
      };
    }

    // Enhanced error logging
    console.error('Unexpected error during connection check:', {
      error,
      timestamp: new Date().toISOString()
    });

    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown connection error',
      details: {
        url: supabaseUrl,
        name: error instanceof Error ? error.name : 'Unknown',
        type: typeof error,
        timestamp: new Date().toISOString()
      }
    };
  }
};