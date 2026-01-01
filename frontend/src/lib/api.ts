
import axios from 'axios';
import { supabase } from './supabase';
import { sessionCache } from './sessionCache';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Fast session getter with caching
async function getSessionFast(): Promise<{ session: any; error: any }> {
    // First check cache
    const cachedSession = sessionCache.getSession();
    
    if (cachedSession && !sessionCache.isExpired()) {
        return { session: cachedSession, error: null };
    }

    // Check if refresh is already in progress
    const refreshPromise = sessionCache.getRefreshPromise();
    if (refreshPromise) {
        try {
            const refreshedSession = await refreshPromise;
            return { session: refreshedSession, error: null };
        } catch (error) {
            // Continue to fetch fresh session
        }
    }

    // Fetch fresh session from Supabase
    const { data, error } = await supabase.auth.getSession();
    
    if (data.session) {
        sessionCache.setSession(data.session);
    }
    
    return { session: data.session, error };
}

// Fast token refresh with deduplication
async function refreshSessionFast(currentSession: any): Promise<{ session: any; error: any }> {
    // Check if refresh is already in progress
    const existingPromise = sessionCache.getRefreshPromise();
    if (existingPromise) {
        try {
            const refreshedSession = await existingPromise;
            return { session: refreshedSession, error: null };
        } catch (error) {
            // Continue with new refresh
        }
    }

    // Start new refresh
    const refreshPromise = supabase.auth.refreshSession(currentSession).then(({ data, error }) => {
        if (data.session) {
            sessionCache.setSession(data.session);
        }
        return data.session;
    }).catch((error) => {
        sessionCache.setRefreshPromise(null);
        throw error;
    });

    sessionCache.setRefreshPromise(refreshPromise);

    try {
        const refreshedSession = await refreshPromise;
        sessionCache.setRefreshPromise(null);
        return { session: refreshedSession, error: null };
    } catch (error) {
        sessionCache.setRefreshPromise(null);
        return { session: null, error };
    }
}

// Request interceptor - FAST and OPTIMIZED
api.interceptors.request.use(async (config) => {
    try {
        // Get session fast (from cache if available)
        const { session, error } = await getSessionFast();
        
        if (error || !session?.access_token) {
            return config; // Continue without auth, response interceptor will handle
        }

        // Check if token needs refresh (expires within 60 seconds)
        const expiresAt = session.expires_at;
        const now = Math.floor(Date.now() / 1000);
        
        if (expiresAt && (expiresAt - now) < 60) {
            // Token expiring soon, refresh it
            const { session: refreshedSession } = await refreshSessionFast(session);
            
            if (refreshedSession?.access_token) {
                config.headers.Authorization = `Bearer ${refreshedSession.access_token}`;
                return config;
            }
        }
        
        // Use current token
        config.headers.Authorization = `Bearer ${session.access_token}`;
    } catch (error) {
        // Silent error - let request proceed, response interceptor will handle 401
    }

    return config;
});

// Response interceptor - FAST retry logic
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // Handle 401 Unauthorized errors
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                // Get session fast
                const { session: currentSession } = await getSessionFast();
                
                if (!currentSession) {
                        // No session available, clear cache
                    sessionCache.clear();
                    return Promise.reject(error);
                }
                
                // Try to refresh the session
                const { session: refreshedSession, error: refreshError } = await refreshSessionFast(currentSession);
                
                if (!refreshError && refreshedSession?.access_token) {
                    // Update the authorization header with new token
                    originalRequest.headers.Authorization = `Bearer ${refreshedSession.access_token}`;
                    // Retry the original request with new token
                    return api(originalRequest);
                } else {
                    // Refresh failed, clear cache
                    sessionCache.clear();
                    return Promise.reject(error);
                }
            } catch (refreshError) {
                // Refresh failed, clear cache
                sessionCache.clear();
                return Promise.reject(error);
            }
        }
        
        // If retry already attempted and still 401, redirect to login
        if (error.response?.status === 401 && originalRequest._retry) {
            sessionCache.clear();
        }
        
        return Promise.reject(error);
    }
);

export default api;
