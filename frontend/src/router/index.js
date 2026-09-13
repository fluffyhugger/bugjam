import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";

const routes = [
  { path: "/login", name: "login", component: () => import("../views/LoginView.vue"), meta: { guest: true } },
  { path: "/register", name: "register", component: () => import("../views/RegisterView.vue"), meta: { guest: true } },
  { path: "/", name: "dashboard", component: () => import("../views/DashboardView.vue") },
  { path: "/bugs", name: "bugs", component: () => import("../views/BugListView.vue") },
  { path: "/bugs/new", name: "bug-new", component: () => import("../views/BugFormView.vue") },
  { path: "/bugs/:id", name: "bug-detail", component: () => import("../views/BugDetailView.vue") },
  { path: "/bugs/:id/edit", name: "bug-edit", component: () => import("../views/BugFormView.vue") },
  { path: "/account", name: "account", component: () => import("../views/AccountView.vue") },
  { path: "/insights", name: "insights", component: () => import("../views/InsightsView.vue"), meta: { requiresElevated: true } },
  { path: "/projects", name: "projects", component: () => import("../views/ProjectsView.vue"), meta: { requiresElevated: true } },
  { path: "/users", name: "users", component: () => import("../views/UsersView.vue"), meta: { requiresElevated: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (!to.meta.guest && !auth.isLoggedIn) return { name: "login" };
  if (to.meta.guest && auth.isLoggedIn) return { name: "dashboard" };
  if (to.meta.requiresElevated && !auth.isElevated) return { name: "dashboard" };
  return true;
});

export default router;
