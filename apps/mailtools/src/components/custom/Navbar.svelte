<script lang="ts">
  import { Button } from '@components/ui/button';
  import Sun from 'lucide-svelte/icons/sun';
  import Moon from 'lucide-svelte/icons/moon';
  import { toggleMode } from 'mode-watcher';
</script>

<header class="w-full border-b">
  <div class="mx-auto max-w-screen-lg px-3 py-4">
    <div class="flex items-center justify-between">
      <div class="flex flex-col items-center">
        <a
          href="/"
          class="text-primary text-2xl font-bold leading-5">MailTools</a>
        <span class="font-semibold leading-5">
          By
          <a
            href="https://uninbox.com"
            target="_blank"
            class="text-primary text-xs underline"
            >UnInbox Team
          </a>
        </span>
      </div>
      <nav class="flex gap-2">
        <Button
          href="https://github.com/un/packages/tree/main/packages/mailtools"
          variant="ghost"
          target="_blank"
          size="icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 32 32">
            <path
              fill="currentColor"
              fill-rule="evenodd"
              d="M16 2a14 14 0 0 0-4.43 27.28c.7.13 1-.3 1-.67v-2.38c-3.89.84-4.71-1.88-4.71-1.88a3.71 3.71 0 0 0-1.62-2.05c-1.27-.86.1-.85.1-.85a2.94 2.94 0 0 1 2.14 1.45a3 3 0 0 0 4.08 1.16a2.93 2.93 0 0 1 .88-1.87c-3.1-.36-6.37-1.56-6.37-6.92a5.4 5.4 0 0 1 1.44-3.76a5 5 0 0 1 .14-3.7s1.17-.38 3.85 1.43a13.3 13.3 0 0 1 7 0c2.67-1.81 3.84-1.43 3.84-1.43a5 5 0 0 1 .14 3.7a5.4 5.4 0 0 1 1.44 3.76c0 5.38-3.27 6.56-6.39 6.91a3.33 3.33 0 0 1 .95 2.59v3.84c0 .46.25.81 1 .67A14 14 0 0 0 16 2" />
          </svg>
          <span class="sr-only">Github</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="relative overflow-hidden"
          on:click={toggleMode}>
          <Sun
            size={24}
            class="absolute translate-y-0 !transition-transform !duration-200 ease-in-out dark:-translate-y-8" />
          <Moon
            size={24}
            class="absolute translate-y-8 !transition-transform !duration-200 ease-in-out dark:translate-y-0" />
        </Button>
      </nav>
    </div>
  </div>
</header>
