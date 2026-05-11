import axios from "axios";

const API_AUTH = import.meta.env.VITE_API_URL;

export const login = async (
  email: string,
  password: string
) => {
  const response = await axios.post(
    `${API_AUTH}/api/Auth/login`,
    {
      Correo: email,
      Password: password,
    }
  );
  return response.data;
};
