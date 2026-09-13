<template>
  <span class="badge" :style="{ backgroundColor: colors[status] || '#eee' }">{{ status }}</span>
</template>

<script setup>
import { STATUS_COLORS as colors } from "../utils/palette";

defineProps({ status: { type: String, required: true } });
</script>
