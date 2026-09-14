<template>
  <div class="space-y-6">
    <h1 class="font-display text-3xl font-black">Team 🧑‍🤝‍🧑</h1>

    <div class="card-hard divide-y-2 divide-ink">
      <div
        v-for="u in bugsStore.users"
        :key="u.id"
        :id="`user-row-${u.id}`"
        class="flex flex-wrap items-center justify-between gap-3 p-4"
      >
        <div class="flex items-center gap-3">
          <span
            class="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink font-bold"
            :style="{ backgroundColor: u.avatarColor }"
          >
            {{ initials(u.name) }}
          </span>
          <div>
            <p :id="`user-name-${u.id}`" class="font-bold">{{ u.name }}</p>
            <p :id="`user-email-${u.id}`" class="text-sm text-ink/60">{{ u.email }}</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button :id="`user-reset-password-${u.id}`" class="btn-hard !bg-white !px-3 !py-1.5 text-xs" @click="resetPassword(u)">
            Reset password
          </button>
          <div class="w-44">
            <SelectHard
              :id="`user-role-${u.id}`"
              :model-value="u.role"
              :options="roles"
              :colors="ROLE_COLORS"
              @change="(role) => changeRole(u, role)"
            />
          </div>
        </div>
      </div>

      <div v-if="issued" id="temp-password-panel" class="border-t-2 border-ink bg-yolk p-4">
        <p class="text-sm font-bold">Temporary password for {{ issued.name }}</p>
        <p id="temp-password" class="mt-1 font-mono text-lg font-black">{{ issued.tempPassword }}</p>
        <p class="mt-1 text-xs font-semibold text-ink/70">
          Shown once — hand it over and have them change it under Account.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useBugsStore } from "../stores/bugs";
import client from "../api/client";
import SelectHard from "../components/SelectHard.vue";
import { ROLE_COLORS } from "../utils/palette";

const bugsStore = useBugsStore();
const roles = ["Reporter", "Developer", "Head of QA", "Admin"];
const issued = ref(null);

async function resetPassword(user) {
  if (!confirm(`Reset the password for ${user.name}? Their current one stops working.`)) return;
  const { data } = await client.post(`/users/${user.id}/reset-password`);
  issued.value = { name: user.name, tempPassword: data.tempPassword };
}

function initials(name) {
  return (name || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

async function changeRole(user, role) {
  await bugsStore.updateUserRole(user.id, role);
}

onMounted(() => bugsStore.fetchUsers());
</script>
