import { defineStore } from "pinia";
import client from "../api/client";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("bugjam_token") || null,
    user: JSON.parse(localStorage.getItem("bugjam_user") || "null"),
  }),
  getters: {
    isLoggedIn: (state) => !!state.token,
    isElevated: (state) => state.user?.role === "Head of QA" || state.user?.role === "Admin",
  },
  actions: {
    setSession(token, user) {
      this.token = token;
      this.user = user;
      localStorage.setItem("bugjam_token", token);
      localStorage.setItem("bugjam_user", JSON.stringify(user));
    },
    async refreshUser() {
      const { data } = await client.get("/auth/me");
      this.user = data.user;
      localStorage.setItem("bugjam_user", JSON.stringify(data.user));
    },
    async login(email, password) {
      const { data } = await client.post("/auth/login", { email, password });
      this.setSession(data.token, data.user);
    },
    async register(name, email, password) {
      const { data } = await client.post("/auth/register", { name, email, password });
      this.setSession(data.token, data.user);
    },
    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem("bugjam_token");
      localStorage.removeItem("bugjam_user");
    },
  },
});
