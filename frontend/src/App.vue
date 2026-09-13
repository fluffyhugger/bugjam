<template>
  <div class="min-h-screen">
    <Navbar v-if="auth.isLoggedIn" />
    <main class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { onMounted, watch } from "vue";
import { RouterView } from "vue-router";
import { useAuthStore } from "./stores/auth";
import { useNotificationsStore } from "./stores/notifications";
import Navbar from "./components/Navbar.vue";

const auth = useAuthStore();
const notifications = useNotificationsStore();

// Roles can change server-side while a session is open; the cached copy would go stale.
onMounted(() => {
  if (auth.isLoggedIn) {
    auth.refreshUser();
    notifications.startPolling();
  }
});

watch(
  () => auth.isLoggedIn,
  (loggedIn) => (loggedIn ? notifications.startPolling() : notifications.stopPolling())
);
</script>
