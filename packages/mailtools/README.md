# @u22n/mailtools

Parse and extract the main message content from an HTML email.
Also runs several transformations to the email so that it can be displayed safely and correctly inside a browser.

## Features

- Extract quotations (replies), signatures
- Remove scripts, trackers
- Convert text links into anchor tags
- Remove trailing whitespaces
- Block remote content

## Usage

```ts
import { parseMessage } from '@u22n/mailtools';
import type { ParseMessageOptions } from '@u22n/mailtools';

const emailHtml = `
<div>Hello there</div>
`;

const parsedEmail = parseMessage(emailHtml);
```

### Options

```ts
// All options default to false.
const parseOptions: ParseMessageOptions = {
  /** Remove quotations. Only affects the result messageHtml */
  cleanQuotations: false,
  /** Remove and return signatures. Only affects the result messageHtml */
  cleanSignatures: false,
  /** Automatically convert text links to anchor tags */
  autolink: false,
  /** Fix broken links and add the href to the title tag */
  enhanceLinks: false,
  /** Specific viewport to enforce. For example "<meta name="viewport" content="width=device-width">" */
  forceViewport: false,
  /** Replace remote images with a transparent image, and replace other remote URLs with '#' */
  noRemoteContent: false,
  /** Replace remote content with custom URLs */
  remoteContentReplacements: {} as ReplacementOptions,
  /** Append the given style to the HTML <head> */
  includeStyle: false,
  /** Remove specific styles that could affect the rendering of the html */
  /** true = remove 'background-color', 'font-family', 'font-size'. */
  /** otherwise pass in an string array of styles to remove */
  cleanStyles: false
};
```

### Outputs

```ts
const {
	/** The original complete message. */
  completeHtml: string;
  /** The body of the message, stripped from secondary information */
  parsedMessageHtml: string;
  /** True if a quote was found and stripped */
  didFindQuotation: boolean | null;
  /** True if a signature was found and stripped */
  didFindSignature: boolean | null;
  /** The signature in plain text */
  foundSignaturePlainText: string | null;
  /** The signature in HTML */
  foundSignatureHtml: string | null;
} = parseMessage(emailHtml, parseOptions);
```

### Other

Autolinking and remote-content blocking are available as separate functions as well.

```js
const withLinks = linkify(messageHtml);

const noRemoteContent = blockRemoteContent(
  messageHtml,
  remoteContentReplacements
);
```

## Development

### Playground

We have included a playground for local testing of functionality and features.

Edit the email html in `playground/index.ts` and run with `pnpm run start`.

The output will be logged to the console.

### Tests

```
pnpm run test
```

The main function `parseMessage` has a list of fixtures used for tests. The input HTML are files named `xxx.input.html`. The expected outputs are named `xxx.output-complete.html` and `xxx.output-message.html`.

### `pnpm run generate:fixtures`

This script generates the respective outputs files for any `.input.html` file found without corresponding outputs.

To easily add a fixture from a real-world email, you can put the input HTML at `/src/tests/prepareMessage/my-test.input.html`, and then run `pnpm run generate:fixtures` to generate the output files based on what `prepareMessage` produced. You now only have to check that the outputs look good and make adjustments if necessary.

## History

`@u22n/mailtools` is a modified and more feature filled version of [`tempo-email-parser`](https://github.com/yourtempo/tempo-email-parser).

We picked up on `tempo-email-parser` which was not being maintained any more and updated it to modern tooling and dependencies. We are using this package at uninbox.com, everyone is free to use as they want and need.

## Limitations

It seems like we are unable to extract outlook signatures correctly. We need more source emails to add to the parsing tests and functions.
If you can help out with this, please open an issue with some html emails we can use

## License

This package is licensed under the MIT License. Please see the [LICENSE](./LICENSE) file for more information.
