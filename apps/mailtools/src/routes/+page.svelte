<script lang="ts">
  import type { PageData } from './$types';
  import * as Tabs from '@components/ui/tabs';
  import * as Card from '@components/ui/card';
  import * as Tooltip from '@components/ui/tooltip';
  import { goto } from '$app/navigation';
  import { Button } from '@components/ui/button';
  import Copy from 'lucide-svelte/icons/copy';
  import Check from 'lucide-svelte/icons/check';
  import { toDataURL } from 'qrcode';
  import { Skeleton } from '@components/ui/skeleton';
  import { toast } from 'svelte-sonner';
  import { Turnstile } from 'svelte-turnstile';
  import { PUBLIC_TURNSTILE_SITE_KEY } from '$env/static/public';
  import Dropzone from '@components/custom/Dropzone.svelte';
  import { Badge } from '@components/ui/badge';
  import { Textarea } from '@components/ui/textarea';
  import Error from './+error.svelte';

  export let data: PageData;
  let copied = false;
  let turnstileResponse: string;

  function copyEmail() {
    navigator.clipboard.writeText(data.email || '').then(() => {
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 2000);
    });
  }

  let pending = false;
  async function checkStatus() {
    if (pending) return;
    pending = true;
    const status = await fetch('/api/status')
      .then((res) => res.json())
      .catch(() => ({ received: false }))
      .finally(() => {
        pending = false;
      });
    if (status.received) {
      toast('We have received your mail. Redirecting to the result page...');
      goto('/result');
    } else {
      toast("We didn't receive any mail on that address yet");
    }
  }

  async function generateEmail() {
    if (!turnstileResponse) return;
    pending = true;
    const email = await fetch('/api/generate-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token: turnstileResponse })
    })
      .then((res) => res.json())
      .catch(() => {
        toast('Failed to generate email address. Please try again later.');
        return null;
      })
      .finally(() => {
        pending = false;
      });
    if (email) {
      data.email = email.email;
    }
  }

  let file: File | null = null;
  let fileContents = '';
  async function uploadFile() {
    if (!turnstileResponse) return;
    if (file && fileContents) {
      toast.warning(
        'Please Either upload a file or paste the contents, not both, refresh the page to try again'
      );
      return;
    }

    pending = true;
    const formData = new FormData();
    if (fileContents) {
      formData.append(
        'file',
        new Blob([fileContents], { type: 'message/rfc822' }),
        'email.eml'
      );
    } else if (file) {
      formData.append('file', file, 'email.eml');
    } else {
      toast.warning('Please upload a file or paste the contents');
      return;
    }
    formData.append('token', turnstileResponse);

    const response = await fetch('/api/upload-file', {
      method: 'POST',
      body: formData
    })
      .then((res) => res.json())
      .catch((err) => {
        toast(
          err instanceof Error
            ? err.message
            : 'Failed to upload email. Please try again '
        );
        return null;
      })
      .finally(() => {
        pending = false;
      });

    if (response.success) {
      toast('Email uploaded successfully. Redirecting to the result page...');
      goto('/result');
    } else {
      toast(response.message);
    }
  }
</script>

