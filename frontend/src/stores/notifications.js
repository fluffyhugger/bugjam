import { defineStore } from "pinia";
import client from "../api/client";

export const useNotificationsStore = defineStore("notifications", {
  state: () => ({
    items: [],
    unreadCount: 0,
    timer: null,
  }),
  actions: {
    async fetch() {
      const { data } = await client.get("/notifications");
      this.items = data.notifications;
      this.unreadCount = data.unreadCount;
    },
    async markRead(id) {
      await client.patch(`/notifications/${id}/read`);
      const n = this.items.find((x) => x._id === id);
      if (n && !n.read) {
        n.read = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      }
    },
    async markAllRead() {
      await client.post("/notifications/read-all");
      this.items.forEach((n) => (n.read = true));
      this.unreadCount = 0;
    },
    startPolling() {
      if (this.timer) return;
      this.fetch();
      this.timer = setInterval(() => this.fetch(), 30000);
    },
    stopPolling() {
      clearInterval(this.timer);
      this.timer = null;
      this.items = [];
      this.unreadCount = 0;
    },
  },
});
