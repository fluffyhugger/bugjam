<template>
  <div id="bug-timeline" class="card-hard p-5">
    <h3 class="mb-4 font-display font-bold">Activity & comments</h3>

    <ol v-if="items.length" id="timeline-list" class="space-y-3">
      <li v-for="item in items" :key="item._id" :id="`timeline-item-${item._id}`">
        <!-- activity: compact one-liner -->
        <div v-if="item.kind === 'activity'" class="flex items-start gap-2 text-sm">
          <span class="mt-1 h-2 w-2 shrink-0 rounded-full bg-ink/30" />
          <p class="font-medium text-ink/70">
            <span class="font-bold text-ink">{{ item.actor?.name }}</span>
            {{ describe(item) }}
            <span class="text-ink/40">· {{ when(item.createdAt) }}</span>
          </p>
        </div>

        <!-- comment: card -->
        <div v-else class="rounded-xl border-2 border-ink bg-white p-3 shadow-hard-sm">
          <div class="flex items-center gap-2">
            <span
              class="flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink text-[11px] font-bold"
              :style="{ backgroundColor: item.author?.avatarColor }"
            >
              {{ initials(item.author?.name) }}
            </span>
            <span class="font-bold">{{ item.author?.name }}</span>
            <span class="text-xs font-semibold text-ink/50">
              {{ when(item.createdAt) }}<template v-if="item.editedAt"> · edited</template>
            </span>
            <span v-if="canModify(item)" class="ml-auto flex gap-2">
              <button :id="`comment-edit-${item._id}`" class="text-xs font-bold underline" @click="startEdit(item)">Edit</button>
              <button :id="`comment-delete-${item._id}`" class="text-xs font-bold underline" @click="remove(item)">Delete</button>
            </span>
            <button
              v-else-if="auth.isElevated"
              :id="`comment-delete-${item._id}`"
              class="ml-auto text-xs font-bold underline"
              @click="remove(item)"
            >
              Delete
            </button>
          </div>

          <div v-if="editingId === item._id" class="mt-2 space-y-2">
            <textarea :id="`comment-edit-input-${item._id}`" v-model="editDraft" rows="3" class="input-hard"></textarea>
            <div class="flex gap-2">
              <button :id="`comment-edit-save-${item._id}`" class="btn-hard !py-1.5 text-sm" @click="saveEdit(item)">Save</button>
              <button :id="`comment-edit-cancel-${item._id}`" class="btn-hard !bg-white !py-1.5 text-sm" @click="editingId = null">Cancel</button>
            </div>
          </div>
          <p v-else :id="`comment-body-${item._id}`" class="mt-2 whitespace-pre-wrap font-medium">{{ item.body }}</p>
        </div>
      </li>
    </ol>
    <p v-else id="timeline-empty" class="text-sm font-semibold text-ink/50">No activity yet.</p>

    <form class="mt-5 space-y-2" @submit.prevent="post">
      <textarea
        id="comment-input"
        v-model="draft"
        rows="3"
        class="input-hard"
        placeholder="Add a comment — what did you find?"
      ></textarea>
      <button id="comment-submit" type="submit" class="btn-hard" :disabled="posting || !draft.trim()">
        {{ posting ? "Posting..." : "Comment" }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useBugsStore } from "../stores/bugs";
import { useAuthStore } from "../stores/auth";

const props = defineProps({ bugId: { type: String, required: true } });

const bugsStore = useBugsStore();
const auth = useAuthStore();

const items = ref([]);
const draft = ref("");
const posting = ref(false);
const editingId = ref(null);
const editDraft = ref("");

const initials = (name) => (name || "?").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
const when = (d) => new Date(d).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
const canModify = (item) => (item.author?._id || item.author?.id) === auth.user?.id;

function describe(a) {
  if (a.type === "created") return `reported this bug`;
  if (a.type === "assignee") return `reassigned it from ${a.from} to ${a.to}`;
  if (a.type === "attachment") return `${a.field} attachment "${a.to}"`;
  if (a.type === "link") return `${a.field} link ${a.to}`;
  if (a.type === "field") return `changed ${a.field}`;
  return `changed ${a.field || a.type} from ${a.from} to ${a.to}`;
}

async function load() {
  items.value = await bugsStore.fetchTimeline(props.bugId);
}

async function post() {
  posting.value = true;
  try {
    await bugsStore.addComment(props.bugId, draft.value.trim());
    draft.value = "";
    await load();
  } finally {
    posting.value = false;
  }
}

function startEdit(item) {
  editingId.value = item._id;
  editDraft.value = item.body;
}

async function saveEdit(item) {
  await bugsStore.editComment(props.bugId, item._id, editDraft.value.trim());
  editingId.value = null;
  await load();
}

async function remove(item) {
  if (!confirm("Delete this comment?")) return;
  await bugsStore.removeComment(props.bugId, item._id);
  await load();
}

defineExpose({ load });
onMounted(load);
</script>
