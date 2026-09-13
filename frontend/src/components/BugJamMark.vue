<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 200 200"
    role="img"
    :aria-label="label"
    :style="{ color }"
    class="shrink-0"
  >
    <mask :id="maskId" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200">
      <rect width="200" height="200" fill="#fff" />
      <!-- The seam is knocked out, not painted, so the mark works on any ground. -->
      <rect x="96" y="70" width="8" height="104" rx="4" fill="#000" />
    </mask>
    <g :mask="`url(#${maskId})`" fill="currentColor">
      <circle cx="49" cy="13" r="13" />
      <circle cx="151" cy="13" r="13" />
      <rect y="44" width="200" height="156" rx="72.43" ry="78" />
    </g>
  </svg>
</template>

<script setup>
let uid = 0;

defineProps({
  size: { type: [Number, String], default: 28 },
  color: { type: String, default: "currentColor" },
  label: { type: String, default: "BugJam" },
});

const maskId = `bugjam-seam-${++uid}`;
</script>
