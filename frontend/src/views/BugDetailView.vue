<template>
  <div v-if="bug" class="mx-auto max-w-3xl space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <span class="font-mono text-sm font-bold text-ink/50">{{ bug.bugId }}</span>
        <h1 class="font-display text-3xl font-black">{{ bug.title }}</h1>
        <p class="mt-1 font-medium text-ink/60">
          Reported by {{ bug.reporter?.name }} on {{ new Date(bug.createdAt).toLocaleString() }}
        </p>
      </div>
      <div class="flex gap-2">
        <RouterLink :to="{ name: 'bug-edit', params: { id: bug._id } }" class="btn-hard !bg-white">Edit</RouterLink>
        <button v-if="auth.isElevated" class="btn-hard !bg-punch !text-white" @click="remove">Delete</button>
      </div>
    </div>

    <div class="flex flex-wrap gap-2">
      <PriorityLevelBadge :level="bug.priorityLevel" />
      <SeverityBadge :severity="bug.severity" />
      <PriorityBadge :priority="bug.priority" />
      <span class="badge bg-white">{{ bug.bugType }}</span>
    </div>

    <div class="card-hard p-5">
      <label class="label-hard">Status</label>
      <div v-if="auth.isElevated || !meta?.elevatedOnlyStatuses.includes(bug.status)" class="max-w-xs">
        <SelectHard
          v-model="bug.status"
          :options="selectableStatuses || []"
          :colors="STATUS_COLORS"
          @change="(v) => updateField('status', v)"
        />
      </div>
      <StatusBadge v-else :status="bug.status" />
    </div>

    <div class="card-hard p-5">
      <label class="label-hard">Assignee</label>
      <div v-if="auth.isElevated" class="max-w-xs">
        <SelectHard
          v-model="assigneeId"
          :options="assigneeOptions"
          placeholder="Unassigned"
          @change="(v) => updateField('assignee', v)"
        />
      </div>
      <p v-else class="font-semibold">{{ bug.assignee?.name || "Unassigned" }}</p>
    </div>

    <div class="card-hard p-5">
      <h3 class="mb-2 font-display font-bold">Description</h3>
      <p class="whitespace-pre-wrap font-medium">{{ bug.description || "—" }}</p>
    </div>

    <div v-if="bug.stepsToReproduce?.length" class="card-hard p-5">
      <h3 class="mb-2 font-display font-bold">Steps to reproduce</h3>
      <ol class="list-decimal space-y-1 pl-5 font-medium">
        <li v-for="(s, i) in bug.stepsToReproduce" :key="i">{{ s }}</li>
      </ol>
    </div>

    <div class="card-hard grid gap-4 p-5 sm:grid-cols-4">
      <div>
        <p class="label-hard">Project</p>
        <p class="font-semibold">{{ bug.project?.key }} · {{ bug.project?.name }}</p>
      </div>
      <div>
        <p class="label-hard">{{ bug.project?.key === "APP" ? "App" : "Website" }}</p>
        <p class="font-semibold">{{ bug.module || "—" }}</p>
      </div>
      <div>
        <p class="label-hard">Found in</p>
        <p class="font-semibold">{{ bug.foundInVersion || "—" }}</p>
      </div>
      <div>
        <p class="label-hard">Fixed in</p>
        <p class="font-semibold">{{ bug.fixedInVersion || "—" }}</p>
      </div>
    </div>

    <div v-if="bug.attachments?.length" class="card-hard p-5">
      <h3 class="mb-3 font-display font-bold">Attachments</h3>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div v-for="a in bug.attachments" :key="a.objectKey" class="relative">
          <a :href="a.url" target="_blank" class="block">
            <img
              v-if="isImage(a.mimeType, a.filename)"
              :src="a.url"
              class="h-32 w-full rounded-xl border-2 border-ink object-cover"
            />
            <div
              v-else
              class="flex h-32 w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-ink bg-white p-2"
            >
              <span class="text-3xl">{{ fileIcon(a.mimeType, a.filename) }}</span>
              <span class="w-full truncate text-center text-[11px] font-bold">{{ a.filename }}</span>
            </div>
          </a>
          <p class="mt-1 text-center text-[10px] font-semibold text-ink/50">{{ formatBytes(a.size) }}</p>
          <button
            class="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-ink bg-punch text-xs font-bold text-white shadow-hard-sm"
            title="Delete attachment"
            @click="removeAttachment(a)"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <div class="card-hard p-5">
      <h3 class="mb-3 font-display font-bold">Linked bugs</h3>
      <ul v-if="bug.links?.length" class="mb-3 space-y-2">
        <li v-for="l in bug.links" :key="l.bug?._id" class="flex items-center gap-2">
          <span class="badge bg-white">{{ l.type }}</span>
          <RouterLink
            :to="{ name: 'bug-detail', params: { id: l.bug?._id } }"
            class="font-semibold underline"
          >
            {{ l.bug?.bugId }} — {{ l.bug?.title }}
          </RouterLink>
          <button class="ml-auto text-xs font-bold underline" @click="unlink(l)">Remove</button>
        </li>
      </ul>
      <p v-else class="mb-3 text-sm font-semibold text-ink/50">Not linked to anything yet.</p>

      <div class="flex flex-wrap items-end gap-2">
        <div class="w-40">
          <SelectHard v-model="linkType" :options="linkTypes" />
        </div>
        <input v-model="linkTarget" class="input-hard !w-40" placeholder="BUG-0004" />
        <button class="btn-hard !py-2 text-sm" :disabled="!linkTarget.trim()" @click="link">Link</button>
        <p v-if="linkError" class="text-sm font-semibold text-punch">{{ linkError }}</p>
      </div>
    </div>

    <BugTimeline ref="timeline" :bug-id="bug._id" />
  </div>
  <p v-else class="font-bold">Loading...</p>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useBugsStore } from "../stores/bugs";
