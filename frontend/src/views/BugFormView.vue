<template>
  <div class="mx-auto max-w-2xl space-y-6">
    <h1 class="font-display text-3xl font-black">{{ isEdit ? "Edit bug" : "Report a bug 🐞" }}</h1>

    <form class="card-hard space-y-5 p-6" @submit.prevent="submit">
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="label-hard">Project</label>
          <SelectHard v-model="form.project" :options="projectOptions" placeholder="Select project" />
        </div>
        <div>
          <label class="label-hard">{{ moduleLabel }}</label>
          <SelectHard
            v-if="moduleOptions.length > 1"
            v-model="form.module"
            :options="moduleOptions"
            placeholder="Not specified"
          />
          <p v-else class="py-2.5 text-sm font-semibold text-ink/50">
            No {{ moduleLabel.toLowerCase() }} set up for this project yet.
          </p>
        </div>
      </div>

      <div>
        <label class="label-hard">Title</label>
        <input v-model="form.title" required class="input-hard" placeholder="Login button does nothing on Safari" />
      </div>

      <div>
        <label class="label-hard">Description</label>
        <textarea v-model="form.description" rows="4" class="input-hard" placeholder="What happened?"></textarea>
      </div>

      <div>
        <label class="label-hard">Steps to reproduce</label>
        <div v-for="(step, i) in form.stepsToReproduce" :key="i" class="mb-2 flex gap-2">
          <span class="flex h-10 w-8 shrink-0 items-center justify-center font-black">{{ i + 1 }}.</span>
          <input v-model="form.stepsToReproduce[i]" class="input-hard" placeholder="Click the login button" />
          <button type="button" class="btn-hard !bg-white px-3" @click="removeStep(i)">✕</button>
        </div>
        <button type="button" class="font-bold underline" @click="addStep">+ Add step</button>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="label-hard">Severity</label>
          <SelectHard
            v-model="form.severity"
            :options="meta?.severities || []"
            :colors="SEVERITY_COLORS"
            placeholder="Select severity"
          />
        </div>
        <div>
          <label class="label-hard">Priority</label>
          <SelectHard
            v-model="form.priority"
            :options="meta?.priorities || []"
            :colors="PRIORITY_COLORS"
            placeholder="Select priority"
          />
        </div>
      </div>

      <div v-if="previewLevel" class="flex items-center gap-2 rounded-xl border-2 border-dashed border-ink p-3">
        <span class="text-sm font-bold">Auto-calculated triage level:</span>
        <PriorityLevelBadge :level="previewLevel" />
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="label-hard">Bug type</label>
          <SelectHard v-model="form.bugType" :options="meta?.bugTypes || []" placeholder="Select type" />
        </div>
        <div>
          <label class="label-hard">Assignee</label>
          <SelectHard
            v-if="canEditAssignee"
            v-model="form.assignee"
            :options="assigneeOptions"
            placeholder="Unassigned"
          />
          <p v-else class="py-2.5 font-semibold">
            {{ bugsStore.users.find((u) => u.id === form.assignee)?.name || "Unassigned" }}
          </p>
        </div>
      </div>

      <!-- Versions are triage information, filled in while editing — not at report time. -->
      <div v-if="isEdit" class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="label-hard">Found in version</label>
          <SelectHard v-model="form.foundInVersion" :options="versionOptions" placeholder="Not specified" />
        </div>
        <div>
          <label class="label-hard">Fixed in version</label>
          <SelectHard v-model="form.fixedInVersion" :options="versionOptions" placeholder="Not fixed yet" />
        </div>
      </div>

      <div v-if="isEdit">
        <label class="label-hard">Status</label>
        <SelectHard
          v-if="canEditStatus"
          v-model="form.status"
          :options="selectableStatuses || []"
          :colors="STATUS_COLORS"
        />
        <StatusBadge v-else :status="form.status" />
      </div>

      <div>
        <label class="label-hard">Attachments</label>
        <FileDropzone @update:files="(f) => (files = f)" />
      </div>

      <p v-if="error" class="rounded-lg bg-punch/20 p-2 text-sm font-semibold">{{ error }}</p>

      <button type="submit" class="btn-hard w-full" :disabled="submitting">
        {{ submitting ? "Saving..." : isEdit ? "Save changes" : "Submit bug" }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useBugsStore } from "../stores/bugs";
import { useAuthStore } from "../stores/auth";
import FileDropzone from "../components/FileDropzone.vue";
import PriorityLevelBadge from "../components/PriorityLevelBadge.vue";
import StatusBadge from "../components/StatusBadge.vue";
import SelectHard from "../components/SelectHard.vue";
import { computePriorityLevel } from "../utils/priorityMatrix";
import { SEVERITY_COLORS, PRIORITY_COLORS, STATUS_COLORS } from "../utils/palette";

