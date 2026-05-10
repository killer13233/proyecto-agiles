import axios from "axios";

const API_AUTH = import.meta.env.VITE_API_AUTH;

export const login = async (
  email: string,
  password: string
) => {

  const response = await axios.post(
    `${API_AUTH}/api/Auth/login`,
    {
      correo: email,
      password,
    }
  );

  return response.data;
};