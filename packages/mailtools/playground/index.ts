import { parseMessage } from '../src';
import type { ParseMessageOptions, ReplacementOptions } from '../src/';
import q from 'quoted-printable';

const htmlToParse = ``;
// const htmlToParse = q.decode(``);

const parseOptions: ParseMessageOptions = {
  /** Remove quotations. Only affects the result messageHtml */
  cleanQuotations: true,
  /** Remove and return signatures. Only affects the result messageHtml */
  cleanSignatures: true,
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
  cleanStyles: false
};

console.log('Running parseMessage with the following options:');
console.log({ parseOptions });

const parsed = await parseMessage(htmlToParse, parseOptions);
console.log(parsed);
