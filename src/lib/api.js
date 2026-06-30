// Global fetch interceptor to handle Render free-tier cold starts
// Automatically handles timeouts, shows a wakeup notice, and retries the request.

const originalFetch = window.fetch;

const showWakeUpToast = () => {
    let toast = document.getElementById('render-wakeup-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'render-wakeup-toast';
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.zIndex = '9999';
        toast.style.backgroundColor = '#1E1B4B'; // Indigo background
        toast.style.border = '1px solid #F97316'; // Orange accent
        toast.style.color = '#FFFFFF';
        toast.style.padding = '12px 20px';
        toast.style.borderRadius = '8px';
        toast.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)';
        toast.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        toast.style.fontSize = '13px';
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.gap = '10px';
        toast.style.fontWeight = '500';
        
        // Spinner
        const spinner = document.createElement('div');
        spinner.style.width = '14px';
        spinner.style.height = '14px';
        spinner.style.border = '2px solid #F97316';
        spinner.style.borderTopColor = 'transparent';
        spinner.style.borderRadius = '50%';
        spinner.style.animation = 'spin 1s linear infinite';
        toast.appendChild(spinner);
        
        const text = document.createElement('span');
        text.innerText = "Waking up the server, this can take up to a minute on the first request...";
        toast.appendChild(text);
        
        // Register animation keyframes if not present
        if (!document.getElementById('render-toast-style')) {
            const style = document.createElement('style');
            style.id = 'render-toast-style';
            style.innerHTML = `
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(toast);
    }
};

const hideWakeUpToast = () => {
    const toast = document.getElementById('render-wakeup-toast');
    if (toast) {
        toast.remove();
    }
};

window.fetch = async function (input, init) {
    let url = typeof input === 'string' ? input : (input instanceof Request ? input.url : '');
    
    // Intercept and rewrite absolute backend URLs to relative paths in production.
    // This allows Vercel proxy rewrites to take effect, converting cross-site requests
    // into Same-Site requests to bypass Safari ITP cookie blocking.
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    let modifiedInput = input;
    
    if (isProduction) {
        const envPrefix = import.meta.env.VITE_API_URL || '';
        const absolutePrefix = 'https://joydip-portfolio-backend.onrender.com';
        
        let newUrl = url;
        if (envPrefix && url.startsWith(envPrefix)) {
            newUrl = url.replace(envPrefix, '');
        } else if (url.startsWith(absolutePrefix)) {
            newUrl = url.replace(absolutePrefix, '');
        }
        
        // Ensure leading slash for relative url
        if (newUrl.startsWith('api/')) {
            newUrl = '/' + newUrl;
        }
        
        if (newUrl !== url) {
            url = newUrl;
            if (typeof input === 'string') {
                modifiedInput = newUrl;
            } else if (input instanceof Request) {
                const requestInit = {};
                const keys = [
                    'method', 'headers', 'body', 'mode', 'credentials', 
                    'cache', 'redirect', 'referrer', 'integrity', 'keepalive'
                ];
                keys.forEach(k => {
                    try { requestInit[k] = input[k]; } catch(_) {}
                });
                modifiedInput = new Request(newUrl, requestInit);
            }
        }
    }

    // Intercept requests directed to our FastAPI backend endpoints
    const isBackendApi = url.includes('/api/') && 
                         !url.includes('alfa-leetcode-api') && 
                         !url.includes('api.github.com') && 
                         !url.includes('codeforces.com');
                         
    if (!isBackendApi) {
        return originalFetch(modifiedInput, init);
    }

    const executeFetch = (timeoutMs) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        
        const fetchPromise = originalFetch(modifiedInput, {
            ...init,
            signal: controller.signal
        });
        
        return fetchPromise.then(
            (response) => {
                clearTimeout(timeoutId);
                return response;
            },
            (error) => {
                clearTimeout(timeoutId);
                throw error;
            }
        );
    };

    try {
        // First attempt with a 15-second timeout.
        // If the server is awake, it responds instantly.
        // If asleep, it will timeout at 15s, triggering the wakeup notice and retry.
        return await executeFetch(15000);
    } catch (err) {
        const isTimeout = err.name === 'AbortError';
        const isNetworkError = err.message === 'Failed to fetch' || err instanceof TypeError;
        
        if (isTimeout || isNetworkError) {
            console.warn(`API call failed. Showing wakeup notice and retrying...`);
            showWakeUpToast();
            
            // Wait 1.5 seconds before retrying
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            try {
                // Retry with a generous 60-second timeout.
                const response = await executeFetch(60000);
                hideWakeUpToast();
                return response;
            } catch (retryErr) {
                hideWakeUpToast();
                throw retryErr;
            }
        }
        throw err;
    }
};
