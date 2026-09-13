<template>
  <div class="card-hard p-4">
    <p class="text-xs font-bold uppercase tracking-wide text-ink/60">{{ label }}</p>
    <p class="mt-1 font-display text-3xl font-black leading-none">{{ value }}</p>
    <p v-if="hint" class="mt-1 text-xs font-semibold text-ink/50">{{ hint }}</p>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  hint: { type: String, default: "" },
});
</script>
