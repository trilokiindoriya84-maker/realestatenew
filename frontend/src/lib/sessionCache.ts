/**
 * Session Cache Utility
 * Fast in-memory session cache to avoid repeated Supabase calls
 */

import { Session } from '@supabase/supabase-js';

interface CachedSession {
    session: Session | null;
    timestamp: number;
    expiresAt: number;
}

class SessionCache {
    private cache: CachedSession | null = null;
    private readonly CACHE_TTL = 5000; // 5 seconds cache
    private refreshPromise: Promise<Session | null> | null = null;

    setSession(session: Session | null): void {
        if (session) {
            this.cache = {
                session,
                timestamp: Date.now(),
                expiresAt: session.expires_at ? session.expires_at * 1000 : Date.now() + 3600000, // Default 1 hour
            };
        } else {
            this.cache = null;
        }
    }

    getSession(): Session | null {
        if (!this.cache) {
            return null;
        }

        // Check if cache is still valid
        const now = Date.now();
        if (now - this.cache.timestamp > this.CACHE_TTL) {
            // Cache expired, but return session anyway (will be refreshed)
            return this.cache.session;
        }

        return this.cache.session;
    }

    isExpired(): boolean {
        if (!this.cache || !this.cache.session) {
            return true;
        }

        const now = Math.floor(Date.now() / 1000);
        const expiresAt = this.cache.session.expires_at || 0;
        
        // Consider expired if less than 60 seconds remaining
        return (expiresAt - now) < 60;
    }

    clear(): void {
        this.cache = null;
        this.refreshPromise = null;
    }

    setRefreshPromise(promise: Promise<Session | null> | null): void {
        this.refreshPromise = promise;
    }

    getRefreshPromise(): Promise<Session | null> | null {
        return this.refreshPromise;
    }
}

export const sessionCache = new SessionCache();

