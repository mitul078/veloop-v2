import { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/axios';

const AdminAuthContext = createContext(null);

export const DUMMY_CREDENTIALS = {
  email: 'test@1.com',
  password: 'testuser',
};

export function AdminAuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restore_session() {
      try {
        const res = await api.post('/auth/refresh-token');
        const token = res.data.data.access_token;
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Fetch the actual user + role now that we have a valid token —
        // refresh-token alone doesn't return this.
        const meRes = await api.get('/auth/me');
        const user = meRes.data.data;

        if (user.role !== 'admin') {
          // A valid session exists, but it's not an admin account —
          // don't treat this as an authenticated admin session.
          delete api.defaults.headers.common['Authorization'];
          setLoading(false);
          return;
        }

        setAccessToken(token);
        setAdminUser(user);
      } catch (err) {
        console.log('No existing admin session found.');
      } finally {
        setLoading(false);
      }
    }
    restore_session();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user, access_token } = res.data.data;

      if (user.role !== 'admin') {
        return {
          success: false,
          message: 'This account does not have admin access.'
        };
      }

      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setAccessToken(access_token);
      setAdminUser(user);

      return { success: true, message: res.data.message, data: res.data.data };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed.'
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('LOGOUT ERROR', err);
    } finally {
      delete api.defaults.headers.common['Authorization'];
      setAccessToken(null);
      setAdminUser(null);
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        accessToken,
        isAuthenticated: !!accessToken && adminUser?.role === 'admin',
        loading,
        login,
        logout,
        dummyCredentials: DUMMY_CREDENTIALS,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}