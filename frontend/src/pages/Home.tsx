import { useState } from "react";
import LoginScreen from "../screens/LoginScreen";
import PerfilScreen from "../screens/PerfilScreen";
import HomeScreen from "../screens/HomeScreen";
import AdminDashboard from "../screens/AdminDashboard";

const Home: React.FC = () => {
  const [pantalla, setPantalla] = useState("login");

  if (pantalla === "login") {
    return (
      <LoginScreen
        onLoginSuccess={(rol) => {
        console.log("ROL RECIBIDO EN HOME:", rol);

        if (rol === "Administrador") {
          setPantalla("admin");
        } else {
          setPantalla("perfil");
        }
      }}
      />
    );
  }
  if (pantalla === "admin") {
    return <AdminDashboard />;
  }


  if (pantalla === "perfil") {
    return (
      <PerfilScreen
        onIrInicio={() => setPantalla("login")}
        onIrAlarma={() => setPantalla("home")}
      />
    );
  }

  return (
    <HomeScreen
      onVerPerfil={() => setPantalla("perfil")}
    />
  );
};

export default Home;