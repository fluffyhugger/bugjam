<template>
  <div>
    <div v-if="items.length" class="space-y-1.5">
      <div
        v-for="item in items"
        :key="item.label"
        tabindex="0"
        class="group grid grid-cols-[minmax(6rem,9rem)_1fr] items-center gap-3 rounded-lg px-1 py-1 outline-none focus-visible:ring-4 focus-visible:ring-yolk/60"
        :class="[hovered === item.label ? 'bg-ink/5' : '', clickable ? 'cursor-pointer' : '']"
        :title="clickable ? `Show ${item.label} bugs` : undefined"
        @mouseenter="hovered = item.label"
        @mouseleave="hovered = null"
        @focus="hovered = item.label"
        @blur="hovered = null"
        @click="clickable && emit('select', item)"
        @keydown.enter="clickable && emit('select', item)"
      >
        <span class="flex min-w-0 items-center gap-2">
          <span
            v-if="item.color"
            class="h-3 w-3 shrink-0 rounded-full"
            :style="{ backgroundColor: item.color }"
          />
          <span class="truncate text-sm font-semibold text-ink/80">{{ item.label }}</span>
        </span>

        <span class="flex items-center gap-2">
          <span class="relative h-4 flex-1">
            <span
              class="absolute inset-y-0 left-0 rounded-r"
              :style="{
                width: `${pct(item.value)}%`,
                backgroundColor: item.color || accent,
                opacity: hovered && hovered !== item.label ? 0.55 : 1,
              }"
            />
          </span>
          <span class="w-10 shrink-0 text-right text-sm font-bold tabular-nums text-ink">
            {{ item.value }}
          </span>
        </span>
      </div>
    </div>
    <p v-else class="py-6 text-center text-sm font-semibold text-ink/50">No data yet</p>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { CHART_ACCENT } from "../../utils/palette";

const props = defineProps({
  items: { type: Array, required: true },
  accent: { type: String, default: CHART_ACCENT },
  clickable: { type: Boolean, default: false },
});
const emit = defineEmits(["select"]);

const hovered = ref(null);
const max = computed(() => Math.max(1, ...props.items.map((i) => i.value)));
const pct = (v) => (v / max.value) * 100;
</script>
