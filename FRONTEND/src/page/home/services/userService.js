import axios from "axios";

export const fetchAboutMe = async () => {
  const token = localStorage.getItem("token");

  const res = await axios.get(`${API_BASE_URL}/aboutme`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data.data;
};
