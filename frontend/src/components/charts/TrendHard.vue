<template>
  <div class="relative">
    <!-- No fixed height: the viewBox aspect drives it, so the plot fills the card width
         and the tooltip's percentage positioning lines up with the crosshair. -->
    <svg
      :viewBox="`0 0 ${W} ${H}`"
      class="block w-full"
      @pointermove="onMove"
      @pointerleave="active = null"
    >
      <!-- gridlines: solid hairlines, one step off surface -->
      <g>
        <line
          v-for="t in yTicks"
          :key="t"
          :x1="PAD.l"
          :x2="W - PAD.r"
          :y1="y(t)"
          :y2="y(t)"
          stroke="#16161618"
          stroke-width="1"
        />
        <text
          v-for="t in yTicks"
          :key="`l${t}`"
          :x="PAD.l - 6"
          :y="y(t) + 3"
          text-anchor="end"
          class="fill-ink/50 text-[9px] tabular-nums"
        >
          {{ t }}
        </text>
      </g>

      <path :d="areaPath" :fill="accent" opacity="0.1" />
      <path :d="linePath" :stroke="accent" stroke-width="2" fill="none" stroke-linejoin="round" stroke-linecap="round" />

      <!-- end marker with surface ring -->
      <circle
        v-if="points.length"
        :cx="points[points.length - 1].x"
        :cy="points[points.length - 1].y"
        r="4.5"
        :fill="accent"
        :stroke="surface"
        stroke-width="2"
      />

      <!-- crosshair -->
      <g v-if="active">
        <line :x1="active.x" :x2="active.x" :y1="PAD.t" :y2="H - PAD.b" stroke="#16161640" stroke-width="1" />
        <circle :cx="active.x" :cy="active.y" r="4.5" :fill="accent" :stroke="surface" stroke-width="2" />
      </g>

      <!-- x labels: first, middle, last only -->
      <text
        v-for="(i, n) in xLabelIdx"
        :key="`x${i}`"
        :x="points[i]?.x"
        :y="H - 6"
        :text-anchor="n === 0 ? 'start' : n === xLabelIdx.length - 1 ? 'end' : 'middle'"
        class="fill-ink/50 text-[9px]"
      >
        {{ shortDate(series[i]?.date) }}
      </text>
    </svg>

    <div
      v-if="active"
      class="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border-2 border-ink bg-white px-2.5 py-1.5 shadow-hard-sm"
      :style="{ left: `${(active.x / W) * 100}%`, top: `${(active.y / H) * 100}%` }"
    >
      <p class="text-sm font-bold leading-none tabular-nums">{{ active.count }}</p>
      <p class="mt-0.5 whitespace-nowrap text-[10px] font-semibold text-ink/60">{{ longDate(active.date) }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { CHART_ACCENT as accent, CHART_SURFACE as surface } from "../../utils/palette";

const props = defineProps({ series: { type: Array, required: true } });

const W = 600;
const H = 180;
const PAD = { t: 10, r: 10, b: 20, l: 26 };

const active = ref(null);

const maxY = computed(() => {
  const m = Math.max(1, ...props.series.map((d) => d.count));
  return m <= 4 ? m : Math.ceil(m / 5) * 5;
});
const yTicks = computed(() => {
  const m = maxY.value;
  const step = Math.max(1, Math.round(m / 2));
  return [0, step, m].filter((v, i, a) => a.indexOf(v) === i);
});

const x = (i) => PAD.l + (i * (W - PAD.l - PAD.r)) / Math.max(1, props.series.length - 1);
const y = (v) => H - PAD.b - (v / maxY.value) * (H - PAD.t - PAD.b);

const points = computed(() => props.series.map((d, i) => ({ x: x(i), y: y(d.count), ...d })));
const linePath = computed(() => points.value.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" "));
const areaPath = computed(() =>
  points.value.length
    ? `${linePath.value} L${points.value[points.value.length - 1].x},${H - PAD.b} L${points.value[0].x},${H - PAD.b} Z`
    : ""
);
const xLabelIdx = computed(() => {
  const n = props.series.length;
  return n ? [0, Math.floor((n - 1) / 2), n - 1] : [];
});

function onMove(e) {
  const rect = e.currentTarget.getBoundingClientRect();
  const svgX = ((e.clientX - rect.left) / rect.width) * W;
  let nearest = points.value[0];
  for (const p of points.value) {
    if (Math.abs(p.x - svgX) < Math.abs(nearest.x - svgX)) nearest = p;
  }
  active.value = nearest || null;
}

const shortDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "");
const longDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : "";
</script>