const route = useRoute();
const router = useRouter();
const bugsStore = useBugsStore();
const auth = useAuthStore();
const meta = computed(() => bugsStore.meta);

const isEdit = computed(() => route.name === "bug-edit");
const canEditAssignee = computed(() => !isEdit.value || auth.isElevated);
const selectableStatuses = computed(() =>
  auth.isElevated ? meta.value?.statuses : meta.value?.statuses?.filter((s) => !meta.value.elevatedOnlyStatuses.includes(s))
);
const canEditStatus = computed(
  () => auth.isElevated || !meta.value?.elevatedOnlyStatuses.includes(form.status)
);
const assigneeOptions = computed(() => [
  { value: "", label: "Unassigned" },
  ...bugsStore.users.map((u) => ({ value: u.id, label: u.name })),
]);
const projectOptions = computed(() =>
  bugsStore.projects.map((p) => ({ value: p._id, label: `${p.key} · ${p.name}` }))
);
const selectedProject = computed(() => bugsStore.projects.find((p) => p._id === form.project));
const versionOptions = computed(() => [
  { value: "", label: "Not specified" },
  ...(selectedProject.value?.versions || []).map((v) => ({ value: v, label: v })),
]);
// Each project names its own sites/apps — WEB → Shop, Blog; APP → iOS, Android.
const moduleOptions = computed(() => [
  { value: "", label: "Not specified" },
  ...(selectedProject.value?.modules || []).map((m) => ({ value: m, label: m })),
]);
const moduleLabel = computed(() => (selectedProject.value?.key === "APP" ? "App" : "Website"));
const files = ref([]);
const error = ref("");
const submitting = ref(false);

const form = reactive({
  project: "",
  module: "",
  foundInVersion: "",
  fixedInVersion: "",
  title: "",
  description: "",
  stepsToReproduce: [""],
  severity: "",
  priority: "",
  bugType: "",
  assignee: "",
  status: "Open",
});

const previewLevel = computed(() => computePriorityLevel(form.severity, form.priority));

// A module from the old project makes no sense under the new one.
watch(
  () => form.project,
  () => {
    if (!moduleOptions.value.some((o) => o.value === form.module)) form.module = "";
  }
);

function addStep() {
  form.stepsToReproduce.push("");
}
function removeStep(i) {
  form.stepsToReproduce.splice(i, 1);
}

function buildFormData() {
  const fd = new FormData();
  fd.append("title", form.title);
  fd.append("description", form.description);
  form.stepsToReproduce.filter((s) => s.trim()).forEach((s) => fd.append("stepsToReproduce", s));
  fd.append("severity", form.severity);
  fd.append("priority", form.priority);
  fd.append("bugType", form.bugType);
  if (form.project) fd.append("project", form.project);
  fd.append("module", form.module || "");
  if (isEdit.value) {
    fd.append("foundInVersion", form.foundInVersion || "");
    fd.append("fixedInVersion", form.fixedInVersion || "");
  }
  if (canEditAssignee.value && form.assignee) fd.append("assignee", form.assignee);
  if (isEdit.value && canEditStatus.value) fd.append("status", form.status);
  files.value.forEach((f) => fd.append("attachments", f));
  return fd;
}

async function submit() {
  error.value = "";
  submitting.value = true;
  try {
    const fd = buildFormData();
    const bug = isEdit.value ? await bugsStore.updateBug(route.params.id, fd) : await bugsStore.createBug(fd);
    router.push({ name: "bug-detail", params: { id: bug._id } });
  } catch (e) {
    error.value = e.response?.data?.error || "Something went wrong";
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  await Promise.all([bugsStore.fetchMeta(), bugsStore.fetchUsers(), bugsStore.fetchProjects()]);
  if (!isEdit.value) form.project = bugsStore.projects[0]?._id || "";
  if (isEdit.value) {
    const bug = await bugsStore.fetchBug(route.params.id);
    form.project = bug.project?._id || "";
    form.module = bug.module || "";
    form.foundInVersion = bug.foundInVersion || "";
    form.fixedInVersion = bug.fixedInVersion || "";
    form.title = bug.title;
    form.description = bug.description;
    form.stepsToReproduce = bug.stepsToReproduce.length ? bug.stepsToReproduce : [""];
    form.severity = bug.severity;
    form.priority = bug.priority;
    form.bugType = bug.bugType;
    form.assignee = bug.assignee?._id || bug.assignee?.id || "";
    form.status = bug.status;
  }
});
</script>
