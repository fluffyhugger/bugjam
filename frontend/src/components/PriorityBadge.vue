<template>
  <span class="badge" :style="{ backgroundColor: colors[priority] || '#eee' }">{{ priority }}</span>
</template>

<script setup>
import { PRIORITY_COLORS as colors } from "../utils/palette";

defineProps({ priority: { type: String, required: true } });
</script>
