<template>
  <div class="space-y-6">
    <h1 class="font-display text-3xl font-black">Projects 🗂️</h1>

    <form id="project-form" class="card-hard grid gap-3 p-5 sm:grid-cols-[1fr_8rem_auto]" @submit.prevent="create">
      <div>
        <label class="label-hard">Name</label>
        <input id="project-name" v-model="draft.name" required class="input-hard" placeholder="Mobile app" />
      </div>
      <div>
        <label class="label-hard">Key</label>
        <input id="project-key" v-model="draft.key" required class="input-hard uppercase" placeholder="MOB" maxlength="6" />
      </div>
      <div class="flex items-end">
        <button id="project-create" type="submit" class="btn-hard w-full" :disabled="saving">Add project</button>
      </div>
      <p v-if="error" id="project-error" class="rounded-lg bg-punch/20 p-2 text-sm font-semibold sm:col-span-3">{{ error }}</p>
      <p class="text-xs font-semibold text-ink/50 sm:col-span-3">
        The key prefixes every bug id in that project (MOB-0001) and can't be changed later.
      </p>
    </form>

    <div class="space-y-4">
      <div v-for="p in bugsStore.projects" :key="p._id" :id="`project-${p.key}`" class="card-hard p-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <span :id="`project-key-${p.key}`" class="badge bg-yolk font-mono">{{ p.key }}</span>
            <span :id="`project-name-${p.key}`" class="font-display text-lg font-bold">{{ p.name }}</span>
            <span v-if="p.archived" class="badge bg-white">archived</span>
          </div>
          <button :id="`project-archive-${p.key}`" class="btn-hard !bg-white !px-3 !py-1.5 text-xs" @click="toggleArchive(p)">
            {{ p.archived ? "Unarchive" : "Archive" }}
          </button>
        </div>

        <div class="mt-4">
          <label class="label-hard">{{ p.key === "APP" ? "Apps" : "Websites" }} in this project</label>
          <div class="flex flex-wrap items-center gap-2">
            <span v-for="m in p.modules" :key="m" :id="`module-${p.key}-${m.replace(/\s+/g, '-').toLowerCase()}`" class="badge bg-sky/40">
              {{ m }}
              <button :id="`module-remove-${p.key}-${m.replace(/\s+/g, '-').toLowerCase()}`" class="ml-2 font-black" title="remove" @click="removeFrom(p, 'modules', m)">✕</button>
            </span>
            <input
              :id="`module-input-${p.key}`"
              v-model="moduleDraft[p._id]"
              class="input-hard !w-44 !py-1.5 text-sm"
              :placeholder="p.key === 'APP' ? 'iOS app' : 'Shop website'"
              @keydown.enter.prevent="addTo(p, 'modules', moduleDraft)"
            />
            <button :id="`module-add-${p.key}`" class="btn-hard !bg-white !px-3 !py-1.5 text-xs" @click="addTo(p, 'modules', moduleDraft)">
              Add
            </button>
          </div>
        </div>

        <div class="mt-4">
          <label class="label-hard">Versions</label>
          <div class="flex flex-wrap items-center gap-2">
            <span v-for="v in p.versions" :key="v" :id="`version-${p.key}-${v}`" class="badge bg-white font-mono">
              {{ v }}
              <button :id="`version-remove-${p.key}-${v}`" class="ml-2 font-black" title="remove" @click="removeFrom(p, 'versions', v)">✕</button>
            </span>
            <input
              :id="`version-input-${p.key}`"
              v-model="versionDraft[p._id]"
              class="input-hard !w-32 !py-1.5 text-sm"
              placeholder="1.2.0"
              @keydown.enter.prevent="addTo(p, 'versions', versionDraft)"
            />
            <button :id="`version-add-${p.key}`" class="btn-hard !bg-white !px-3 !py-1.5 text-xs" @click="addTo(p, 'versions', versionDraft)">
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import { useBugsStore } from "../stores/bugs";

const bugsStore = useBugsStore();
const draft = reactive({ name: "", key: "" });
const versionDraft = reactive({});
const moduleDraft = reactive({});
const error = ref("");
const saving = ref(false);

async function create() {
  error.value = "";
  saving.value = true;
  try {
    await bugsStore.createProject({ name: draft.name, key: draft.key.toUpperCase() });
    draft.name = "";
    draft.key = "";
  } catch (e) {
    error.value = e.response?.data?.error || "Could not create project";
  } finally {
    saving.value = false;
  }
}

const toggleArchive = (p) => bugsStore.updateProject(p._id, { archived: !p.archived });

async function addTo(project, field, drafts) {
  const value = (drafts[project._id] || "").trim();
  if (!value) return;
  await bugsStore.updateProject(project._id, { [field]: [...project[field], value] });
  drafts[project._id] = "";
}

const removeFrom = (project, field, value) =>
  bugsStore.updateProject(project._id, { [field]: project[field].filter((x) => x !== value) });

onMounted(() => bugsStore.fetchProjects());
</script>
