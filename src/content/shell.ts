export const shellContent = {
  announcement: {
    message: 'Nothing you upload is stored.',
    linkText: 'Read how it works',
    dismissAria: 'Dismiss announcement',
  },
  nav: {
    ariaLabel: 'Main',
    skipToContent: 'Skip to main content',
    howItWorks: 'How it works',
    privacy: 'Privacy',
    limits: 'Limits',
    openTool: 'Open the tool',
    menuOpenAria: 'Open navigation menu',
    menuCloseAria: 'Close navigation menu',
    modeHide: 'Hide',
    modeReveal: 'Reveal',
    chooseModeAria: 'Choose mode',
  },
  fab: {
    ariaLabel: 'Key actions',
    popoverPrompt: 'Have a key?',
    popoverAction: 'Reveal a message',
  },
  sharingModal: {
    title: 'Share it the safe way',
    tip1: 'Send the image as a file or document, not as a photo.',
    tip2: 'Send the key in a different message or channel.',
    tip3: "Don't resize, screenshot or filter the image.",
    closeAction: 'Got it',
  },
  closingSection: {
    line1: 'Try it with a photo',
    line2: 'and a sentence.',
    cta: 'Open the tool',
    copyrightSuffix: 'Veil. All rights reserved.',
  },
  notFound: {
    line1: 'This page',
    line2: "doesn't exist.",
    lead: 'The link may be old, or mistyped.',
    action: 'Go home',
  },
  placeholders: {
    landingHeroTitle: 'Hide words',
    landingHeroSubtitle: 'in plain sight.',
    landingHeroLead:
      'Put a secret message inside any photo. Only someone with your key can read it.',
    howSectionTitle: 'How it works',
    howSectionDesc:
      'Choose a photo, type your message, and receive a photo that looks identical plus a secret key.',
    privacySectionTitle: 'Your message stays yours',
    privacySectionDesc:
      'Images, messages and keys are processed entirely in memory and deleted the moment your result is ready.',
    limitsSectionTitle: 'What to know before sharing',
    limitsSectionDesc:
      'Share stego images as lossless files or documents. Never send through lossy messaging recompression.',
    platformTitleHide: 'Hide a message in a photo',
    platformTitleReveal: 'Reveal a message with a key',
    platformDescHide: 'Upload an image and enter a secret message to embed.',
    platformDescReveal: 'Provide your stego image and exact key to recover the message.',
  },
} as const;
