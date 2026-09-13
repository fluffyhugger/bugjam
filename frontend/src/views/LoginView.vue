<template>
  <div class="mx-auto flex max-w-md flex-col items-center gap-6 pt-12">
    <div class="flex flex-col items-center text-center">
      <BugJamMark :size="56" color="#141311" class="mb-3" />
      <h1 class="font-display text-3xl font-black">Welcome back to BugJam</h1>
      <p class="mt-1 font-medium text-ink/70">Log in and squash something.</p>
    </div>

    <form class="card-hard w-full space-y-4 p-6" @submit.prevent="submit">
      <div>
        <label class="label-hard">Email</label>
        <input v-model="email" type="email" required class="input-hard" placeholder="you@example.com" />
      </div>
      <div>
        <label class="label-hard">Password</label>
        <input v-model="password" type="password" required class="input-hard" placeholder="••••••••" />
      </div>
      <p v-if="error" class="rounded-lg bg-punch/20 p-2 text-sm font-semibold">{{ error }}</p>
      <button type="submit" class="btn-hard w-full" :disabled="loading">
        {{ loading ? "Logging in..." : "Log in" }}
      </button>
    </form>

    <p class="font-medium">
      New here?
      <RouterLink to="/register" class="font-bold underline">Create an account</RouterLink>
    </p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import BugJamMark from "../components/BugJamMark.vue";

const auth = useAuthStore();
const router = useRouter();

const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

async function submit() {
  error.value = "";
  loading.value = true;
  try {
    await auth.login(email.value, password.value);
    router.push({ name: "dashboard" });
  } catch (e) {
    error.value = e.response?.data?.error || "Login failed";
  } finally {
    loading.value = false;
  }
}
</script>
