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
    if (import.meta.env.DEV) {
      // Modo desarrollo: usar datos mock
      const inicio = (pagina - 1) * tamaño;
      const fin = inicio + tamaño;
      const usuariosPaginados = usuariosMock.slice(inicio, fin);
      
      return {
        success: true,
        data: {
          usuarios: usuariosPaginados,
          total: usuariosMock.length,
          pagina,
          tamaño,
          totalPaginas: Math.ceil(usuariosMock.length / tamaño)
        }
      };
    }

    // Producción: llamar al backend
    const response = await axios.get(
      `${API_BASE}${ENDPOINTS.USUARIOS.LISTAR}?pagina=${pagina}&tamaño=${tamaño}`,
      { headers: getHeaders() }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return {
      success: false,
      error: 'Error al cargar los usuarios. Intenta nuevamente.'
    };
  }
};

// Cambiar rol de usuario
export const cambiarRolUsuario = async (id, nuevoRol) => {
  try {
    if (import.meta.env.DEV) {
      // Modo desarrollo: simular cambio
      const usuario = usuariosMock.find(u => u.id === id);
      if (usuario) {
        usuario.rol = nuevoRol;
        return { success: true };
      }
      return { success: false, error: 'Usuario no encontrado' };
    }

    // Producción: llamar al backend
    const response = await axios.put(
      `${API_BASE}${ENDPOINTS.USUARIOS.CAMBIAR_ROL(id)}`,
      { rol: nuevoRol },
      { headers: getHeaders() }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error al cambiar rol:', error);
    return {
      success: false,
      error: 'Error al cambiar el rol del usuario.'
    };
  }
};

// Cambiar estado de usuario
export const cambiarEstadoUsuario = async (id, nuevoEstado) => {
  try {
    if (import.meta.env.DEV) {
      // Modo desarrollo: simular cambio
      const usuario = usuariosMock.find(u => u.id === id);
      if (usuario) {
        usuario.estado = nuevoEstado;
        return { success: true };
      }
      return { success: false, error: 'Usuario no encontrado' };
    }

    // Producción: llamar al backend
    const response = await axios.patch(
      `${API_BASE}${ENDPOINTS.USUARIOS.CAMBIAR_ESTADO(id)}`,
      { estado: nuevoEstado },
      { headers: getHeaders() }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    return {
      success: false,
      error: 'Error al cambiar el estado del usuario.'
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
