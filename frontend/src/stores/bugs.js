import { defineStore } from "pinia";
import client from "../api/client";

export const useBugsStore = defineStore("bugs", {
  state: () => ({
    bugs: [],
    meta: null,
    users: [],
    projects: [],
    stats: null,
    loading: false,
    total: 0,
    page: 1,
    pages: 1,
  }),
  actions: {
    async fetchProjects() {
      const { data } = await client.get("/projects");
      this.projects = data.projects;
      return this.projects;
    },
    async createProject(payload) {
      const { data } = await client.post("/projects", payload);
      this.projects.push(data.project);
      return data.project;
    },
    async updateProject(id, payload) {
      const { data } = await client.patch(`/projects/${id}`, payload);
      const i = this.projects.findIndex((p) => p._id === id);
      if (i !== -1) this.projects[i] = data.project;
      return data.project;
    },
    async fetchMeta() {
      if (this.meta) return;
      const { data } = await client.get("/bugs/meta");
      this.meta = data;
    },
    async fetchUsers() {
      const { data } = await client.get("/users");
      this.users = data.users;
    },
    async updateUserRole(id, role) {
      const { data } = await client.patch(`/users/${id}/role`, { role });
      const idx = this.users.findIndex((u) => u.id === id);
      if (idx !== -1) this.users[idx] = data.user;
      return data.user;
    },
    async fetchBugs(filters = {}) {
      this.loading = true;
      try {
        const { data } = await client.get("/bugs", { params: filters });
        this.bugs = data.bugs;
        this.total = data.total;
        this.page = data.page;
        this.pages = data.pages;
      } finally {
        this.loading = false;
      }
    },
    async bulkUpdate(ids, action, value) {
      const { data } = await client.patch("/bugs/bulk", { ids, action, value });
      return data;
    },
    async fetchStats() {
      const { data } = await client.get("/bugs/stats");
      this.stats = data;
    },
    async fetchBug(id) {
      const { data } = await client.get(`/bugs/${id}`);
      return data.bug;
    },
    async createBug(formData) {
      const { data } = await client.post("/bugs", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.bug;
    },
    async updateBug(id, formData) {
      const { data } = await client.patch(`/bugs/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.bug;
    },
    async deleteBug(id) {
      await client.delete(`/bugs/${id}`);
    },
    async deleteAttachment(bugId, objectKey) {
      const { data } = await client.delete(`/bugs/${bugId}/attachments/${encodeURIComponent(objectKey)}`);
      return data.bug;
    },
    async addLink(bugId, type, target) {
      const { data } = await client.post(`/bugs/${bugId}/links`, { type, bugId: target });
      return data.bug;
    },
    async removeLink(bugId, linkedId) {
      const { data } = await client.delete(`/bugs/${bugId}/links/${linkedId}`);
      return data.bug;
    },
    async fetchTimeline(id) {
      const { data } = await client.get(`/bugs/${id}/timeline`);
      return data.items;
    },
    async addComment(id, body) {
      const { data } = await client.post(`/bugs/${id}/comments`, { body });
      return data.comment;
    },
    async editComment(bugId, commentId, body) {
      const { data } = await client.patch(`/bugs/${bugId}/comments/${commentId}`, { body });
      return data.comment;
    },
    async removeComment(bugId, commentId) {
      await client.delete(`/bugs/${bugId}/comments/${commentId}`);
    },
  },
});
