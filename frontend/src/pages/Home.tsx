import { useState, useEffect } from "react";
import LoginScreen from "../screens/LoginScreen";
import PerfilScreen from "../screens/PerfilScreen";
import HomeScreen from "../screens/HomeScreen";
import AdminDashboard from "../screens/AdminDashboard";
import GuardiaScreen from "../screens/GuardiaScreen";
import GuardiaInfoScreen from "../screens/GuardiaInfoScreen";

const Home: React.FC = () => {
  const [pantalla, setPantalla] = useState<string | null>(null); // null = cargando

  // ✅ Al cargar, verificar si ya hay sesión
  useEffect(() => {
    const token = localStorage.getItem("token");
    const rol = localStorage.getItem("rol");

    if (token && rol) {
      if (rol === "Administrador") setPantalla("admin");
      else if (rol === "Guardia") setPantalla("guardia-info");
      else setPantalla("perfil");
    } else {
      setPantalla("login");
    }
  }, []);

  // ✅ Guardar rol al hacer login
  const handleLoginSuccess = (rol: string) => {
    console.log("ROL RECIBIDO EN HOME:", rol);
    localStorage.setItem("rol", rol);
    if (rol === "Administrador") setPantalla("admin");
    else if (rol === "Guardia") setPantalla("guardia-info");
    else setPantalla("perfil");
  };

  // ✅ Limpiar al cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("rol");
    setPantalla("login");
  };

  // Mientras verifica sesión, no mostrar nada
  if (pantalla === null) return null;

  if (pantalla === "login") {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

    if (pantalla === "admin") {
      return <AdminDashboard />;
    }
    
    if (pantalla === "guardia-info") {
      return (
        <GuardiaInfoScreen 
          onVerAlertas={() => setPantalla("guardia")} 
          onCerrarSesion={handleLogout} 
        />
      );
    }

    if (pantalla === "guardia") {
      return <GuardiaScreen onIrInicio={() => setPantalla("guardia-info")} />;
    }


  if (pantalla === "perfil") {
    return (
      <PerfilScreen
        onIrInicio={handleLogout}
        onIrAlarma={() => setPantalla("home")}
      />
    );
  }

  return <HomeScreen onVerPerfil={() => setPantalla("perfil")} />;
};

export default Home;