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

// Zonas mock para desarrollo (Ambato, Ecuador - Universidad Técnica de Ambato)
const zonasMock = [
  {
    id: 1,
    nombre: 'Zona A - Edificio Principal UTA',
    descripcion: 'Cubre el edificio principal y oficinas administrativas',
    latitud: -1.241667,
    longitud: -78.619444,
    radio: 150,
    estado: 'Activa',
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 2,
    nombre: 'Zona B - Laboratorios y Talleres',
    descripcion: 'Área de laboratorios de ingeniería y talleres técnicos',
    latitud: -1.242567,
    longitud: -78.620234,
    radio: 120,
    estado: 'Activa',
    createdAt: '2024-01-16T14:20:00Z'
  },
  {
    id: 3,
    nombre: 'Zona C - Campus Deportivo',
    descripcion: 'Instalaciones deportivas, canchas y áreas recreativas',
    latitud: -1.240876,
    longitud: -78.618567,
    radio: 200,
    estado: 'Activa',
    createdAt: '2024-01-17T09:15:00Z'
  },
  {
    id: 4,
    nombre: 'Zona D - Biblioteca y Aulas',
    descripcion: 'Biblioteca central, salones de clase y auditorios',
    latitud: -1.241234,
    longitud: -78.617890,
    radio: 180,
    estado: 'Inactiva',
    createdAt: '2024-01-18T11:45:00Z'
  }
];

// Obtener todas las zonas
export const getZonas = async () => {
  try {
    if (import.meta.env.DEV) {
      // Modo desarrollo: usar datos mock
      return {
        success: true,
        data: zonasMock
      };
    }

    // Producción: llamar al backend
    const response = await axios.get(
      `${API_BASE}${ENDPOINTS.ZONAS.LISTAR}`,
      { headers: getHeaders() }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error al obtener zonas:', error);
    return {
      success: false,
      error: 'Error al cargar las zonas. Intenta nuevamente.'
    };
  }
};

// Crear nueva zona
export const crearZona = async (zonaData) => {
  try {
    if (import.meta.env.DEV) {
      // Modo desarrollo: simular creación
      const nuevaZona = {
        ...zonaData,
        id: zonasMock.length + 1,
        createdAt: new Date().toISOString()
      };
      zonasMock.push(nuevaZona);
      return { 
        success: true, 
        data: nuevaZona 
      };
    }

    // Producción: llamar al backend
    const response = await axios.post(
      `${API_BASE}${ENDPOINTS.ZONAS.CREAR}`,
      zonaData,
      { headers: getHeaders() }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error al crear zona:', error);
    return {
      success: false,
      error: 'Error al crear la zona. Verifica los datos.'
    };
  }
};

// Actualizar zona
export const actualizarZona = async (id, zonaData) => {
  try {
    if (import.meta.env.DEV) {
      // Modo desarrollo: simular actualización
      const index = zonasMock.findIndex(z => z.id === id);
      if (index !== -1) {
        zonasMock[index] = { ...zonasMock[index], ...zonaData };
        return { 
          success: true, 
          data: zonasMock[index] 
        };
      }
      return { success: false, error: 'Zona no encontrada' };
    }

    // Producción: llamar al backend
    const response = await axios.put(
      `${API_BASE}${ENDPOINTS.ZONAS.ACTUALIZAR(id)}`,
      zonaData,
      { headers: getHeaders() }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error al actualizar zona:', error);
    return {
      success: false,
      error: 'Error al actualizar la zona.'
    };
  }
};

// Eliminar zona
export const eliminarZona = async (id) => {
  try {
    if (import.meta.env.DEV) {
      // Modo desarrollo: simular eliminación
      const index = zonasMock.findIndex(z => z.id === id);
      if (index !== -1) {
        const zonaEliminada = zonasMock[index];
        zonasMock.splice(index, 1);
        return { 
          success: true, 
          data: zonaEliminada 
        };
      }
      return { success: false, error: 'Zona no encontrada' };
    }

    // Producción: llamar al backend
    const response = await axios.delete(
      `${API_BASE}${ENDPOINTS.ZONAS.ELIMINAR(id)}`,
      { headers: getHeaders() }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error al eliminar zona:', error);
    return {
      success: false,
      error: 'Error al eliminar la zona.'
    };
  }
};

// Cambiar estado de zona
export const cambiarEstadoZona = async (id, nuevoEstado) => {
  try {
    if (import.meta.env.DEV) {
      // Modo desarrollo: simular cambio de estado
      const index = zonasMock.findIndex(z => z.id === id);
      if (index !== -1) {
        zonasMock[index].estado = nuevoEstado;
        return { 
          success: true, 
          data: zonasMock[index] 
        };
      }
      return { success: false, error: 'Zona no encontrada' };
    }

    // Producción: llamar al backend
    const response = await axios.patch(
      `${API_BASE}${ENDPOINTS.ZONAS.CAMBIAR_ESTADO(id)}`,
      { estado: nuevoEstado },
      { headers: getHeaders() }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error al cambiar estado de zona:', error);
    return {
      success: false,
      error: 'Error al cambiar el estado de la zona.'
    };
  }
};
