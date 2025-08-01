import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const savedUser = localStorage.getItem('jurmaq_user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      // Query the database through Electron API
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }

      const users = await window.electronAPI.dbQuery(
        'SELECT * FROM usuarios WHERE email = ? AND activo = 1',
        [email]
      );

      if (users.length === 0) {
        throw new Error('Usuario no encontrado');
      }

      const userData = users[0];
      
      // For demo purposes, we'll use simple password verification
      // In production, this would be done on the backend with proper hashing
      const isValidPassword = 
        (userData.rol === 'Admin' && password === 'admin123') ||
        (userData.rol !== 'Admin' && password === 'user123') ||
        password === 'demo';

      if (!isValidPassword) {
        throw new Error('Contraseña incorrecta');
      }

      // Remove sensitive data
      const { password_hash, ...safeUserData } = userData;
      
      setUser(safeUserData);
      localStorage.setItem('jurmaq_user', JSON.stringify(safeUserData));
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('jurmaq_user');
  };

  const hasPermission = (requiredRole) => {
    if (!user) return false;
    
    const roleHierarchy = {
      'Usuario': 1,
      'RRHH': 2,
      'Admin': 3
    };
    
    const userLevel = roleHierarchy[user.rol] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;
    
    return userLevel >= requiredLevel;
  };

  const updateUser = async (userData) => {
    try {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('jurmaq_user', JSON.stringify(updatedUser));
      return { success: true };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    hasPermission,
    updateUser,
    isAdmin: user?.rol === 'Admin',
    isRRHH: user?.rol === 'RRHH' || user?.rol === 'Admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};