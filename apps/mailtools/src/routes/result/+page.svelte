<script lang="ts">
  import type { PageData } from './$types';
  import * as Tabs from '@components/ui/tabs';
  import * as Card from '@components/ui/card';
  import * as Dialog from '@components/ui/dialog';
  import { Switch } from '@components/ui/switch';
  import { Label } from '@components/ui/label';
  import { Input } from '@components/ui/input';
  import { Button } from '@components/ui/button';
  import { Textarea } from '@components/ui/textarea';
  import { Skeleton } from '@components/ui/skeleton';
  import { toast } from 'svelte-sonner';
  import Check from 'lucide-svelte/icons/check';
  import Plus from 'lucide-svelte/icons/plus';
  import { parseMessage, type ParseMessageOptions } from '@u22n/mailtools';

  export let data: PageData;
  const options: ParseMessageOptions = {
    cleanQuotations: true,
    cleanSignatures: true,
    cleanStyles: true,
    enhanceLinks: false,
    noRemoteContent: false,
    autolink: false,
    remoteContentReplacements: {
      image: '<remote-image>',
      other: '<other>'
    },
    forceViewport: '',
    includeStyle: ''
  };

  $: parsed = new Promise((r) =>
    parseMessage(data.content, options).then((d) => {
      setTimeout(() => {
        r(d);
      }, 1000);
    })
  ) as ReturnType<typeof parseMessage>;

  let dialogOpen = false;
  let feedbackType = '';
  let additionalComments = '';
  let pending = false;

  function giveFeedback(type: 'correct' | 'incorrect') {
    feedbackType = type;
    dialogOpen = true;
  }

  function submitFeedback() {
    pending = true;
    fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: feedbackType,
        feedback: additionalComments,
        options: JSON.stringify(options)
      })
    })
      .then(() => {
        dialogOpen = false;
        feedbackType = '';
        additionalComments = '';
        toast('Feedback submitted successfully');
      })
      .catch((e) => {
        console.error(e);
        toast('Failed to submit feedback');
      })
      .finally(() => {
        pending = false;
      });
  }
</script>

