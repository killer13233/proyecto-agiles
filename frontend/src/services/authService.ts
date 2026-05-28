import axios from "axios";
 
const API_BASE = import.meta.env.VITE_API_URL || "http://192.168.100.14:8090";
 
export const login = async (
  email: string,
  password: string
) => {
  const response = await axios.post(
    `${API_BASE}/api/Auth/login`,
    {
      correo: email,
      password: password,
    }
  );
  return response.data;
};

