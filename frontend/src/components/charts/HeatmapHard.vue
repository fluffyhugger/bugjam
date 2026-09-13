<template>
  <div>
    <div class="overflow-x-auto">
      <table class="w-full border-separate border-spacing-0.5 text-sm">
        <thead>
          <tr>
            <th class="p-1 text-left text-xs font-bold uppercase tracking-wide text-ink/50">Sev \ Pri</th>
            <th
              v-for="p in columns"
              :key="p"
              class="p-1 text-center text-xs font-bold uppercase tracking-wide text-ink/60"
            >
              {{ p }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in rows" :key="s">
            <th class="py-1 pr-2 text-left text-xs font-bold text-ink/60">{{ s }}</th>
            <td v-for="p in columns" :key="p" class="p-0">
              <div
                tabindex="0"
                class="flex h-11 items-center justify-center rounded-md text-sm font-bold tabular-nums outline-none transition-transform focus-visible:ring-4 focus-visible:ring-yolk/60"
                :class="[hovered === `${s}|${p}` ? 'scale-105' : '', count(s, p) ? 'cursor-pointer' : '']"
                :style="cellStyle(s, p)"
                :title="`${s} severity · ${p} priority — ${count(s, p)} bug(s) · ${level(s, p)}`"
                @mouseenter="hovered = `${s}|${p}`"
                @mouseleave="hovered = null"
                @focus="hovered = `${s}|${p}`"
                @blur="hovered = null"
                @click="count(s, p) && emit('select', { severity: s, priority: p })"
                @keydown.enter="count(s, p) && emit('select', { severity: s, priority: p })"
              >
                {{ count(s, p) || "—" }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-3 flex items-center gap-2">
      <span class="text-xs font-semibold text-ink/50">fewer</span>
      <span
        v-for="(c, i) in ramp"
        :key="i"
        class="h-3 w-7 rounded-sm"
        :style="{ backgroundColor: c }"
      />
      <span class="text-xs font-semibold text-ink/50">more</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { HEAT_RAMP as ramp } from "../../utils/palette";
import { computePriorityLevel } from "../../utils/priorityMatrix";

const props = defineProps({
  matrix: { type: Object, required: true },
  rows: { type: Array, required: true },
  columns: { type: Array, required: true },
});
const emit = defineEmits(["select"]);

const hovered = ref(null);
const count = (s, p) => props.matrix[`${s}|${p}`] || 0;
const level = (s, p) => computePriorityLevel(s, p);
const max = computed(() => Math.max(1, ...Object.values(props.matrix)));

function cellStyle(s, p) {
  const v = count(s, p);
  if (!v) return { backgroundColor: "#ffffff", color: "#16161659", boxShadow: "inset 0 0 0 1px #16161620" };
  // Spread the non-zero range across the whole ramp: min -> lightest, max -> darkest.
  const step = max.value === 1 ? ramp.length - 1 : Math.round(((v - 1) / (max.value - 1)) * (ramp.length - 1));
  return { backgroundColor: ramp[step], color: step >= 2 ? "#ffffff" : "#161616" };
}
</script>
