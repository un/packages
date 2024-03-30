<script>
  import '../app.pcss';
  import { ModeWatcher } from 'mode-watcher';
  import Navbar from '@components/custom/Navbar.svelte';
  import Sonner from '@components/ui/sonner/sonner.svelte';
</script>

<ModeWatcher
  defaultMode="system"
  disableTransitions />
<Navbar />
<Sonner />
<slot />
