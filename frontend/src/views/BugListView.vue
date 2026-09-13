<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="font-display text-3xl font-black">{{ auth.isElevated ? "All team bugs 🐛" : "My bugs 🐛" }}</h1>
        <p v-if="!auth.isElevated" class="font-medium text-ink/60">Bugs you reported or are assigned to.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button class="btn-hard !bg-white" @click="exportCsv">⬇ Export CSV</button>
        <RouterLink to="/bugs/new" class="btn-hard !bg-punch !text-white">+ Report bug</RouterLink>
      </div>
    </div>

    <div class="card-hard grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
      <input v-model="filters.q" placeholder="Search id, title, steps..." class="input-hard" @input="debouncedFetch" />
      <SelectHard v-model="filters.project" :options="projectOptions" @change="reset" />
      <SelectHard v-model="filters.module" :options="moduleOptions" @change="reset" />
      <SelectHard v-model="filters.status" :options="opts(meta?.statuses, 'Status')" :colors="STATUS_COLORS" @change="reset" />
      <SelectHard v-model="filters.severity" :options="opts(meta?.severities, 'Severity')" :colors="SEVERITY_COLORS" @change="reset" />
      <SelectHard v-model="filters.priority" :options="opts(meta?.priorities, 'Priority')" :colors="PRIORITY_COLORS" @change="reset" />
      <SelectHard v-model="filters.priorityLevel" :options="opts(meta?.priorityLevels, 'Level')" :colors="LEVEL_COLORS" @change="reset" />
      <SelectHard v-model="filters.bugType" :options="opts(meta?.bugTypes, 'Type')" @change="reset" />
      <SelectHard v-model="sort" :options="sortOptions" @change="reset" />
    </div>

    <div v-if="activeFilters.length" class="flex flex-wrap items-center gap-2">
      <span class="text-sm font-bold text-ink/60">Filtered by:</span>
      <span v-for="f in activeFilters" :key="f.key" class="badge bg-white">
        {{ f.label }}
        <button class="ml-2 font-black" title="remove" @click="clearFilter(f.key)">✕</button>
      </span>
      <button class="text-sm font-bold underline" @click="clearAll">Clear all</button>
    </div>

    <div v-if="auth.isElevated && selected.length" class="card-hard flex flex-wrap items-center gap-3 bg-yolk p-4">
      <span class="font-bold">{{ selected.length }} selected</span>
      <div class="w-44">
        <SelectHard v-model="bulkStatus" :options="opts(meta?.statuses, 'Set status')" :colors="STATUS_COLORS" @change="applyStatus" />
      </div>
      <div class="w-44">
        <SelectHard v-model="bulkAssignee" :options="assigneeOptions" @change="applyAssignee" />
      </div>
      <button class="btn-hard !bg-punch !text-white !py-2 text-sm" @click="bulkDelete">Delete</button>
      <button class="ml-auto text-sm font-bold underline" @click="selected = []">Clear selection</button>
    </div>

    <div v-if="bugsStore.loading" class="font-bold">Loading...</div>
    <template v-else-if="bugsStore.bugs.length">
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="bug in bugsStore.bugs" :key="bug._id" class="relative">
          <input
            v-if="auth.isElevated"
            type="checkbox"
            class="absolute -left-1 -top-1 z-10 h-5 w-5 cursor-pointer accent-punch"
            :checked="selected.includes(bug._id)"
            @change="toggle(bug._id)"
          />
          <BugCard :bug="bug" />
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm font-semibold text-ink/60">
          Showing {{ bugsStore.bugs.length }} of {{ bugsStore.total }} · page {{ bugsStore.page }}/{{ bugsStore.pages }}
        </p>
        <div class="flex gap-2">
          <button class="btn-hard !bg-white !py-2 text-sm" :disabled="bugsStore.page <= 1" @click="go(bugsStore.page - 1)">
            ← Prev
          </button>
          <button
            class="btn-hard !bg-white !py-2 text-sm"
            :disabled="bugsStore.page >= bugsStore.pages"
            @click="go(bugsStore.page + 1)"
          >
            Next →
          </button>
        </div>
      </div>
    </template>
    <p v-else class="font-semibold text-ink/60">No bugs match those filters.</p>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useBugsStore } from "../stores/bugs";
import { useAuthStore } from "../stores/auth";
import client from "../api/client";
import BugCard from "../components/BugCard.vue";
import SelectHard from "../components/SelectHard.vue";
import { SEVERITY_COLORS, PRIORITY_COLORS, STATUS_COLORS, LEVEL_COLORS } from "../utils/palette";

