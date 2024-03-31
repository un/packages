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
  import type { ParseMessageOptions } from '@u22n/mailtools';
  import { ScrollArea } from '@components/ui/scroll-area';

  const parseMessage = import('@u22n/mailtools').then((m) => m.parseMessage);

  export let data: PageData;
  const options: ParseMessageOptions & { includeStyle: string } = {
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
    includeStyle: `html, body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    }`
  };

  $: parsed = parseMessage.then((r) => r(data.content, options));

  let dialogOpen = false;
  let feedbackType = '';
  let additionalComments = '';
  let pending = false;
  let tab = 'parsed';

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
      .then(async (e) => {
        const res = await e.json();
        dialogOpen = false;
        feedbackType = '';
        additionalComments = '';
        if (res.success) {
          toast('Feedback submitted successfully');
        } else {
          toast(res.message);
        }
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

<ScrollArea>
  <main
    class="mx-auto flex w-full max-w-screen-lg flex-1 flex-col gap-3 px-3 py-4">
    {#if !data.received}
      <h2 class="text-center text-2xl font-semibold">No Email Received Yet</h2>
      <p class="text-muted-foreground text-center">
        We haven't received any email on the address you sent the email to.
        Please check the email address and try again.
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
          <Tabs.Root bind:value={tab}>
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
                    value={options.includeStyle}
                    placeholder="Custom CSS to include"
                    rows={4}
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
                  <div
                    class="flex min-h-32 w-full flex-col gap-2 rounded-md border p-1">
                    <h2 class="font-semibold">Parsed Email</h2>
                    {#if tab === 'parsed'}
                      <iframe
                        on:load={(e) => {
                          // @ts-expect-error
                          e.currentTarget.style.height = `${Math.max(e.currentTarget.contentWindow.document.body.offsetHeight + /* extra padding */ 32, 300)}px`;
                        }}
                        sandbox="allow-same-origin"
                        class="w-full py-2"
                        srcdoc={html.parsedMessageHtml}
                        title="Parsed email" />
                    {/if}
                  </div>
                  {#if options.cleanSignatures}
                    <div class="min-h-32 w-full gap-2 rounded-md border p-1">
                      {#if html.foundSignatureHtml}
                        <h2 class="font-semibold">Found Signature</h2>
                        {#if tab === 'parsed'}
                          <iframe
                            on:load={(e) => {
                              // @ts-expect-error
                              e.currentTarget.style.height = `${Math.max(e.currentTarget.contentWindow.document.body.offsetHeight, 150)}px`;
                            }}
                            sandbox="allow-same-origin"
                            class="w-full py-2"
                            srcdoc={html.foundSignatureHtml}
                            title="Parsed email Signature" />
                        {/if}
                        <h3 class="font-semibold">SIgnature (Plain text)</h3>
                        <div class="bg-card whitespace-pre text-pretty">
                          {html.foundSignaturePlainText}
                        </div>
                      {:else}
                        <h2 class="font-semibold">No Signature Found</h2>
                      {/if}
                    </div>
                  {/if}
                {/await}
              </div>
            </Tabs.Content>
            <Tabs.Content value="original">
              <div class="flex flex-col gap-4">
                <h2 class="font-semibold">Original Email</h2>
                <!-- Force it to load once its visible to set the height -->
                {#if tab === 'original'}
                  <iframe
                    class="min-h-32 w-full"
                    on:load={(e) => {
                      // @ts-expect-error
                      e.currentTarget.style.height = `${Math.max(e.currentTarget.contentWindow.document.body.offsetHeight + /* extra padding */ 16, 300)}px`;
                    }}
                    sandbox="allow-same-origin"
                    srcdoc={data.content}
                    title="Original email" />
                {/if}
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
                Please do not submit any personal information in additional
                comments.
              </p>
              <p class="font-medium">
                UnInbox Team will review your feedback and your email would be
                deleted once we have reviewed the feedback.
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
</ScrollArea>

<div
  class="pointer-events-none fixed inset-0 flex h-full w-full flex-col items-center justify-end">
  <div
    class="bg-card/95 pointer-events-auto z-10 flex -translate-y-2 items-center justify-center gap-2 rounded-full border px-6 py-2">
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
</div>
