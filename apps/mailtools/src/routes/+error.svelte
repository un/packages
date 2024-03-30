<script lang="ts">
  import { page } from '$app/stores';
  import { Button } from '@components/ui/button';
</script>

<div class="flex flex-col items-center gap-4">
  <h1 class="mx-auto text-2xl font-bold">
    Error Code:{$page.status}
  </h1>
  <p>{$page.error?.message}</p>
  <Button
    href="/"
    class="w-fit">Go Home</Button>
</div>
