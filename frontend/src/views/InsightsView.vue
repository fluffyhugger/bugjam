<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 id="insights-heading" class="font-display text-3xl font-black">QA insights 📊</h1>
        <p class="font-medium text-ink/60">Every bug across the team.</p>
      </div>
      <button id="insights-toggle-tables" class="btn-hard !bg-white !py-2 text-sm" @click="showTables = !showTables">
        {{ showTables ? "Hide data tables" : "Show data tables" }}
      </button>
    </div>

    <div v-if="stats" class="space-y-6">
      <!-- hero + KPIs -->
      <section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="card-hard bg-yolk p-4">
          <p class="text-xs font-bold uppercase tracking-wide text-ink/70">Open bugs</p>
          <p id="insights-open-count" class="mt-1 font-display text-5xl font-black leading-none">{{ stats.open }}</p>
          <p class="mt-1 text-xs font-semibold text-ink/60">of {{ stats.total }} reported</p>
        </div>
        <StatTile id="insights-critical" label="Needs attention" :value="stats.critical" hint="P0 + P1 combined" />
        <StatTile id="insights-done" label="Done" :value="stats.done" hint="resolved, verified or closed" />
        <StatTile id="insights-unassigned" label="Unassigned" :value="unassigned" hint="nobody picked these up" />
      </section>

      <!-- trend -->
      <section class="card-hard p-5">
        <h2 class="font-display text-lg font-bold">Bugs reported per day</h2>
        <p class="mb-2 text-sm font-medium text-ink/60">Last 30 days</p>
        <TrendHard :series="stats.trend" />
      </section>

      <div class="grid gap-6 lg:grid-cols-2">
        <section class="card-hard p-5">
          <h2 class="font-display text-lg font-bold">By triage level</h2>
          <p class="mb-3 text-sm font-medium text-ink/60">
            Auto-calculated from severity × priority — click a level to see those bugs
          </p>
          <BarsHard id="chart-levels" :items="levelItems" clickable @select="(i) => drillDown({ priorityLevel: i.label })" />
        </section>

        <section class="card-hard p-5">
          <h2 class="font-display text-lg font-bold">By status</h2>
          <p class="mb-3 text-sm font-medium text-ink/60">Where everything sits right now</p>
          <BarsHard id="chart-status" :items="statusItems" clickable @select="(i) => drillDown({ status: i.label })" />
        </section>

        <section class="card-hard p-5">
          <h2 class="font-display text-lg font-bold">By bug type</h2>
          <p class="mb-3 text-sm font-medium text-ink/60">What kind of bugs the team finds</p>
          <BarsHard id="chart-type" :items="typeItems" clickable @select="(i) => drillDown({ bugType: i.label })" />
        </section>

        <section v-if="moduleItems.length" class="card-hard p-5">
          <h2 class="font-display text-lg font-bold">By site / app</h2>
          <p class="mb-3 text-sm font-medium text-ink/60">Which product the bugs land on</p>
          <BarsHard id="chart-module" :items="moduleItems" clickable @select="(i) => drillDown({ module: i.label })" />
        </section>

        <section class="card-hard p-5">
          <h2 class="font-display text-lg font-bold">Workload per person</h2>
          <p class="mb-3 text-sm font-medium text-ink/60">Bugs currently assigned</p>
          <BarsHard id="chart-assignee" :items="assigneeItems" clickable @select="drillDownAssignee" />
        </section>
      </div>

      <section class="card-hard p-5">
        <h2 class="font-display text-lg font-bold">Severity × priority</h2>
        <p class="mb-3 text-sm font-medium text-ink/60">
          Where bugs cluster on the triage matrix — darker means more bugs, click a cell to see them
        </p>
        <HeatmapHard
          v-if="meta"
          :matrix="stats.matrix"
          :rows="meta.severities"
          :columns="meta.priorities"
          @select="drillDown"
        />
      </section>

      <!-- table view twin -->
      <section v-if="showTables" id="insights-tables" class="card-hard space-y-6 p-5">
        <h2 class="font-display text-lg font-bold">Data tables</h2>
        <div v-for="t in tables" :key="t.title">
          <h3 class="mb-2 text-sm font-bold uppercase tracking-wide text-ink/60">{{ t.title }}</h3>
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b-2 border-ink text-left">
                <th class="py-1">{{ t.key }}</th>
                <th class="py-1 text-right">Bugs</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in t.items" :key="row.label" class="border-b border-ink/10">
                <td class="py-1 font-semibold">{{ row.label }}</td>
                <td class="py-1 text-right tabular-nums">{{ row.value }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <p v-else class="font-bold">Loading insights...</p>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useBugsStore } from "../stores/bugs";
import BarsHard from "../components/charts/BarsHard.vue";
import HeatmapHard from "../components/charts/HeatmapHard.vue";
import TrendHard from "../components/charts/TrendHard.vue";
import StatTile from "../components/charts/StatTile.vue";
import { LEVEL_COLORS, STATUS_COLORS } from "../utils/palette";

const bugsStore = useBugsStore();
const router = useRouter();
const stats = computed(() => bugsStore.stats);
const meta = computed(() => bugsStore.meta);
const showTables = ref(false);

// Every chart row is a way into the filtered list.
const drillDown = (query) => router.push({ name: "bugs", query });

function drillDownAssignee(item) {
  if (item.label === "Unassigned") return drillDown({ assignee: "none" });
  const user = bugsStore.users.find((u) => u.name === item.label);
  if (user) drillDown({ assignee: user.id });
}

const toItems = (map, order, colors) =>
  (order || []).map((key) => ({ label: key, value: map?.[key] || 0, color: colors?.[key] }));

const levelItems = computed(() => toItems(stats.value.byPriorityLevel, meta.value?.priorityLevels, LEVEL_COLORS));
const statusItems = computed(() => toItems(stats.value.byStatus, meta.value?.statuses, STATUS_COLORS));
const typeItems = computed(() =>
  toItems(stats.value.byBugType, meta.value?.bugTypes).sort((a, b) => b.value - a.value)
);
const moduleItems = computed(() =>
  Object.entries(stats.value?.byModule || {})
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
);
const assigneeItems = computed(() =>
  (stats.value.byAssignee || []).map((a) => ({ label: a.name, value: a.count }))
);
const unassigned = computed(
  () => (stats.value.byAssignee || []).find((a) => a.name === "Unassigned")?.count || 0
);

const tables = computed(() => [
  { title: "By triage level", key: "Level", items: levelItems.value },
  { title: "By status", key: "Status", items: statusItems.value },
  { title: "By bug type", key: "Type", items: typeItems.value },
  { title: "By site / app", key: "Site/app", items: moduleItems.value },
  { title: "Workload per person", key: "Assignee", items: assigneeItems.value },
  {
    title: "Bugs reported per day",
    key: "Date",
    items: (stats.value.trend || []).map((d) => ({ label: d.date, value: d.count })),
  },
]);

onMounted(async () => {
  await Promise.all([bugsStore.fetchMeta(), bugsStore.fetchStats(), bugsStore.fetchUsers()]);
});
</script>
