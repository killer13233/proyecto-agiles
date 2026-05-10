import { useState } from "react";
import LoginScreen from "./LoginScreen";
import PerfilScreen from "./PerfilScreen";

const Home: React.FC = () => {
  const [isLogged, setIsLogged] = useState(false);

  return isLogged ? (
    <PerfilScreen />
  ) : (
    <LoginScreen onLoginSuccess={() => setIsLogged(true)} />
  );
};

export default Home;