const bugsStore = useBugsStore();
const auth = useAuthStore();
const route = useRoute();
const meta = computed(() => bugsStore.meta);

const filters = reactive({
  q: "",
  project: "",
  module: "",
  status: "",
  severity: "",
  priority: "",
  priorityLevel: "",
  bugType: "",
  assignee: "",
});
const sort = ref("newest");
const page = ref(1);
const selected = ref([]);
const bulkStatus = ref("");
const bulkAssignee = ref("");

const opts = (values, label) => [
  { value: "", label: `${label}: all` },
  ...(values || []).map((v) => ({ value: v, label: v })),
];
const projectOptions = computed(() => [
  { value: "", label: "Project: all" },
  ...bugsStore.projects.map((p) => ({ value: p._id, label: `${p.key} · ${p.name}` })),
]);
// Narrow to the chosen project's sites/apps, or offer every one when no project is picked.
const moduleOptions = computed(() => {
  const source = filters.project
    ? bugsStore.projects.find((p) => p._id === filters.project)?.modules || []
    : bugsStore.projects.flatMap((p) => p.modules || []);
  return [
    { value: "", label: "Site/app: all" },
    ...[...new Set(source)].map((m) => ({ value: m, label: m })),
  ];
});
const assigneeOptions = computed(() => [
  { value: "", label: "Assign to..." },
  ...bugsStore.users.map((u) => ({ value: u.id, label: u.name })),
]);
const sortOptions = [
  { value: "newest", label: "Sort: newest" },
  { value: "oldest", label: "Sort: oldest" },
  { value: "updated", label: "Sort: recently updated" },
  { value: "priority", label: "Sort: triage level" },
  { value: "severity", label: "Sort: severity" },
  { value: "status", label: "Sort: status" },
];

const queryParams = () => ({
  ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
  sort: sort.value,
  page: page.value,
});

const FILTER_LABELS = {
  q: "Search",
  project: "Project",
  module: "Site/app",
  status: "Status",
  severity: "Severity",
  priority: "Priority",
  priorityLevel: "Level",
  bugType: "Type",
  assignee: "Assignee",
};

const activeFilters = computed(() =>
  Object.entries(filters)
    .filter(([, v]) => v)
    .map(([key, value]) => {
      let shown = value;
      if (key === "project") shown = bugsStore.projects.find((p) => p._id === value)?.key || value;
      if (key === "assignee") {
        shown = value === "none" ? "Unassigned" : bugsStore.users.find((u) => u.id === value)?.name || value;
      }
      return { key, label: `${FILTER_LABELS[key]}: ${shown}` };
    })
);

function clearFilter(key) {
  filters[key] = "";
  reset();
}

function clearAll() {
  Object.keys(filters).forEach((k) => (filters[k] = ""));
  reset();
}

let timer;
function debouncedFetch() {
  clearTimeout(timer);
  timer = setTimeout(reset, 300);
}

function fetch() {
  return bugsStore.fetchBugs(queryParams());
}

function reset() {
  page.value = 1;
  selected.value = [];
  return fetch();
}

function go(p) {
  page.value = p;
  selected.value = [];
  fetch();
}

function toggle(id) {
  const i = selected.value.indexOf(id);
  if (i === -1) selected.value.push(id);
  else selected.value.splice(i, 1);
}

async function runBulk(action, value) {
  await bugsStore.bulkUpdate(selected.value, action, value);
  selected.value = [];
  bulkStatus.value = "";
  bulkAssignee.value = "";
  await fetch();
}

const applyStatus = (v) => v && runBulk("status", v);
const applyAssignee = (v) => v && runBulk("assignee", v);

async function bulkDelete() {
  if (!confirm(`Delete ${selected.value.length} bug(s)? This cannot be undone.`)) return;
  await runBulk("delete");
}

async function exportCsv() {
  const res = await client.get("/bugs/export.csv", {
    params: Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
    responseType: "blob",
  });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bugjam-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Charts on the Insights page link here with filters in the query string.
function applyRouteQuery() {
  for (const key of Object.keys(filters)) {
    filters[key] = route.query[key] ? String(route.query[key]) : "";
  }
}

watch(() => route.query, () => {
  applyRouteQuery();
  reset();
});

onMounted(async () => {
  applyRouteQuery();
  await Promise.all([bugsStore.fetchMeta(), bugsStore.fetchProjects(), bugsStore.fetchUsers()]);
  await fetch();
});
</script>
