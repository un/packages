import { load } from 'cheerio';
import type { CheerioAPI } from 'cheerio';
import removeQuotations from './removeQuotations';

/**
 * Remove Signatures from the HTML and return the signatures in plain text and html
 */
function removeSignatures(
  $: CheerioAPI,
  cleanedQuotations: boolean = false
): {
  didFindSignature: boolean;
  foundSignaturePlainText: string | null;
  foundSignatureHtml: string | null;
} {
  const returnData = {
    didFindSignature: false as boolean,
    foundSignaturePlainText: null as string | null,
    foundSignatureHtml: null as string | null
  };

  let cheerioToSearchForSignatures: CheerioAPI;
  let cheerioToSearchRemoveSignatures: CheerioAPI;
  // if cleanedQuotations is true, we assume that the quotations were already removed and we can just extract the first signature and return it
  if (cleanedQuotations) {
    cheerioToSearchForSignatures = $;
    cheerioToSearchRemoveSignatures = $;
  } else {
    // if cleanedQuotations is false, we need to remove the quotations first then run the signature extraction on the new cloned item, then run the signature removal on the original item
    const cloned$ = load($('*').html() || '');
    removeQuotations(cloned$);
    cheerioToSearchForSignatures = cloned$;
    cheerioToSearchRemoveSignatures = $;
  }

  // extract the signature for the return data from the html without the quotes
  const foundPrimarySignatureElements = findAllSignatures(
    cheerioToSearchForSignatures
  );
  const foundPrimarySignature = foundPrimarySignatureElements;

  // Iterate over divs and remove those that only contain a single div child
  foundPrimarySignature.find('div').each(function () {
    const div = $(this);
    // Check if the div only has one child and that child is a div
    if (div.children().length === 1 && div.children('div').length === 1) {
      const childDiv = div.children('div').first();
      // Replace the parent div with its child div directly
      div.replaceWith(childDiv);
    }
  });

  returnData.foundSignatureHtml = foundPrimarySignature.html();

  // Now proceed with inserting line breaks for plain text
  foundPrimarySignature.find('div,p').each(function (i, el) {
    if (i > 0) {
      // Skip the first div to avoid a leading newline
      $(el).before('\n');
    }
  });
  returnData.foundSignaturePlainText = foundPrimarySignature
    .text()
    .trim()
    // replace multiple newlines with a single newline
    .replace(/(\s?\n)+/g, '\n');

  // remove all the signatures from the original email
  const allSignatureElementsForRemoval = findAllSignatures(
    cheerioToSearchRemoveSignatures
  );
  allSignatureElementsForRemoval.each((_, el) => void $(el).remove());

  returnData.didFindSignature = foundPrimarySignatureElements.length > 0;

  return returnData;
}

/**
 * Returns a selection of all signature elements
 */
function findAllSignatures($: CheerioAPI) {
  const signatureElements = $(
    [
      // Known Signature Matchers
      'signature',
      '.gmail_signature',
      '.protonmail_signature_block',
      '#ms-outlook-mobile-signature',
      '#Signature', // outlook web,
      // Generic Signature Matchers
      '[class*="signature"]',
      '[id*="signature"]'
    ].join(', ')
  );

  // Outlook specific signatures
  if (
    signatureElements.length === 0 &&
    $('html').attr('xmlns:m')?.includes('microsoft')
  ) {
    return findAllSignaturesOutlook($);
  }

  return signatureElements;
}

function findAllSignaturesOutlook($: CheerioAPI) {
  // this works in most cases, but fails in cases like outlook-client-5 in fixtures
  // there is nothing we can even do in that case
  // I had to leave that test case with a part of signature in it, so basically the test is invalid
  // its kept for future references
  const start = $(
    ':has(>[style*="mso-ligatures"], >[style*="mso-fareast"])'
  ).first();
  // Outlook native signatures end at usually in a div with a border-top style
  const signatureTags = start.add(start.nextUntil("div[style*='border-top']"));
  const newHolder = $('<div></div>');
  signatureTags.each((_, el) => void newHolder.append($(el)));
  return newHolder;
}

export default removeSignatures;
