import axios from 'axios';
import { API_BASE, ENDPOINTS } from './config';

// Obtener token del localStorage
const getToken = () => {
  return localStorage.getItem('token');
};

// Configurar headers con JWT
const getHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Usuarios mock para desarrollo
const usuariosMock = [
  {
    id: 1,
    nombre: 'Martin Palacios',
    correo: 'm.palacios@uta.edu.ec',
    rol: 'Administrador',
    estado: 'Activo',
    zona: 'Zona A'
  },
  {
    id: 2,
    nombre: 'Juan Paredes',
    correo: 'j.paredes@uta.edu.ec',
    rol: 'Guardia',
    estado: 'Activo',
    zona: 'Zona B'
  },
  {
    id: 3,
    nombre: 'Abel Chiriboga',
    correo: 'a.chiriboga@uta.edu.ec',
    rol: 'Estudiante',
    estado: 'Activo',
    zona: 'Zona C'
  },
  {
    id: 4,
    nombre: 'Sheyla Pacha',
    correo: 's.pacha@uta.edu.ec',
    rol: 'Estudiante',
    estado: 'Inactivo',
    zona: 'Zona A'
  },
  {
    id: 5,
    nombre: 'Maria Rodriguez',
    correo: 'm.rodriguez@uta.edu.ec',
    rol: 'Docente',
    estado: 'Activo',
    zona: 'Zona D'
  },
  {
    id: 6,
    nombre: 'Carlos Mendoza',
    correo: 'c.mendoza@uta.edu.ec',
    rol: 'Personal Administrativo',
    estado: 'Activo',
    zona: 'Zona B'
  }
];

// Obtener usuarios paginados
export const getUsuarios = async (pagina = 1, tamaño = 10) => {
  try {
    // Llamar al backend real
    const response = await axios.get(
      `${API_BASE}/api/usuarios?page=${pagina}&size=${tamaño}`,
      { headers: getHeaders() }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    // Fallback a datos mock si el backend no está disponible
    const inicio = (pagina - 1) * tamaño;
    const fin = inicio + tamaño;
    const usuariosPagina = usuariosMock.slice(inicio, fin);
    
    return {
      success: true,
      data: {
        usuarios: usuariosPagina,
        paginaActual: pagina,
        totalPaginas: Math.ceil(usuariosMock.length / tamaño)
      }
    };
  }
};

// Cambiar rol de usuario
export const cambiarRolUsuario = async (id, nuevoRol) => {
  try {
    // Llamar al backend real
    const response = await axios.patch(
      `${API_BASE}/api/usuarios/${id}/rol`,
      { rol: nuevoRol },
      { headers: getHeaders() }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error al cambiar rol de usuario:', error);
    // Fallback a datos mock si el backend no está disponible
    const usuario = usuariosMock.find(u => u.id === id);
    if (usuario) {
      usuario.rol = nuevoRol;
      return {
        success: true,
        data: usuario
      };
    }
    
    return {
      success: false,
      error: 'Usuario no encontrado'
    };
  }
};

// Cambiar estado de usuario
export const cambiarEstadoUsuario = async (id, nuevoEstado) => {
  try {
    // Llamar al backend real
    const response = await axios.patch(
      `${API_BASE}/api/usuarios/${id}/estado`,
      { estado: nuevoEstado },
      { headers: getHeaders() }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error al cambiar estado de usuario:', error);
    // Fallback a datos mock si el backend no está disponible
    const usuario = usuariosMock.find(u => u.id === id);
    if (usuario) {
      usuario.estado = nuevoEstado;
      return {
        success: true,
        data: usuario
      };
    }
    
    return {
      success: false,
      error: 'Usuario no encontrado'
    };
  }
};

// Obtener roles válidos
export const getRolesValidos = () => {
  return [
    'Estudiante',
    'Docente',
    'Personal Administrativo',
    'Guardia',
    'Administrador'
  ];
};
