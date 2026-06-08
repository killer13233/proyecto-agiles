import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../services/config';
import { adminWsService } from '../services/wsService';
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {

      // Producción: login real
      const response = await axios.post(`${API_BASE}/api/auth/login`, credentials);
      
      if (response.data.token) {
        const userData = {
          nombre: response.data.nombre,
          correo: response.data.correo,
          rol: response.data.rol,
          zonaAsignada: response.data.zonaAsignada
        };
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        adminWsService.connect(response.data.token);
        if (response.data.rol === 'Administrador') {
          adminWsService.on('guardia_disponibilidad', (data) => {
            window.dispatchEvent(new CustomEvent('guardia-disponibilidad', { detail: data }));
          });
        }

        return { success: true };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: 'Error de conexión con el servidor. Verifica que el backend esté corriendo.' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    adminWsService.disconnect();
  };

  const isAuthenticated = () => {
    return !!localStorage.getItem('token');
  };

  const hasRole = (roles) => {
    if (!user) return false;
    return roles.includes(user.rol);
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated,
    hasRole,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};
