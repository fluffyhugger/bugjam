<template>
  <div ref="root" class="relative">
    <button
      :id="id"
      type="button"
      :data-value="modelValue"
      class="flex w-full items-center justify-between gap-2 rounded-xl border-2 border-ink bg-white px-4 py-2.5 text-left font-semibold shadow-hard-sm transition-transform focus:outline-none focus:ring-4 focus:ring-yolk/60 disabled:opacity-50"
      :class="open ? '-translate-x-0.5 -translate-y-0.5 shadow-hard' : 'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard'"
      :disabled="disabled"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="toggle"
      @keydown="onTriggerKey"
    >
      <span class="flex min-w-0 items-center gap-2">
        <span
          v-if="colors?.[selected?.value]"
          class="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-ink"
          :style="{ backgroundColor: colors[selected.value] }"
        />
        <span class="truncate" :class="selected ? '' : 'text-ink/50'">
          {{ selected ? selected.label : placeholder }}
        </span>
      </span>
      <span class="shrink-0 text-xs leading-none">{{ open ? "▲" : "▼" }}</span>
    </button>

    <ul
      v-if="open"
      :id="id ? `${id}-list` : undefined"
      class="absolute z-30 mt-2 max-h-64 w-full overflow-auto rounded-xl border-2 border-ink bg-white shadow-hard"
      role="listbox"
    >
      <li
        v-for="(opt, i) in normalized"
        :key="opt.value"
        :id="optionId(opt)"
        :data-value="opt.value"
        role="option"
        :aria-selected="opt.value === modelValue"
        class="flex cursor-pointer items-center gap-2 border-b-2 border-ink/10 px-4 py-2.5 font-semibold last:border-b-0"
        :class="[
          opt.value === modelValue ? 'bg-yolk' : '',
          i === activeIndex && opt.value !== modelValue ? 'bg-yolk/30' : '',
        ]"
        @click="pick(opt.value)"
        @mouseenter="activeIndex = i"
      >
        <span
          v-if="colors?.[opt.value]"
          class="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-ink"
          :style="{ backgroundColor: colors[opt.value] }"
        />
        <span class="truncate">{{ opt.label }}</span>
        <span v-if="opt.value === modelValue" class="ml-auto shrink-0">✓</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps({
  modelValue: { type: [String, Number, null], default: "" },
  options: { type: Array, required: true },
  placeholder: { type: String, default: "Select..." },
  colors: { type: Object, default: null },
  disabled: { type: Boolean, default: false },
  // Given an id, the trigger gets it and each option gets `<id>-option-<slug>`,
  // so automated tests can open the dropdown and pick a value by id.
  id: { type: String, default: "" },
});

const slug = (value) =>
  String(value || "any")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "any";

// An option may carry `idSlug` so ids read `-option-web` instead of a Mongo id.
const optionId = (opt) => (props.id ? `${props.id}-option-${slug(opt.idSlug ?? opt.value)}` : undefined);
const emit = defineEmits(["update:modelValue", "change"]);

const root = ref(null);
const open = ref(false);
const activeIndex = ref(0);

const normalized = computed(() =>
  props.options.map((o) => (typeof o === "object" ? o : { value: o, label: String(o) }))
);
const selected = computed(() => normalized.value.find((o) => o.value === props.modelValue) || null);

function toggle() {
  if (props.disabled) return;
  open.value = !open.value;
  if (open.value) {
    activeIndex.value = Math.max(0, normalized.value.findIndex((o) => o.value === props.modelValue));
  }
}

function pick(value) {
  open.value = false;
  if (value === props.modelValue) return;
  emit("update:modelValue", value);
  emit("change", value);
}

function onTriggerKey(e) {
  if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
    e.preventDefault();
    if (!open.value) return toggle();
    if (e.key === "Enter" || e.key === " ") return pick(normalized.value[activeIndex.value].value);
    const step = e.key === "ArrowDown" ? 1 : -1;
    activeIndex.value = (activeIndex.value + step + normalized.value.length) % normalized.value.length;
  } else if (e.key === "Escape") {
    open.value = false;
  }
}

function onDocClick(e) {
  if (open.value && root.value && !root.value.contains(e.target)) open.value = false;
}

onMounted(() => document.addEventListener("click", onDocClick));
onBeforeUnmount(() => document.removeEventListener("click", onDocClick));
watch(() => props.options, () => (activeIndex.value = 0));
</script>
