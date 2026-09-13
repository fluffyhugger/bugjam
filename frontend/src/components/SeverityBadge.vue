<template>
  <span class="badge" :style="{ backgroundColor: colors[severity] || '#eee' }">{{ severity }}</span>
</template>

<script setup>
import { SEVERITY_COLORS as colors } from "../utils/palette";

defineProps({ severity: { type: String, required: true } });
</script>
