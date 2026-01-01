
import { User, Session } from '@supabase/supabase-js';

export interface AuthState {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    isAdmin: boolean;
}

export type AuthContextType = AuthState & {
    userProfile: any;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
};