import { useAuthStore } from "../stores/auth";
import SeverityBadge from "../components/SeverityBadge.vue";
import PriorityBadge from "../components/PriorityBadge.vue";
import PriorityLevelBadge from "../components/PriorityLevelBadge.vue";
import StatusBadge from "../components/StatusBadge.vue";
import SelectHard from "../components/SelectHard.vue";
import BugTimeline from "../components/BugTimeline.vue";
import { STATUS_COLORS } from "../utils/palette";
import { fileIcon, isImage, formatBytes } from "../utils/files";

const route = useRoute();
const router = useRouter();
const bugsStore = useBugsStore();
const auth = useAuthStore();
const meta = computed(() => bugsStore.meta);
const selectableStatuses = computed(() =>
  auth.isElevated ? meta.value?.statuses : meta.value?.statuses?.filter((s) => !meta.value.elevatedOnlyStatuses.includes(s))
);
const assigneeOptions = computed(() => [
  { value: "", label: "Unassigned" },
  ...bugsStore.users.map((u) => ({ value: u.id, label: u.name })),
]);

const bug = ref(null);
const assigneeId = ref("");
const timeline = ref(null);
const linkType = ref("duplicate-of");
const linkTarget = ref("");
const linkError = ref("");
const linkTypes = ["duplicate-of", "blocks", "blocked-by", "relates-to"];

async function removeAttachment(a) {
  if (!confirm(`Delete ${a.filename}? This removes the file for good.`)) return;
  bug.value = await bugsStore.deleteAttachment(bug.value._id, a.objectKey);
  timeline.value?.load();
}

async function link() {
  linkError.value = "";
  try {
    bug.value = await bugsStore.addLink(bug.value._id, linkType.value, linkTarget.value.trim());
    linkTarget.value = "";
    timeline.value?.load();
  } catch (e) {
    linkError.value = e.response?.data?.error || "Could not link";
  }
}

async function unlink(l) {
  bug.value = await bugsStore.removeLink(bug.value._id, l.bug._id);
  timeline.value?.load();
}

async function load() {
  bug.value = await bugsStore.fetchBug(route.params.id);
  assigneeId.value = bug.value.assignee?._id || bug.value.assignee?.id || "";
}

async function updateField(field, value) {
  const fd = new FormData();
  fd.append(field, value ?? "");
  bug.value = await bugsStore.updateBug(bug.value._id, fd);
  timeline.value?.load();
}

async function remove() {
  if (!confirm("Delete this bug for good?")) return;
  await bugsStore.deleteBug(bug.value._id);
  router.push({ name: "bugs" });
}

onMounted(async () => {
  await Promise.all([bugsStore.fetchMeta(), bugsStore.fetchUsers()]);
  await load();
});
</script>
