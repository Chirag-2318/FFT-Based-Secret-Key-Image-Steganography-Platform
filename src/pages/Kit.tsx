import React, { useState } from 'react';
import {
  Button,
  TextLink,
  Headline,
  SegmentedToggle,
  Chip,
  useToast,
  Modal,
  Skeleton,
  InlineMessage,
  Logo,
  LogoGlyph,
  PixelGrid,
} from '@/components/ui';
import {
  Dropzone,
  MessageField,
  CapacityMeter,
  KeyCard,
  ProgressPill,
  KeyInput,
  MetricsRow,
  SharingNote,
  DecorativeBackdrop,
  TypewriterText,
} from '@/components/platform';
import { useObjectUrl } from '@/hooks/useObjectUrl';
import { kitContent } from '@/content/kit';
import { commonContent } from '@/content/common';
import { KeyRound, Download } from 'lucide-react';

/**
 * Temporary Component Kit / Design System QA page at /_kit.
 * Displays all UI primitives in all states on the standard cream background.
 */
export const KitPage: React.FC = () => {
  const { showToast } = useToast();
  const [activeMode, setActiveMode] = useState<'hide' | 'reveal'>('hide');
  const [chipPressed, setChipPressed] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Platform components interactive demo state
  const [interactiveFile, setInteractiveFile] = useState<File | null>(null);
  const interactivePreviewUrl = useObjectUrl(interactiveFile);
  const [interactiveDimensions, setInteractiveDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [messageValue, setMessageValue] = useState<string>(
    'Meet at the north gate at six, come alone, bring the blue folder.'
  );
  const [messageBytes, setMessageBytes] = useState<number>(64);
  const [interactiveKey, setInteractiveKey] = useState<string>('ABCD-EFGH-');
  const [keySaved, setKeySaved] = useState<boolean>(false);
  const [typewriterKey, setTypewriterKey] = useState<number>(0);

  const toggleOptions = [
    { value: 'hide' as const, label: commonContent.modeHide },
    { value: 'reveal' as const, label: commonContent.modeReveal },
  ];


  return (
    <div className="min-h-screen bg-cream text-ink px-4 py-12 sm:px-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <header className="mb-12 border-b border-line pb-8">
        <div className="flex items-center gap-4 mb-4">
          <Logo glyphSize={32} />
          <span className="text-sm font-sans font-medium px-2.5 py-1 rounded-pill bg-sand text-ink">
            Design System Kit
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-normal text-ink mb-2">
          {kitContent.title}
        </h1>
        <p className="text-ink-soft t-lead">{kitContent.subtitle}</p>
      </header>

      <div className="space-y-16">
        {/* 1. Logo & Glyphs */}
        <section aria-labelledby="section-logo" className="space-y-6">
          <h2
            id="section-logo"
            className="text-xl font-serif font-normal text-ink border-b border-line pb-2"
          >
            {kitContent.logoSection}
          </h2>
          <div className="flex flex-wrap items-center gap-8 bg-paper p-6 rounded-card border border-line">
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-sans text-ink-soft">Full Wordmark</span>
              <Logo glyphSize={28} />
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-sans text-ink-soft">Isolated Glyph (24px)</span>
              <LogoGlyph size={24} className="text-ink" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-sans text-ink-soft">Isolated Glyph (40px)</span>
              <LogoGlyph size={40} className="text-ink" />
            </div>
          </div>
        </section>

        {/* 2. Headlines */}
        <section aria-labelledby="section-headlines" className="space-y-6">
          <h2
            id="section-headlines"
            className="text-xl font-serif font-normal text-ink border-b border-line pb-2"
          >
            {kitContent.headlinesSection}
          </h2>
          <div className="space-y-10 bg-paper p-6 sm:p-8 rounded-card border border-line">
            <div>
              <span className="text-xs font-sans text-ink-soft block mb-1">
                Hero Size (112px clamp)
              </span>
              <Headline
                line1={kitContent.samples.heroHeadline1}
                line2={kitContent.samples.heroHeadline2}
                size="hero"
              />
            </div>
            <div>
              <span className="text-xs font-sans text-ink-soft block mb-1">
                H1 Size (72px clamp)
              </span>
              <Headline
                line1={kitContent.samples.h1Headline1}
                line2={kitContent.samples.h1Headline2}
                size="h1"
              />
            </div>
            <div>
              <span className="text-xs font-sans text-ink-soft block mb-1">
                H2 Size (48px clamp)
              </span>
              <Headline
                line1={kitContent.samples.h2Headline1}
                line2={kitContent.samples.h2Headline2}
                size="h2"
              />
            </div>
            <div>
              <span className="text-xs font-sans text-ink-soft block mb-1">
                H3 Size (32px clamp)
              </span>
              <Headline
                line1={kitContent.samples.h3Headline1}
                line2={kitContent.samples.h3Headline2}
                size="h3"
              />
            </div>
            <div>
              <span className="text-xs font-sans text-ink-soft block mb-1">Center Aligned H2</span>
              <Headline
                line1={kitContent.samples.h2Headline1}
                line2={kitContent.samples.h2Headline2}
                size="h2"
                align="center"
              />
            </div>
          </div>
        </section>

        {/* 3. Buttons */}
        <section aria-labelledby="section-buttons" className="space-y-6">
          <h2
            id="section-buttons"
            className="text-xl font-serif font-normal text-ink border-b border-line pb-2"
          >
            {kitContent.buttonsSection}
          </h2>
          <div className="space-y-6 bg-paper p-6 sm:p-8 rounded-card border border-line">
            <div>
              <span className="text-xs font-sans text-ink-soft block mb-3">
                Primary Buttons (52px & 44px nav)
              </span>
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="primary">{kitContent.samples.primaryBtn}</Button>
                <Button
                  variant="primary"
                  leadingIcon={<Download className="w-4 h-4" strokeWidth={1.5} />}
                >
                  {commonContent.actions.downloadImage}
                </Button>
                <Button variant="primary" size="nav">
                  {kitContent.samples.navBtn} (Nav size)
                </Button>
                <Button variant="primary" disabled>
                  {kitContent.samples.disabledBtn} (Disabled)
                </Button>
              </div>
            </div>

            <div>
              <span className="text-xs font-sans text-ink-soft block mb-3">Secondary Buttons</span>
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="secondary">{kitContent.samples.secondaryBtn}</Button>
                <Button
                  variant="secondary"
                  leadingIcon={<KeyRound className="w-4 h-4" strokeWidth={1.5} />}
                >
                  {commonContent.actions.copyKey}
                </Button>
                <Button variant="secondary" size="nav">
                  {kitContent.samples.secondaryBtn} (Nav size)
                </Button>
                <Button variant="secondary" disabled>
                  {kitContent.samples.secondaryBtn} (Disabled)
                </Button>
              </div>
            </div>

            <div>
              <span className="text-xs font-sans text-ink-soft block mb-3">
                Full Width on Mobile Button
              </span>
              <Button variant="primary" fullWidthOnMobile>
                {kitContent.samples.fullWidthBtn}
              </Button>
            </div>
          </div>
        </section>

        {/* 4. Text Links */}
        <section aria-labelledby="section-links" className="space-y-6">
          <h2
            id="section-links"
            className="text-xl font-serif font-normal text-ink border-b border-line pb-2"
          >
            {kitContent.textLinksSection}
          </h2>
          <div className="flex flex-wrap items-center gap-8 bg-paper p-6 rounded-card border border-line">
            <TextLink as="a" href="#standard">
              {kitContent.samples.linkDefault}
            </TextLink>
            <TextLink as="a" href="#with-chevron" withChevron>
              {kitContent.samples.linkLearnMore}
            </TextLink>
            <TextLink as="button" onClick={() => showToast(kitContent.samples.toastKeyCopied)}>
              Button TextLink (Triggers Toast)
            </TextLink>
          </div>
        </section>

        {/* 5. Segmented Toggle */}
        <section aria-labelledby="section-toggles" className="space-y-6">
          <h2
            id="section-toggles"
            className="text-xl font-serif font-normal text-ink border-b border-line pb-2"
          >
            {kitContent.togglesSection}
          </h2>
          <div className="bg-paper p-6 rounded-card border border-line flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <SegmentedToggle
              options={toggleOptions}
              value={activeMode}
              onChange={setActiveMode}
              ariaLabel="Mode selector"
            />
            <p className="text-sm font-sans text-ink-soft">
              Active mode: <strong className="text-ink">{activeMode}</strong> (Use Left/Right arrow
              keys to navigate)
            </p>
          </div>
        </section>

        {/* 6. Chips */}
        <section aria-labelledby="section-chips" className="space-y-6">
          <h2
            id="section-chips"
            className="text-xl font-serif font-normal text-ink border-b border-line pb-2"
          >
            {kitContent.chipsSection}
          </h2>
          <div className="bg-paper p-6 rounded-card border border-line flex flex-wrap items-center gap-4">
            <Chip pressed={chipPressed} onToggle={setChipPressed}>
              {chipPressed ? kitContent.samples.chipActive : kitContent.samples.chipInactive}
            </Chip>
            <span className="text-sm font-sans text-ink-soft">
              Status: {chipPressed ? 'Active (amplified 50x)' : 'Inactive'}
            </span>
          </div>
        </section>

        {/* 7. Toast System */}
        <section aria-labelledby="section-toasts" className="space-y-6">
          <h2
            id="section-toasts"
            className="text-xl font-serif font-normal text-ink border-b border-line pb-2"
          >
            {kitContent.toastsSection}
          </h2>
          <div className="bg-paper p-6 rounded-card border border-line flex flex-wrap items-center gap-4">
            <Button
              variant="secondary"
              onClick={() => showToast(kitContent.samples.toastKeyCopied)}
            >
              Trigger "{kitContent.samples.toastKeyCopied}"
            </Button>
            <Button
              variant="secondary"
              onClick={() => showToast(kitContent.samples.toastDownloaded)}
            >
              Trigger "{kitContent.samples.toastDownloaded}"
            </Button>
            <span className="text-xs font-sans text-ink-soft">
              (Single pill at bottom-center, replaces prior toast, visible 3s, fades in 150ms)
            </span>
          </div>
        </section>

        {/* 8. Modal Dialog */}
        <section aria-labelledby="section-modals" className="space-y-6">
          <h2
            id="section-modals"
            className="text-xl font-serif font-normal text-ink border-b border-line pb-2"
          >
            {kitContent.modalsSection}
          </h2>
          <div className="bg-paper p-6 rounded-card border border-line">
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              {kitContent.samples.openModalBtn}
            </Button>

            <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              title={commonContent.sharingGuidance.title}
              description={commonContent.sharingGuidance.subtitle}
            >
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-serif font-normal text-ink mb-1">
                    {commonContent.sharingGuidance.title}
                  </h3>
                  <p className="text-sm font-sans text-ink-soft">
                    {commonContent.sharingGuidance.subtitle}
                  </p>
                </div>

                <div className="space-y-3 font-sans text-base text-ink">
                  <p>{commonContent.sharingGuidance.tip1}</p>
                  <p>{commonContent.sharingGuidance.tip2}</p>
                  <p>{commonContent.sharingGuidance.tip3}</p>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button variant="primary" onClick={() => setIsModalOpen(false)}>
                    {commonContent.actions.gotIt}
                  </Button>
                </div>
              </div>
            </Modal>
          </div>
        </section>

        {/* 9. Skeletons */}
        <section aria-labelledby="section-skeletons" className="space-y-6">
          <h2
            id="section-skeletons"
            className="text-xl font-serif font-normal text-ink border-b border-line pb-2"
          >
            {kitContent.skeletonsSection}
          </h2>
          <div className="bg-paper p-6 rounded-card border border-line space-y-4 max-w-md">
            <Skeleton height={28} width="70%" />
            <Skeleton height={18} width="100%" />
            <Skeleton height={18} width="85%" />
            <Skeleton height={48} rounded="pill" />
          </div>
        </section>

        {/* 10. Inline Messages */}
        <section aria-labelledby="section-messages" className="space-y-6">
          <h2
            id="section-messages"
            className="text-xl font-serif font-normal text-ink border-b border-line pb-2"
          >
            {kitContent.inlineMessagesSection}
          </h2>
          <div className="space-y-4 bg-paper p-6 rounded-card border border-line">
            <div>
              <span className="text-xs font-sans text-ink-soft block mb-1">
                Error Variant (Border only, never filled red)
              </span>
              <InlineMessage variant="error">{kitContent.samples.errorMessage}</InlineMessage>
            </div>
            <div>
              <span className="text-xs font-sans text-ink-soft block mb-1">
                Note Variant (Sand background)
              </span>
              <InlineMessage variant="note">{kitContent.samples.noteMessage}</InlineMessage>
            </div>
            <div>
              <span className="text-xs font-sans text-ink-soft block mb-1">Offline Variant</span>
              <InlineMessage variant="offline">{kitContent.samples.offlineMessage}</InlineMessage>
            </div>
          </div>
        </section>

        {/* 11. PixelGrid */}
        <section aria-labelledby="section-pixelgrid" className="space-y-6">
          <h2
            id="section-pixelgrid"
            className="text-xl font-serif font-normal text-ink border-b border-line pb-2"
          >
            {kitContent.pixelGridSection}
          </h2>
          <div className="flex flex-wrap items-center gap-12 bg-paper p-6 rounded-card border border-line">
            <div className="flex flex-col items-center gap-3">
              <span className="text-xs font-sans text-ink-soft">Static (Default Pattern)</span>
              <div className="p-3 bg-cream rounded-btn border border-line text-ink">
                <PixelGrid cellSize={4} gap={2} />
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <span className="text-xs font-sans text-ink-soft">Animated (Wave Pulse)</span>
              <div className="p-3 bg-cream rounded-btn border border-line text-ink">
                <PixelGrid cellSize={4} gap={2} animated />
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <span className="text-xs font-sans text-ink-soft">
                Inside Waveform Pill Simulation
              </span>
              <div className="h-[44px] px-5 rounded-pill border-2 border-ink bg-paper inline-flex items-center gap-3">
                <PixelGrid cellSize={3.5} gap={1.5} animated className="text-ink" />
                <span className="font-sans text-sm font-medium text-ink">Processing image</span>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            PLATFORM COMPONENTS (/app Building Blocks)
            ========================================================================= */}
        <div className="pt-12 border-t-2 border-line space-y-16">
          <div>
            <span className="text-xs font-sans font-semibold tracking-wider uppercase text-ink-soft block mb-2">
              Platform Building Blocks
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-normal text-ink">
              {kitContent.platformHeader}
            </h2>
            <p className="text-ink-soft text-base mt-1">
              Presentational and behavioral components for the Hide and Reveal flows on /app.
            </p>
          </div>

          {/* 1. DROPZONE */}
          <section aria-labelledby="section-dropzone" className="space-y-6">
            <h3
              id="section-dropzone"
              className="text-xl font-serif font-normal text-ink border-b border-line pb-2"
            >
              1. {kitContent.dropzoneSection}
            </h3>
            <div className="space-y-8 bg-paper p-6 sm:p-8 rounded-card border border-line">
              {/* Interactive Dropzone */}
              <div>
                <span className="text-xs font-sans text-ink-soft block mb-2">
                  Interactive Dropzone (Hide Mode) — Try dropping, choosing, or pasting an image:
                </span>
                <Dropzone
                  mode="hide"
                  file={interactiveFile}
                  previewUrl={interactivePreviewUrl}
                  dimensions={interactiveDimensions}
                  onFile={(f) => {
                    setInteractiveFile(f);
                    setInteractiveDimensions({ width: 1920, height: 1080 });
                  }}
                  onClear={() => {
                    setInteractiveFile(null);
                    setInteractiveDimensions(null);
                  }}
                />
              </div>

              {/* Reveal Mode Idle */}
              <div>
                <span className="text-xs font-sans text-ink-soft block mb-2">
                  Reveal Mode Idle State:
                </span>
                <Dropzone
                  mode="reveal"
                  file={null}
                  previewUrl={null}
                  onFile={() => {}}
                  onClear={() => {}}
                />
              </div>

              {/* Simulated Loaded State */}
              <div>
                <span className="text-xs font-sans text-ink-soft block mb-2">
                  Loaded Preview State (with caption and "Change photo" link):
                </span>
                <Dropzone
                  mode="hide"
                  file={new File(['sample'], 'holiday.png', { type: 'image/png' })}
                  previewUrl="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400' viewBox='0 0 800 400'%3E%3Crect width='800' height='400' fill='%23E4E3D0'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='20' fill='%236B6A5E' text-anchor='middle' dominant-baseline='middle'%3ESample Preview Photo%3C/text%3E%3C/svg%3E"
                  dimensions={{ width: 1920, height: 1080 }}
                  onFile={() => {}}
                  onClear={() => {}}
                />
              </div>

              {/* Error State */}
              <div>
                <span className="text-xs font-sans text-ink-soft block mb-2">
                  Error State (1px error dashed border with inline error below):
                </span>
                <Dropzone
                  mode="hide"
                  file={null}
                  previewUrl={null}
                  error="That file is 14 MB. The limit is 10 MB."
                  onFile={() => {}}
                  onClear={() => {}}
                />
              </div>
            </div>
          </section>

          {/* 2. MESSAGE FIELD */}
          <section aria-labelledby="section-message-field" className="space-y-6">
            <h3
              id="section-message-field"
              className="text-xl font-serif font-normal text-ink border-b border-line pb-2"
            >
              2. {kitContent.messageFieldSection}
            </h3>
            <div className="space-y-6 bg-paper p-6 sm:p-8 rounded-card border border-line">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-sans text-ink-soft">
                    Active Textarea (Auto-grows 160px–320px, UTF-8 byte counting):
                  </span>
                  <span className="text-xs font-mono text-ink-soft">
                    UTF-8 Bytes: <strong className="text-ink">{messageBytes}</strong>
                  </span>
                </div>
                <MessageField
                  value={messageValue}
                  onChange={setMessageValue}
                  onByteCountChange={setMessageBytes}
                />
              </div>

              <div>
                <span className="text-xs font-sans text-ink-soft block mb-2">
                  Disabled State (With "Add a photo first." hint):
                </span>
                <MessageField
                  value=""
                  onChange={() => {}}
                  disabled={true}
                />
              </div>
            </div>
          </section>

          {/* 3. CAPACITY METER */}
          <section aria-labelledby="section-capacity-meter" className="space-y-6">
            <h3
              id="section-capacity-meter"
              className="text-xl font-serif font-normal text-ink border-b border-line pb-2"
            >
              3. {kitContent.capacityMeterSection}
            </h3>
            <div className="space-y-6 bg-paper p-6 sm:p-8 rounded-card border border-line">
              <div>
                <span className="text-xs font-sans text-ink-soft block mb-2">
                  Normal Capacity (182 of 412 bytes used):
                </span>
                <CapacityMeter used={182} capacity={412} />
              </div>

              <div>
                <span className="text-xs font-sans text-ink-soft block mb-2">
                  Over Capacity State (Too long by 36 bytes with error bar and alert icon):
                </span>
                <CapacityMeter used={448} capacity={412} />
              </div>

              <div>
                <span className="text-xs font-sans text-ink-soft block mb-2">
                  Loading Skeleton State (capacity null, loading true):
                </span>
                <CapacityMeter used={0} capacity={null} loading={true} />
              </div>

              <div>
                <span className="text-xs font-sans text-ink-soft block mb-2">
                  Hard Cap Clamped (Capacity greater than 4096 is clamped to 4096):
                </span>
                <CapacityMeter used={1200} capacity={8192} />
              </div>
            </div>
          </section>

          {/* 4. KEY CARD */}
          <section aria-labelledby="section-key-card" className="space-y-6">
            <h3
              id="section-key-card"
              className="text-xl font-serif font-normal text-ink border-b border-line pb-2"
            >
              4. {kitContent.keyCardSection}
            </h3>
            <div className="bg-paper p-6 sm:p-8 rounded-card border border-line">
              <span className="text-xs font-sans text-ink-soft block mb-1">
                Full Key Card (Sand block, serif H3 heading, JetBrains Mono 22px grouped key, copy button with 2s state, text download, 44px hit-area saved checkbox, warning line):
              </span>
              <KeyCard
                keyValue={kitContent.samples.sampleKey}
                saved={keySaved}
                onSavedChange={setKeySaved}
              />
            </div>
          </section>

          {/* 5. PROGRESS PILL */}
          <section aria-labelledby="section-progress-pill" className="space-y-6">
            <h3
              id="section-progress-pill"
              className="text-xl font-serif font-normal text-ink border-b border-line pb-2"
            >
              5. {kitContent.progressPillSection}
            </h3>
            <div className="space-y-6 bg-paper p-6 sm:p-8 rounded-card border border-line">
              <div>
                <span className="text-xs font-sans text-ink-soft block mb-2">
                  Hide Flow Pill (56px high, 2px ink border, paper fill, animated PixelGrid):
                </span>
                <div className="max-w-md">
                  <ProgressPill label="Hiding your message" />
                </div>
              </div>

              <div>
                <span className="text-xs font-sans text-ink-soft block mb-2">
                  Reveal Flow Pill:
                </span>
                <div className="max-w-md">
                  <ProgressPill label="Looking for your message" />
                </div>
              </div>
            </div>
          </section>

          {/* 6. KEY INPUT */}
          <section aria-labelledby="section-key-input" className="space-y-6">
            <h3
              id="section-key-input"
              className="text-xl font-serif font-normal text-ink border-b border-line pb-2"
            >
              6. {kitContent.keyInputSection}
            </h3>
            <div className="space-y-6 bg-paper p-6 sm:p-8 rounded-card border border-line">
              <div>
                <span className="text-xs font-sans text-ink-soft block mb-2">
                  Interactive Key Input (Live uppercase, Base32 filtering, 4-char hyphens, caret preservation, paste button):
                </span>
                <KeyInput value={interactiveKey} onChange={setInteractiveKey} />
              </div>

              <div>
                <span className="text-xs font-sans text-ink-soft block mb-2">
                  Complete & Valid State (Small forest check icon):
                </span>
                <KeyInput
                  value={kitContent.samples.sampleValidKey}
                  onChange={() => {}}
                />
              </div>

              <div>
                <span className="text-xs font-sans text-ink-soft block mb-2">
                  Complete but Malformed State (Inline error beneath):
                </span>
                <KeyInput
                  value={kitContent.samples.sampleMalformedKey}
                  onChange={() => {}}
                />
              </div>
            </div>
          </section>

          {/* 7. METRICS ROW */}
          <section aria-labelledby="section-metrics-row" className="space-y-6">
            <h3
              id="section-metrics-row"
              className="text-xl font-serif font-normal text-ink border-b border-line pb-2"
            >
              7. {kitContent.metricsRowSection}
            </h3>
            <div className="bg-paper p-6 sm:p-8 rounded-card border border-line">
              <span className="text-xs font-sans text-ink-soft block mb-4">
                Technical Quality Metrics with Accessible Keyboard/Focus/Hover Tooltips:
              </span>
              <MetricsRow
                psnr={46.2}
                ssim={0.994}
                usedBytes={182}
                capacityBytes={412}
              />
            </div>
          </section>

          {/* 8. SHARING NOTE */}
          <section aria-labelledby="section-sharing-note" className="space-y-6">
            <h3
              id="section-sharing-note"
              className="text-xl font-serif font-normal text-ink border-b border-line pb-2"
            >
              8. {kitContent.sharingNoteSection}
            </h3>
            <div className="bg-paper p-6 sm:p-8 rounded-card border border-line space-y-4">
              <span className="text-xs font-sans text-ink-soft block mb-2">
                Inline Sand Note with "Why?" Link:
              </span>
              <SharingNote />
            </div>
          </section>

          {/* 9. DECORATIVE BACKDROP */}
          <section aria-labelledby="section-decorative-backdrop" className="space-y-6">
            <h3
              id="section-decorative-backdrop"
              className="text-xl font-serif font-normal text-ink border-b border-line pb-2"
            >
              9. {kitContent.decorativeBackdropSection}
            </h3>
            <div className="bg-paper p-6 sm:p-8 rounded-card border border-line">
              <span className="text-xs font-sans text-ink-soft block mb-3">
                Subtle Curved Shapes (Preview in framed container; renders hidden below 1280px by default):
              </span>
              <div className="relative h-64 w-full rounded-card bg-cream border border-line overflow-hidden flex items-center justify-center">
                <DecorativeBackdrop className="!block" />
                <span className="relative z-10 text-sm font-sans font-medium text-ink bg-paper/90 px-4 py-2 rounded-pill border border-line">
                  Platform Card Position
                </span>
              </div>
            </div>
          </section>

          {/* 10. TYPEWRITER TEXT */}
          <section aria-labelledby="section-typewriter-text" className="space-y-6">
            <h3
              id="section-typewriter-text"
              className="text-xl font-serif font-normal text-ink border-b border-line pb-2"
            >
              10. {kitContent.typewriterTextSection}
            </h3>
            <div className="space-y-6 bg-paper p-6 sm:p-8 rounded-card border border-line">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-sans text-ink-soft">
                    Short Secret Message (Serif 28px):
                  </span>
                  <Button
                    variant="secondary"
                    size="nav"
                    onClick={() => setTypewriterKey((k) => k + 1)}
                  >
                    Replay Animation
                  </Button>
                </div>
                <div className="p-6 bg-cream rounded-card border border-line">
                  <TypewriterText
                    key={`short-${typewriterKey}`}
                    text={kitContent.samples.sampleShortMessage}
                    duration={1200}
                  />
                </div>
              </div>

              <div>
                <span className="text-xs font-sans text-ink-soft block mb-3">
                  Long Secret Message (Auto-scales to 18px sans):
                </span>
                <div className="p-6 bg-cream rounded-card border border-line">
                  <TypewriterText
                    key={`long-${typewriterKey}`}
                    text={kitContent.samples.sampleLongMessage}
                    duration={1200}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

