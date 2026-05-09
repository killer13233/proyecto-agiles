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
    // Llamar al backend real
    const response = await axios.get(
      `${API_BASE}/api/zonas`,
      { headers: getHeaders() }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error al obtener zonas:', error);
    // Fallback a datos mock si el backend no está disponible
    return {
      success: true,
      data: zonasMock
    };
  }
};

// Crear nueva zona
export const crearZona = async (zonaData) => {
  try {
    // Llamar al backend real
    const response = await axios.post(
      `${API_BASE}/api/zonas`,
      zonaData,
      { headers: getHeaders() }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error al crear zona:', error);
    // Fallback a datos mock si el backend no está disponible
    const nuevaZona = {
      ...zonaData,
      id: zonasMock.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    zonasMock.push(nuevaZona);
    
    return {
      success: true,
      data: nuevaZona
    };
  }
};

// Actualizar zona
export const actualizarZona = async (id, zonaData) => {
  try {
    // Llamar al backend real
    const response = await axios.put(
      `${API_BASE}/api/zonas/${id}`,
      zonaData,
      { headers: getHeaders() }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error al actualizar zona:', error);
    // Fallback a datos mock si el backend no está disponible
    const index = zonasMock.findIndex(z => z.id === id);
    if (index !== -1) {
      zonasMock[index] = {
        ...zonasMock[index],
        ...zonaData,
        updatedAt: new Date().toISOString()
      };
      
      return {
        success: true,
        data: zonasMock[index]
      };
    }
    
    return {
      success: false,
      error: 'Zona no encontrada'
    };
  }
};

// Eliminar zona
export const eliminarZona = async (id) => {
  try {
    // Llamar al backend real
    const response = await axios.delete(
      `${API_BASE}/api/zonas/${id}`,
      { headers: getHeaders() }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error al eliminar zona:', error);
    // Fallback a datos mock si el backend no está disponible
    const index = zonasMock.findIndex(z => z.id === id);
    if (index !== -1) {
      const zonaEliminada = zonasMock[index];
      zonasMock.splice(index, 1);
      
      return {
        success: true,
        data: zonaEliminada
      };
    }
    
    return {
      success: false,
      error: 'Zona no encontrada'
    };
  }
};

// Cambiar estado de zona
export const cambiarEstadoZona = async (id, nuevoEstado) => {
  try {
    // Llamar al backend real
    const response = await axios.patch(
      `${API_BASE}/api/zonas/${id}/estado`,
      { estado: nuevoEstado },
      { headers: getHeaders() }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error al cambiar estado de zona:', error);
    // Fallback a datos mock si el backend no está disponible
    const index = zonasMock.findIndex(z => z.id === id);
    if (index !== -1) {
      zonasMock[index] = {
        ...zonasMock[index],
        estado: nuevoEstado,
        updatedAt: new Date().toISOString()
      };
      
      return {
        success: true,
        data: zonasMock[index]
      };
    }
    
    return {
      success: false,
      error: 'Zona no encontrada'
    };
  }
};
