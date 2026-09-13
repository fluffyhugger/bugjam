<template>
  <div class="mx-auto max-w-md space-y-6">
    <h1 class="font-display text-3xl font-black">Your account</h1>

    <div class="card-hard space-y-1 p-5">
      <p class="font-bold">{{ auth.user?.name }}</p>
      <p class="text-sm font-medium text-ink/60">{{ auth.user?.email }}</p>
      <span class="badge mt-2 bg-white">{{ auth.user?.role }}</span>
    </div>

    <form class="card-hard space-y-4 p-6" @submit.prevent="submit">
      <h2 class="font-display text-lg font-bold">Change password</h2>
      <div>
        <label class="label-hard">Current password</label>
        <input v-model="currentPassword" type="password" required class="input-hard" />
      </div>
      <div>
        <label class="label-hard">New password</label>
        <input v-model="newPassword" type="password" required minlength="6" class="input-hard" />
      </div>
      <p v-if="error" class="rounded-lg bg-punch/20 p-2 text-sm font-semibold">{{ error }}</p>
      <p v-if="done" class="rounded-lg bg-mint/30 p-2 text-sm font-semibold">Password updated 🎉</p>
      <button type="submit" class="btn-hard w-full" :disabled="saving">
        {{ saving ? "Saving..." : "Update password" }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";
import client from "../api/client";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const currentPassword = ref("");
const newPassword = ref("");
const error = ref("");
const done = ref(false);
const saving = ref(false);

async function submit() {
  error.value = "";
  done.value = false;
  saving.value = true;
  try {
    const { data } = await client.post("/auth/change-password", {
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    });
    auth.setSession(data.token, data.user);
    currentPassword.value = "";
    newPassword.value = "";
    done.value = true;
  } catch (e) {
    error.value = e.response?.data?.error || "Could not change password";
  } finally {
    saving.value = false;
  }
}
</script>
