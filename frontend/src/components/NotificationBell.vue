<template>
  <div ref="root" class="relative">
    <button
      class="relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-white text-lg shadow-hard-sm"
      :title="`${store.unreadCount} unread`"
      @click="open = !open"
    >
      🔔
      <span
        v-if="store.unreadCount"
        class="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-ink bg-punch px-1 text-[10px] font-black text-white"
      >
        {{ store.unreadCount > 9 ? "9+" : store.unreadCount }}
      </span>
    </button>

    <div
      v-if="open"
      class="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-xl border-2 border-ink bg-white shadow-hard"
    >
      <div class="flex items-center justify-between border-b-2 border-ink px-3 py-2">
        <span class="font-display font-bold">Notifications</span>
        <button
          v-if="store.unreadCount"
          class="text-xs font-bold underline"
          @click="store.markAllRead()"
        >
          Mark all read
        </button>
      </div>

      <ul v-if="store.items.length" class="max-h-80 overflow-auto">
        <li
          v-for="n in store.items"
          :key="n._id"
          class="border-b-2 border-ink/10 last:border-b-0"
          :class="n.read ? '' : 'bg-yolk/25'"
        >
          <RouterLink
            :to="n.bug ? { name: 'bug-detail', params: { id: n.bug._id } } : '/'"
            class="flex gap-2 px-3 py-2.5 hover:bg-ink/5"
            @click="select(n)"
          >
            <span
              class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-ink text-[10px] font-bold"
              :style="{ backgroundColor: n.actor?.avatarColor }"
            >
              {{ initials(n.actor?.name) }}
            </span>
            <span class="min-w-0">
              <span class="block text-sm font-semibold leading-snug">
                {{ n.actor?.name }} {{ n.message }}
              </span>
              <span class="text-[11px] font-semibold text-ink/50">{{ ago(n.createdAt) }}</span>
            </span>
          </RouterLink>
        </li>
      </ul>
      <p v-else class="px-3 py-6 text-center text-sm font-semibold text-ink/50">Nothing yet 🌱</p>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useNotificationsStore } from "../stores/notifications";

const store = useNotificationsStore();
const open = ref(false);
const root = ref(null);

const initials = (name) => (name || "?").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

function ago(date) {
  const mins = Math.floor((Date.now() - new Date(date)) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function select(n) {
  open.value = false;
  if (!n.read) store.markRead(n._id);
}

function onDocClick(e) {
  if (open.value && root.value && !root.value.contains(e.target)) open.value = false;
}

onMounted(() => document.addEventListener("click", onDocClick));
onBeforeUnmount(() => document.removeEventListener("click", onDocClick));
</script>
