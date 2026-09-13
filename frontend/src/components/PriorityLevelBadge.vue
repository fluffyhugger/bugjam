<template>
  <span class="badge gap-1" :style="{ backgroundColor: meta[level]?.bg || '#eee' }">
    <span>{{ meta[level]?.emoji }}</span>{{ level }} · {{ meta[level]?.label }}
  </span>
</template>

<script setup>
import { LEVEL_META as meta } from "../utils/palette";

defineProps({ level: { type: String, required: true } });
</script>
