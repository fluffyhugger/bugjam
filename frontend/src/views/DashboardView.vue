<template>
  <div class="space-y-8">
    <div class="card-hard flex flex-col items-start gap-4 bg-yolk p-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="font-display text-3xl font-black">Hey {{ auth.user?.name }} 👋</h1>
        <p class="mt-1 font-semibold">
          {{ auth.isElevated ? `Here's what's on fire across the team.` : `Here's what's on fire today.` }}
        </p>
        <span v-if="auth.isElevated" class="badge mt-2 bg-white">{{ auth.user?.role }}</span>
      </div>
      <div class="flex flex-wrap gap-2">
        <RouterLink v-if="auth.isElevated" to="/insights" class="btn-hard !bg-sky !text-white">
          📊 QA insights
        </RouterLink>
        <RouterLink v-if="auth.isElevated" to="/users" class="btn-hard !bg-white">🧑‍🤝‍🧑 Team</RouterLink>
        <RouterLink to="/bugs/new" class="btn-hard !bg-punch !text-white">+ Report a bug</RouterLink>
      </div>
    </div>

    <section>
      <h2 class="mb-3 font-display text-xl font-bold">
        {{ auth.isElevated ? "Team triage board" : "My triage board" }}
      </h2>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <RouterLink
          v-for="lvl in levels"
          :key="lvl.key"
          :to="{ name: 'bugs', query: { priorityLevel: lvl.key } }"
          class="card-hard flex flex-col items-center gap-1 p-4 transition-transform hover:-translate-y-1"
          :style="{ backgroundColor: lvl.bg }"
          :title="`Show ${lvl.key} bugs`"
        >
          <span class="text-2xl">{{ lvl.emoji }}</span>
          <span class="font-display text-2xl font-black">{{ stats?.byPriorityLevel?.[lvl.key] || 0 }}</span>
          <span class="text-xs font-bold">{{ lvl.key }} · {{ lvl.label }}</span>
        </RouterLink>
      </div>
    </section>

    <section class="grid gap-6 sm:grid-cols-2">
      <div class="card-hard p-5">
        <h3 class="mb-3 font-display font-bold">By status</h3>
        <ul class="space-y-2">
          <li v-for="(count, status) in stats?.byStatus" :key="status" class="flex items-center justify-between">
            <StatusBadge :status="status" />
            <span class="font-black">{{ count }}</span>
          </li>
        </ul>
      </div>
      <div class="card-hard p-5">
        <h3 class="mb-3 font-display font-bold">By bug type</h3>
        <ul class="space-y-2">
          <li v-for="(count, type) in stats?.byBugType" :key="type" class="flex items-center justify-between">
            <span class="badge bg-white">{{ type }}</span>
            <span class="font-black">{{ count }}</span>
          </li>
        </ul>
      </div>
    </section>

    <section>
      <div class="mb-3 flex items-center justify-between">
        <h2 class="font-display text-xl font-bold">Recent bugs</h2>
        <RouterLink to="/bugs" class="font-bold underline">See all →</RouterLink>
      </div>
      <div v-if="bugsStore.bugs.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <BugCard v-for="bug in bugsStore.bugs.slice(0, 6)" :key="bug._id" :bug="bug" />
      </div>
      <p v-else class="font-semibold text-ink/60">No bugs yet. Nice... or suspicious. 👀</p>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useAuthStore } from "../stores/auth";
import { useBugsStore } from "../stores/bugs";
import BugCard from "../components/BugCard.vue";
import StatusBadge from "../components/StatusBadge.vue";

const auth = useAuthStore();
const bugsStore = useBugsStore();
const stats = computed(() => bugsStore.stats);

const levels = [
  { key: "P0", emoji: "🔥", label: "drop everything", bg: "#FF4FA3" },
  { key: "P1", emoji: "⚡", label: "very soon", bg: "#FF7A45" },
  { key: "P2", emoji: "⏳", label: "this sprint", bg: "#FFD400" },
  { key: "P3", emoji: "🌱", label: "whenever", bg: "#3DDC97" },
  { key: "P4", emoji: "💤", label: "someday", bg: "#D9D9D9" },
];

onMounted(async () => {
  await Promise.all([bugsStore.fetchStats(), bugsStore.fetchBugs()]);
});
</script>
