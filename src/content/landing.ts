/**
 * Content strings for the Landing page sections.
 * Externalizes all user-facing copy per AGENTS.md rules.
 */
export const landingContent = {
  howItWorks: {
    sectionId: 'how',
    title: 'How it works',
    steps: [
      {
        id: 'step-1',
        label: 'Choose a photo',
        h3: 'Choose a photo',
        paragraph:
          'Pick any image and type your message. Veil hides it in the picture and gives you a key.',
      },
      {
        id: 'step-2',
        label: 'Share the image',
        h3: 'Share the image',
        paragraph:
          'Send the image to anyone. To everyone else it is just a photo.',
      },
      {
        id: 'step-3',
        label: 'Share the key separately',
        h3: 'Share the key separately',
        paragraph:
          'Give the key to your friend another way. With the image and the key, they can read it here.',
      },
    ],
    detailsLink: 'See how it works in detail',
    detailsExpandedText:
      "A hidden message is encrypted with your key, then tucked into tiny frequency patterns in the photo's brightness that the eye doesn't notice. The key decides where. Without the key, there is no way to know which patterns matter. Anyone with the image alone sees an ordinary photo. The changes are mathematically small and distributed across frequency bands, keeping your private message safe in plain sight while looking like any normal picture on your screen. When your recipient arrives with both the file and the secret key, the platform cleanly extracts the payload with zero loss.",
  },
  proof: {
    headingLine1: 'Look closely.',
    headingLine2: "You can't tell.",
    toggleChip: 'Show the difference',
    caption: 'Differences amplified 50x so you can see them.',
    originalLabel: 'Original',
    withMessageLabel: 'With message',
    sliderAriaLabel: 'Image comparison slider between original and stego version',
    devPlaceholder: 'Sample images pending: see docs',
    metrics: {
      qualityLabel: 'Quality',
      qualityTooltip: 'Peak signal-to-noise ratio. Higher means less distortion to the photo.',
      similarityLabel: 'Similarity',
      similarityTooltip: 'Structural similarity index. 1.0 indicates perfect visual fidelity.',
      capacityLabel: 'Payload',
      capacityTooltip: 'Bytes of private message embedded inside the image.',
    },
  },
  privacy: {
    sectionId: 'privacy',
    headingLine1: 'Your message',
    headingLine2: 'stays yours.',
    paragraph:
      "Images, messages and keys are processed in memory and deleted the moment you get your result. We don't keep them, and we can't recover a lost key.",
    linkText: "Read what we do and don't promise",
    badges: [
      { id: 'b1', title: 'AES-256', subtitle: 'Key-locked' },
      { id: 'b2', title: 'No storage', subtitle: 'In-memory' },
      { id: 'b3', title: 'Open method', subtitle: 'Auditable' },
    ],
  },
  limits: {
    sectionId: 'limits',
    headingLine1: 'What to know',
    headingLine2: 'before you share.',
    statements: [
      {
        id: 's1',
        prefix: 'Send the image as a ',
        highlight: 'file or document',
        suffix:
          '. Apps that shrink or recompress photos (WhatsApp, Instagram, screenshots) can destroy the message.',
      },
      {
        id: 's2',
        prefix: 'Lose the key and the message is gone. There is ',
        highlight: 'no recovery',
        suffix: '.',
      },
      {
        id: 's3',
        prefix: 'The key and the image should travel ',
        highlight: 'separately',
        suffix: '.',
      },
      {
        id: 's4',
        prefix:
          'Hiding keeps a message unseen; strong encryption keeps it unreadable. Veil does both, but no tool can promise it is undetectable to an expert.',
        highlight: '',
        suffix: '',
      },
    ],
  },
} as const;