<main
  class="mx-auto flex w-full max-w-screen-lg flex-1 flex-col gap-3 px-3 py-4">
  <h2 class="text-3xl font-bold">What is MailTools?</h2>
  <p>
    <a
      href="https://www.npmjs.com/package/@u22n/mailtools"
      class="font-mono underline"
      target="_blank">
      <code>@u22n/mailtools</code></a>
    is an npm package for parsing emails to clean up the content, remove trackers
    and extract signatures.
  </p>
  <p>
    We use it internally at
    <a
      href="https://uninbox.com"
      class="underline"
      target="_blank">UnInbox</a> to clean up emails before displaying them to users.
  </p>
  <h2 class="pt-6 text-3xl font-bold">Get a Live Demo</h2>
  <Tabs.Root value="file">
    <Tabs.List>
      <Tooltip.Root>
        <Tooltip.Trigger>
          <Tabs.Trigger
            value="email"
            disabled>
            <span class="flex gap-1">Send us an Email</span>
          </Tabs.Trigger>
        </Tooltip.Trigger>
        <Tooltip.Content>
          Disabled for now as we have disabled the spare email server
          temporarily.
        </Tooltip.Content>
      </Tooltip.Root>
      <Tabs.Trigger value="file">
        <span class="flex gap-1">
          <code>.eml</code> File
        </span>
      </Tabs.Trigger>
    </Tabs.List>

    <Tabs.Content value="email">
      <Card.Root>
        <Card.Header>
          <Card.Title>Send us an Email</Card.Title>
          <Card.Description>
            You can send us an email directly from this page. We will receive
            your email and process it accordingly.<br />
            <span class="font-bold">Note:</span> Your emails are kept private and
            deleted after processing. We do not store any email content or email
            addresses permanently. We will only store them if you explicitly report
            a bug with the parser.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          {#if data.email}
            <div
              class="mx-auto flex w-full max-w-md flex-col items-center gap-4">
              <div>
                {#await toDataURL( `mailto:${data.email}`, { margin: 2, scale: 6 } )}
                  <Skeleton class="aspect-square w-48" />
                {:then qrCode}
                  <img
                    src={qrCode}
                    alt="Mail to {data.email}"
                    class="w-48 select-none rounded-md" />
                {/await}
              </div>
              <div
                class="border-secondary min-w-3/4 flex items-center justify-center rounded-md border p-3">
                <span class="h-full w-full flex-1 select-all font-mono">
                  {data.email}
                </span>
                <Tooltip.Root>
                  <Tooltip.Trigger
                    asChild
                    let:builder>
                    <Button
                      builders={[builder]}
                      size="icon"
                      variant="ghost"
                      on:click={copyEmail}>
                      <span class="sr-only">Copy email</span>
                      {#if copied}
                        <Check size="16" />
                      {:else}
                        <Copy size="16" />
                      {/if}
                    </Button>
                  </Tooltip.Trigger>
                  <Tooltip.Content>
                    <p>Copy to Clipboard</p>
                  </Tooltip.Content>
                </Tooltip.Root>
              </div>
              <div>
                <p class="text-muted-foreground text-center text-sm">
                  Click <a
                    href={`mailto:${data.email}`}
                    class="underline"
                    target="_blank">here</a> to open the address in your default
                  email client
                </p>
              </div>
              <Button
                class="font-bold"
                on:click={checkStatus}
                disabled={pending}>I have sent the mail!</Button>
            </div>
          {:else}
            <div class="flex flex-col items-center gap-4 p-4">
              <h2 class="font-bold">
                We will generate a unique email address for you to send your
                mail.
              </h2>

              <Button
                variant="default"
                disabled={!turnstileResponse || pending}
                on:click={generateEmail}>
                {#if !turnstileResponse}
                  Waiting for Captcha...
                {:else if pending}
                  Processing...
                {:else}
                  Generate
                {/if}
              </Button>
            </div>
          {/if}
        </Card.Content>
      </Card.Root>
    </Tabs.Content>

    <Tabs.Content value="file">
      <Card.Root>
        <Card.Header>
          <Card.Title>Upload/Paste <code>.eml</code> file</Card.Title>
          <Card.Description>
            EML files are just plain text files with email headers and body. If
            you don't know how to get an EML file, you can check the <a
              href="https://www.google.com/search?q=how+to+get+eml+file"
              target="_blank"
              rel="noopener"
              class="underline">tutorials</a>
            on how to get one.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <div class="flex flex-col items-center justify-center gap-2">
            <Dropzone
              onFileAdded={(f) => {
                file = f;
              }} />
            <div
              class="relative mx-auto flex w-3/4 items-center justify-center px-2 py-8">
              <hr class="w-full" />
              <Badge
                variant="default"
                class="absolute">OR</Badge>
            </div>
            <Textarea
              placeholder="Paste file contents here"
              class="font-mono"
              bind:value={fileContents} />

            <Button
              variant="default"
              disabled={!turnstileResponse ||
                pending ||
                (!file && !fileContents)}
              on:click={uploadFile}>
              {#if !turnstileResponse}
                Waiting for Captcha...
              {:else if pending}
                Uploading...
              {:else}
                Upload
              {/if}
            </Button>
          </div>
        </Card.Content>
      </Card.Root>
    </Tabs.Content>
  </Tabs.Root>
  <div class="mx-auto flex w-fit flex-col items-center justify-center gap-2">
    <Turnstile
      siteKey={PUBLIC_TURNSTILE_SITE_KEY}
      theme="auto"
      on:turnstile-callback={(e) => {
        turnstileResponse = e.detail.token;
      }} />
  </div>
</main>
