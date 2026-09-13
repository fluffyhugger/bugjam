<template>
  <header class="border-b-2 border-ink bg-cream">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
      <!-- Lockup per the logo handoff: mark 28px, 14px gap, wordmark 19px/500/-0.01em. -->
      <RouterLink to="/" class="flex items-center gap-[14px]">
        <BugJamMark :size="28" color="#141311" />
        <span class="font-display text-[19px] font-medium tracking-[-0.01em] text-brandink">BugJam</span>
      </RouterLink>

      <nav class="flex items-center gap-2 sm:gap-4">
        <RouterLink
          to="/"
          class="hidden rounded-lg px-3 py-1.5 font-semibold sm:block"
          :class="isActive('dashboard') ? 'bg-ink text-cream' : 'hover:bg-ink/10'"
        >
          Dashboard
        </RouterLink>
        <RouterLink
          to="/bugs"
          class="hidden rounded-lg px-3 py-1.5 font-semibold sm:block"
          :class="isActive('bugs') ? 'bg-ink text-cream' : 'hover:bg-ink/10'"
        >
          All Bugs
        </RouterLink>
        <RouterLink
          v-if="auth.isElevated"
          to="/insights"
          class="hidden rounded-lg px-3 py-1.5 font-semibold sm:block"
          :class="isActive('insights') ? 'bg-ink text-cream' : 'hover:bg-ink/10'"
        >
          Insights
        </RouterLink>
        <RouterLink
          v-if="auth.isElevated"
          to="/projects"
          class="hidden rounded-lg px-3 py-1.5 font-semibold lg:block"
          :class="isActive('projects') ? 'bg-ink text-cream' : 'hover:bg-ink/10'"
        >
          Projects
        </RouterLink>
        <RouterLink
          v-if="auth.isElevated"
          to="/users"
          class="hidden rounded-lg px-3 py-1.5 font-semibold sm:block"
          :class="isActive('users') ? 'bg-ink text-cream' : 'hover:bg-ink/10'"
        >
          Team
        </RouterLink>
        <RouterLink to="/bugs/new" class="btn-hard !bg-punch !text-white !px-4 !py-2 text-sm">
          + Report Bug
        </RouterLink>

        <div class="ml-2 flex items-center gap-2">
          <NotificationBell />
          <RouterLink
            to="/account"
            class="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink font-bold"
            :style="{ backgroundColor: auth.user?.avatarColor }"
            :title="`${auth.user?.role} — account settings`"
          >
            {{ initials }}
          </RouterLink>
          <button class="text-sm font-semibold underline-offset-2 hover:underline" @click="handleLogout">
            Log out
          </button>
        </div>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import BugJamMark from "./BugJamMark.vue";
import NotificationBell from "./NotificationBell.vue";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const isActive = (name) => route.name === name;

const initials = computed(() =>
  (auth.user?.name || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
);

function handleLogout() {
  auth.logout();
  router.push({ name: "login" });
}
</script>
