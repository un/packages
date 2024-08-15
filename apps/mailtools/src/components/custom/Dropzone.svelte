<script lang="ts">
  import { toast } from 'svelte-sonner';

  export let onFileAdded: (file: File) => void;

  let form: HTMLFormElement;
  function handleFileAdded(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file?.type !== 'message/rfc822') {
      toast.error('Invalid file type. Please upload a .eml file');
      form.reset();
      return;
    }
    if (file) onFileAdded(file);
  }
</script>

<form
  class="flex w-full flex-col gap-1"
  bind:this={form}>
  <h2 class="font-bold">Drop a file here to upload</h2>
  <input
    type="file"
    accept="message/rfc822"
    on:change={handleFileAdded}
    class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-32 w-full rounded-md border border-dashed px-3 py-2 text-sm file:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
</form>