<main
  class="mx-auto flex w-full max-w-screen-lg flex-1 flex-col gap-3 px-3 py-4">
  {#if !data.received}
    <h2 class="text-center text-2xl font-semibold">No Email Received Yet</h2>
    <p class="text-muted-foreground text-center">
      We haven't received any email on the address you sent the email to. Please
      check the email address and try again.
    </p>
    <Button
      href="/"
      class="mx-auto w-fit">Go Back</Button>
  {:else}
    <h1 class="text-3xl font-bold">Parser Results</h1>
    <Card.Root>
      <Card.Header>
        <Card.Title>Results</Card.Title>
        <Card.Description>
          The results of the email parsing are displayed below. You can toggle
          options to modify how the email is parsed.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <Tabs.Root value="parsed">
          <Tabs.List>
            <Tabs.Trigger value="options">Parser Options</Tabs.Trigger>
            <Tabs.Trigger value="parsed">View Parsed Email</Tabs.Trigger>
            <Tabs.Trigger value="original">View Original</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="options">
            <div class="flex flex-col gap-6 pb-4 pt-8">
              <div class="flex items-center space-x-2">
                <Switch
                  id="clean-quotes"
                  bind:checked={options.cleanQuotations} />
                <Label
                  class="font-semibold"
                  for="clean-quotes">Clean Quotes</Label>
              </div>
              <div class="flex items-center space-x-2">
                <Switch
                  id="clean-signatures"
                  bind:checked={options.cleanSignatures} />
                <Label
                  class="font-semibold"
                  for="clean-signatures">Clean Signatures</Label>
              </div>

              <div class="flex flex-col gap-2">
                <Label
                  class="font-semibold"
                  for="clean-styles">Clean Styles</Label>
                <Input
                  id="clean-styles"
                  placeholder="comma separated list of inline styles to remove, leave blank to disable"
                  on:change={(e) => {
                    const v = e.currentTarget.value.trim();
                    options.cleanStyles = !v ? false : v.split(',');
                  }} />
              </div>

              <div class="flex items-center space-x-2">
                <Switch
                  id="enhance-links"
                  bind:checked={options.enhanceLinks} />
                <Label
                  class="font-semibold"
                  for="enhance-links">Enhance Links</Label>
              </div>

              <div class="flex items-center space-x-2">
                <Switch
                  id="no-remote-content"
                  bind:checked={options.noRemoteContent} />
                <Label
                  class="font-semibold"
                  for="no-remote-content">No Remote Content</Label>
              </div>

              <div class="flex items-center space-x-2">
                <Switch
                  id="autolink"
                  bind:checked={options.autolink} />
                <Label
                  class="font-semibold"
                  for="autolink">Autolink</Label>
              </div>

              <div>
                <Label
                  class="font-semibold"
                  for="force-viewport">Force Viewport</Label>
                <Input
                  id="force-viewport"
                  bind:value={options.forceViewport} />
              </div>

              <div>
                <Label
                  class="font-semibold"
                  for="include-style">Include Extra styles</Label>
                <Textarea
                  id="include-style"
                  class="font-mono"
                  placeholder="Custom CSS to include"
                  on:change={(e) => {
                    // @ts-expect-error
                    const v = e.currentTarget?.value?.trim();
                    options.includeStyle = !v ? false : v;
                  }} />
              </div>
            </div>
          </Tabs.Content>
          <Tabs.Content value="parsed">
            <div class="flex flex-col gap-4">
              {#await parsed}
                <Skeleton class="h-4 w-32" />
                <Skeleton class="h-32 w-full" />
                {#if options.cleanSignatures}
                  <Skeleton class="h-5 w-32" />
                  <Skeleton class="h-32 w-full" />
                  <Skeleton class="h-5 w-32" />
                  <Skeleton class="h-10 w-full" />
                {/if}
                <hr class="w-full" />
                <Skeleton class="mx-auto h-12 w-64" />
              {:then html}
                <div class="flex min-h-32 w-full flex-col gap-2">
                  <h2 class="font-semibold">Parsed Email</h2>
                  <iframe
                    sandbox=""
                    class="w-full py-2"
                    srcdoc={html.parsedMessageHtml}
                    title="Parsed email" />
                </div>
                {#if options.cleanSignatures}
                  <div class="min-h-32 w-full gap-2">
                    {#if html.foundSignatureHtml}
                      <h2 class="font-semibold">Found Signature</h2>
                      <iframe
                        sandbox=""
                        class="w-full py-2"
                        srcdoc={html.foundSignatureHtml}
                        title="Parsed email Signature" />
                      <h3 class="font-semibold">SIgnature (Plain text)</h3>
                      <div class="bg-card whitespace-pre text-pretty">
                        {html.foundSignaturePlainText}
                      </div>
                    {:else}
                      <h2 class="font-semibold">No Signature Found</h2>
                    {/if}
                  </div>
                {/if}
                <hr class="w-full" />
                <div class="flex items-center justify-center gap-2">
                  <span class="text-muted-foreground font-medium">
                    Is the parsing Correct?
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="rounded-full"
                    on:click={() => giveFeedback('correct')}>
                    <Check
                      size="18"
                      class="text-green-400" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="rounded-full"
                    on:click={() => giveFeedback('incorrect')}>
                    <Plus
                      size="18"
                      class="rotate-45 text-red-400" />
                  </Button>
                </div>
              {/await}
            </div>
          </Tabs.Content>
          <Tabs.Content value="original">
            <div class="p-4">
              <iframe
                class="h-fit w-full"
                sandbox=""
                srcdoc={data.content}
                title="Original email" />
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </Card.Content>
    </Card.Root>

    <Dialog.Root bind:open={dialogOpen}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Submit Feedback</Dialog.Title>
          <Dialog.Description class="flex flex-col gap-3">
            <p>
              The feedback you submit will be public and visible to all users.
              Please do not submit any personal information in additional
              comments.
            </p>
            <p class="font-medium">
              However the email you are submitting feedback on won't be made
              visible to any one else than Uninbox Team and would be deleted
              once we have reviewed the feedback.
            </p>
            <span class="font-semibold">
              You are submitting feedback that the parsing was <span
                class={feedbackType === 'correct'
                  ? 'text-green-500'
                  : 'text-red-500'}>{feedbackType}</span
              >.
            </span>
            <Textarea
              placeholder="Additional comments"
              rows={4}
              bind:value={additionalComments} />
            <div class="ml-auto flex gap-2">
              <Button
                variant="outline"
                on:click={() => (dialogOpen = false)}>
                Cancel
              </Button>
              <Button
                variant="default"
                disabled={pending}
                on:click={submitFeedback}>
                {pending ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </Dialog.Description>
        </Dialog.Header>
      </Dialog.Content>
    </Dialog.Root>
  {/if}
</main>
