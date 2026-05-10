import {
  GoogleMap,
  LoadScript,
  Polygon,
  Marker,
} from "@react-google-maps/api";
import "./AdminDashboard.css";
import { useEffect, useState } from "react";
import { obtenerUsuarios } from "../services/usuarioService";

const centroUTA = {
  lat: -1.2422,
  lng: -78.6197,
};

const alertaUsuario = {
  lat: -1.2428,
  lng: -78.6202,
  nombre: "Usuario en auxilio",
  zona: "Zona A",
};

const zonas = [
  {
    nombre: "Zona A",
    color: "#3b82f6",
    paths: [
      { lat: -1.2409, lng: -78.6212 },
      { lat: -1.2409, lng: -78.6194 },
      { lat: -1.2420, lng: -78.6194 },
      { lat: -1.2420, lng: -78.6212 },
    ],
  },
  {
    nombre: "Zona B",
    color: "#10b981",
    paths: [
      { lat: -1.2409, lng: -78.6194 },
      { lat: -1.2409, lng: -78.6177 },
      { lat: -1.2420, lng: -78.6177 },
      { lat: -1.2420, lng: -78.6194 },
    ],
  },
  {
    nombre: "Zona C",
    color: "#f59e0b",
    paths: [
      { lat: -1.2420, lng: -78.6212 },
      { lat: -1.2420, lng: -78.6194 },
      { lat: -1.2433, lng: -78.6194 },
      { lat: -1.2433, lng: -78.6212 },
    ],
  },
  {
    nombre: "Zona D",
    color: "#ef4444",
    paths: [
      { lat: -1.2420, lng: -78.6194 },
      { lat: -1.2420, lng: -78.6177 },
      { lat: -1.2433, lng: -78.6177 },
      { lat: -1.2433, lng: -78.6194 },
    ],
  },
];

const AdminDashboard: React.FC = () => {
  const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const [vista, setVista] = useState<"zonas" | "usuarios">("zonas");
  const [usuarios, setUsuarios] = useState<any[]>([]);

  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        const data = await obtenerUsuarios();

        console.log("USUARIOS API:", data);

        setUsuarios(Array.isArray(data) ? data : data.usuarios || []);
      } catch (error) {
        console.error("Error cargando usuarios:", error);
        setUsuarios([]);
      }
    };

    cargarUsuarios();
  }, []);

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h2>Sistema de Seguridad UTA — Panel Administrativo</h2>

        <div className="admin-user">
          <span>MP</span>
          <p>Martin Palacios · Admin</p>
        </div>
      </header>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <p className="section-title">PRINCIPAL</p>

          <button>📊 Dashboard</button>

          <button
            className={vista === "usuarios" ? "active" : ""}
            onClick={() => setVista("usuarios")}
          >
            👥 Usuarios
          </button>

          <button
            className={vista === "zonas" ? "active" : ""}
            onClick={() => setVista("zonas")}
          >
            🗺️ Gestión de zonas
          </button>

          <button>🚨 Alertas</button>

          <p className="section-title">SISTEMA</p>

          <button>⚙️ Configuración</button>
          <button>📋 Logs del sistema</button>
        </aside>

        <main className="admin-content">
          {vista === "usuarios" ? (
            <div>
              <div className="admin-top">
                <div>
                  <h1>Gestión de usuarios</h1>
                  <p>Usuarios registrados en el sistema</p>
                </div>

                <button className="new-zone-btn">+ Nuevo usuario</button>
              </div>

              <div className="users-table-card">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>NOMBRE</th>
                      <th>CORREO</th>
                      <th>ROL</th>
                      <th>ESTADO</th>
                      <th>ZONA</th>
                    </tr>
                  </thead>

                  <tbody>
                    {usuarios.map((usuario) => (
                      <tr key={usuario.id || usuario.usuarioId || usuario.correo}>
                        <td>{usuario.nombre}</td>
                        <td>{usuario.correo}</td>
                        <td>
                          <span className={`badge ${usuario.rol?.toLowerCase()}`}>
                            {usuario.rol}
                          </span>
                        </td>
                        <td>{usuario.estado}</td>
                        <td>{usuario.zonaAsignada || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {usuarios.length === 0 && (
                  <p className="empty-text">No se encontraron usuarios.</p>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="admin-top">
                <div>
                  <h1>Gestión de zonas del campus</h1>
                  <p>Mapa del campus UTA Huachi dividido en zonas</p>
                </div>

                <button className="new-zone-btn">+ Nueva zona</button>
              </div>

              <div className="admin-body">
                <section className="zones-panel">
                  <h3>4 ZONAS DEFINIDAS</h3>

                  {zonas.map((zona) => (
                    <div className="zone-item" key={zona.nombre}>
                      <span style={{ background: zona.color }}></span>
                      <div>
                        <b>{zona.nombre}</b>
                        <p>Campus UTA Huachi</p>
                      </div>
                    </div>
                  ))}

                  <div className="alert-card">
                    <h4>ALERTA ACTIVA</h4>
                    <p>Usuario ubicado en:</p>
                    <b>{alertaUsuario.zona}</b>
                  </div>
                </section>

                <section className="map-panel">
                  <LoadScript googleMapsApiKey={API_KEY}>
                    <GoogleMap
                      mapContainerClassName="google-map"
                      center={centroUTA}
                      zoom={18}
                      mapTypeId="satellite"
                    >
                      {zonas.map((zona) => (
                        <Polygon
                          key={zona.nombre}
                          paths={zona.paths}
                          options={{
                            fillColor: zona.color,
                            fillOpacity: 0.25,
                            strokeColor: zona.color,
                            strokeOpacity: 1,
                            strokeWeight: 3,
                          }}
                        />
                      ))}

                      <Marker
                        position={{
                          lat: alertaUsuario.lat,
                          lng: alertaUsuario.lng,
                        }}
                        title="Ubicación del usuario"
                      />
                    </GoogleMap>
                  </LoadScript>
                </section>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;