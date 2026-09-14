<template>
  <div>
    <div
      id="file-dropzone"
      class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink bg-white p-8 text-center shadow-hard-sm transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard"
      :class="dragging ? '-translate-x-0.5 -translate-y-0.5 border-solid bg-yolk/40 shadow-hard' : ''"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
      @click="fileInput.click()"
    >
      <span class="text-3xl">{{ dragging ? "🎯" : "📎" }}</span>
      <p class="font-bold">{{ dragging ? "Drop 'em!" : "Drag files here" }}</p>
      <span id="file-browse" class="btn-hard !bg-white !px-4 !py-1.5 text-sm">Browse files</span>
      <p class="text-xs font-semibold text-ink/50">
        Screenshots, logs, PDFs or video · up to {{ MAX_FILES }} files · 25MB each
      </p>
      <input id="file-input" ref="fileInput" type="file" multiple class="hidden" @change="onSelect" />
    </div>

    <div v-if="picked.length" id="file-preview-list" class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div v-for="(p, i) in picked" :key="i" :id="`file-preview-${i + 1}`" class="group relative">
        <img
          v-if="p.preview"
          :src="p.preview"
          class="h-24 w-full rounded-xl border-2 border-ink object-cover"
        />
        <div
          v-else
          class="flex h-24 w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-ink bg-white p-2"
        >
          <span class="text-2xl">{{ icon(p.file) }}</span>
          <span class="w-full truncate text-center text-[10px] font-bold">{{ p.file.name }}</span>
        </div>
        <span class="mt-1 block text-center text-[10px] font-semibold text-ink/50">{{ size(p.file.size) }}</span>
        <button
          :id="`file-remove-${i + 1}`"
          type="button"
          class="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-ink bg-punch text-xs font-bold text-white shadow-hard-sm"
          @click="removeAt(i)"
        >
          ✕
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref } from "vue";
import { fileIcon, formatBytes } from "../utils/files";

const MAX_FILES = 10;
const emit = defineEmits(["update:files"]);

const picked = ref([]);
const dragging = ref(false);
const fileInput = ref(null);

const icon = (file) => fileIcon(file.type, file.name);
const size = formatBytes;

function addFiles(list) {
  const room = Math.max(0, MAX_FILES - picked.value.length);
  for (const file of Array.from(list).slice(0, room)) {
    picked.value.push({
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    });
  }
  emit("update:files", picked.value.map((p) => p.file));
}

function onSelect(e) {
  addFiles(e.target.files);
  e.target.value = "";
}

function onDrop(e) {
  dragging.value = false;
  addFiles(e.dataTransfer.files);
}

function removeAt(i) {
  if (picked.value[i].preview) URL.revokeObjectURL(picked.value[i].preview);
  picked.value.splice(i, 1);
  emit("update:files", picked.value.map((p) => p.file));
}

onBeforeUnmount(() => picked.value.forEach((p) => p.preview && URL.revokeObjectURL(p.preview)));
</script>
