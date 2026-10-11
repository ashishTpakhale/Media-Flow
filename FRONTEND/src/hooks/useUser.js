import { useEffect } from "react";
import { useUserStore } from "../page/home/store/userStore";
import { fetchAboutMe } from "../page/home/services/userService";

export const useUser = () => {
  const { user, setUser } = useUserStore();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const cachedUser = localStorage.getItem("userData");

        if (cachedUser) {
          setUser(JSON.parse(cachedUser));
          return;
        }

        const freshUser = await fetchAboutMe();
        localStorage.setItem("userData", JSON.stringify(freshUser));
        setUser(freshUser);

      } catch (err) {
        console.error("User fetch failed:", err);
      }
    };

    if (!user) loadUser();
  }, [user, setUser]);
};
