import axios from "axios";
import { Preferences } from "@capacitor/preferences";

const API_AUTH = import.meta.env.VITE_API_AUTH;

export const obtenerUsuarios = async () => {
  const { value: token } = await Preferences.get({ key: "token" });

  const response = await axios.get(`${API_AUTH}/api/Usuarios`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};