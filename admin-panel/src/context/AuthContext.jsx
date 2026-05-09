import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../services/config';

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
      // Modo desarrollo: usar datos mock
      if (import.meta.env.DEV) {
        const usuariosMock = {
          'm.palacios@uta.edu.ec': { 
            id: 1, 
            nombre: 'Martin Palacios', 
            correo: 'm.palacios@uta.edu.ec', 
            rol: 'Administrador' 
          },
          'j.paredes@uta.edu.ec': { 
            id: 2, 
            nombre: 'Juan Paredes', 
            correo: 'j.paredes@uta.edu.ec', 
            rol: 'Guardia' 
          },
          'a.chiriboga@uta.edu.ec': { 
            id: 3, 
            nombre: 'Abel Chiriboga', 
            correo: 'a.chiriboga@uta.edu.ec', 
            rol: 'Estudiante' 
          },
          's.pacha@uta.edu.ec': { 
            id: 4, 
            nombre: 'Sheyla Pacha', 
            correo: 's.pacha@uta.edu.ec', 
            rol: 'Estudiante' 
          }
        };

        const usuario = usuariosMock[credentials.correo];
        
        if (usuario && credentials.password === 'Admin2026!') {
          const mockToken = 'mock-jwt-token-development';
          localStorage.setItem('token', mockToken);
          localStorage.setItem('user', JSON.stringify(usuario));
          setUser(usuario);
          return { success: true };
        } else {
          return { success: false, error: 'Credenciales incorrectas' };
        }
      }

      // Producción: login real
      const response = await axios.post(`${API_BASE}/api/auth/login`, credentials);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.usuario));
        setUser(response.data.usuario);
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
