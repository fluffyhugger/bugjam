<template>
  <RouterLink
    :to="{ name: 'bug-detail', params: { id: bug._id } }"
    class="card-hard group flex flex-col gap-3 p-4 transition-transform hover:-translate-y-1 hover:-rotate-1"
  >
    <div class="flex items-start justify-between gap-2">
      <div>
        <span class="font-mono text-xs font-bold text-ink/50">{{ bug.bugId }}</span>
        <span v-if="bug.module" class="ml-2 text-xs font-bold text-ink/45">· {{ bug.module }}</span>
        <span v-if="bug.foundInVersion" class="ml-2 font-mono text-xs font-bold text-ink/40">
          v{{ bug.foundInVersion }}
        </span>
        <h3 class="font-display text-lg font-bold leading-tight">{{ bug.title }}</h3>
      </div>
      <PriorityLevelBadge :level="bug.priorityLevel" class="shrink-0" />
    </div>

    <img
      v-if="thumbnail"
      :src="thumbnail.url"
      class="h-36 w-full rounded-xl border-2 border-ink object-cover"
      alt="attachment preview"
    />
    <p v-else-if="bug.attachments?.length" class="text-sm font-semibold text-ink/50">
      📎 {{ bug.attachments.length }} attachment{{ bug.attachments.length > 1 ? "s" : "" }}
    </p>

    <div class="flex flex-wrap gap-2">
      <SeverityBadge :severity="bug.severity" />
      <PriorityBadge :priority="bug.priority" />
      <StatusBadge :status="bug.status" />
      <span class="badge bg-white">{{ bug.bugType }}</span>
    </div>

    <div class="mt-auto flex items-center justify-between text-sm font-semibold text-ink/70">
      <span>👤 {{ bug.reporter?.name || "unknown" }}</span>
      <span>🎯 {{ bug.assignee?.name || "unassigned" }}</span>
    </div>
  </RouterLink>
</template>

<script setup>
import { computed } from "vue";
import SeverityBadge from "./SeverityBadge.vue";
import PriorityBadge from "./PriorityBadge.vue";
import StatusBadge from "./StatusBadge.vue";
import PriorityLevelBadge from "./PriorityLevelBadge.vue";
import { isImage } from "../utils/files";

const props = defineProps({ bug: { type: Object, required: true } });

const thumbnail = computed(() =>
  (props.bug.attachments || []).find((a) => isImage(a.mimeType, a.filename))
);
</script>
