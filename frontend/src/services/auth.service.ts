
import api from '@/lib/api';

export const AuthService = {
    syncUser: async () => {
        // Determine this call simply tells backend "Hey, I'm here, sync me if needed"
        // The backend uses the Bearer token to get the ID and details.
        return api.post('/users/sync');
    },

    getProfile: async () => {
        return api.get('/users/profile');
    }
};
