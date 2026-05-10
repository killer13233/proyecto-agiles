import { useState } from "react";
import LoginScreen from "../screens/LoginScreen";
import PerfilScreen from "../screens/PerfilScreen";
import HomeScreen from "../screens/HomeScreen";

const Home: React.FC = () => {
  const [pantalla, setPantalla] = useState("login");

  if (pantalla === "login") {
    return (
      <LoginScreen
        onLoginSuccess={() => setPantalla("perfil")}
      />
    );
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