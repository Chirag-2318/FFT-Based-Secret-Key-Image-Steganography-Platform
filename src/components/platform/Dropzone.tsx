import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ImagePlus } from 'lucide-react';
import { platformContent } from '@/content/platform';
import { validateImage } from '@/lib/validateImage';
import { InlineMessage } from '@/components/ui/InlineMessage';

export interface DropzoneProps {
  mode: 'hide' | 'reveal';
  file: File | null;
  previewUrl: string | null;
  dimensions?: { width: number; height: number } | null;
  onFile: (file: File) => void;
  onClear: () => void;
  error?: string | null;
  className?: string;
  id?: string;
}

/**
 * Format bytes into human-readable size string (e.g. 3.4 MB, 820 KB).
 */
function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.round(bytes / 1024)} KB`;
}

/**
 * Presentational and behavioral Dropzone component.
 * Supports drag-and-drop, native file selection, paste from clipboard,
 * and keyboard navigation (Enter/Space to trigger file chooser).
 */
export const Dropzone: React.FC<DropzoneProps> = ({
  mode,
  file,
  previewUrl,
  dimensions,
  onFile,
  onClear,
  error: externalError,
  className = '',
  id,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [multiFileNotice, setMultiFileNotice] = useState<string | null>(null);

  const displayError = externalError || internalError;

  const handleProcessFile = useCallback(
    async (candidateFile: File) => {
      setInternalError(null);
      const validation = await validateImage(candidateFile, mode);
      if (!validation.isValid && validation.error) {
        setInternalError(validation.error);
        return;
      }
      onFile(candidateFile);
    },
    [mode, onFile]
  );

  // Document-level paste listener while this dropzone is mounted
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const pastedFile = item.getAsFile();
          if (pastedFile) {
            e.preventDefault();
            handleProcessFile(pastedFile);
            break;
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [handleProcessFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (e.dataTransfer.files.length > 1) {
        setMultiFileNotice(platformContent.validation.multiFileNote);
      } else {
        setMultiFileNotice(null);
      }
      const droppedFile = e.dataTransfer.files[0];
      handleProcessFile(droppedFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMultiFileNotice(null);
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      handleProcessFile(selectedFile);
    }
    // Reset file input so picking the same file again triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const isLoaded = Boolean(file && previewUrl);

  const idleTitle =
    mode === 'reveal'
      ? platformContent.dropzone.revealIdleTitle
      : platformContent.dropzone.hideIdleTitle;

  const idleCaption =
    mode === 'reveal'
      ? platformContent.dropzone.revealCaption
      : platformContent.dropzone.hideCaption;

  const changeLinkText =
    mode === 'reveal'
      ? platformContent.dropzone.revealChangeLink
      : platformContent.dropzone.hideChangeLink;

  const errorElementId = `${id || 'dropzone'}-error`;

  return (
    <div className={`w-full space-y-3 ${className}`} id={id}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/bmp"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleFileInputChange}
      />

      {isLoaded ? (
        /* Loaded Preview State */
        <div className="space-y-3">
          <div className="h-[280px] w-full rounded-card overflow-hidden border border-line bg-cream relative">
            <img
              src={previewUrl!}
              alt={file?.name || 'Selected preview'}
              className="w-full h-full object-cover rounded-card"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-sm font-sans text-ink-soft">
            <span className="truncate">
              {file?.name}
              {dimensions ? ` · ${dimensions.width} x ${dimensions.height}` : ''}
              {file?.size ? ` · ${formatFileSize(file.size)}` : ''}
            </span>
            <button
              type="button"
              onClick={() => {
                setMultiFileNotice(null);
                onClear();
                openFileDialog();
              }}
              className="text-ink font-medium underline underline-offset-4 hover:text-ink/80 focus-visible:outline-2 focus-visible:outline-forest focus-visible:outline-offset-3 rounded-btn transition-colors cursor-pointer"
              aria-label={`${changeLinkText} (${file?.name})`}
            >
              {changeLinkText}
            </button>
          </div>
        </div>
      ) : (
        /* Idle / Drag-over State */
        <div
          ref={containerRef}
          role="button"
          tabIndex={0}
          aria-label={platformContent.dropzone.accessibleName}
          aria-describedby={displayError ? errorElementId : undefined}
          onClick={openFileDialog}
          onKeyDown={handleKeyDown}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`h-[280px] w-full rounded-card flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-forest focus-visible:outline-offset-3 ${
            isDragOver
              ? 'border-2 border-solid border-forest bg-sand-soft'
              : displayError
                ? 'border-[1px] border-dashed border-error bg-cream'
                : 'border-2 border-dashed border-line bg-cream hover:border-ink-soft'
          }`}
        >
          {isDragOver ? (
            <p className="font-sans text-base font-medium text-forest">
              {platformContent.dropzone.dragOverText}
            </p>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-pill bg-sand/40 flex items-center justify-center text-ink-soft">
                <ImagePlus className="w-6 h-6 stroke-[1.5]" />
              </div>
              <div className="space-y-1">
                <p className="font-sans text-base text-ink">
                  {idleTitle}{' '}
                  <span className="text-ink font-medium underline underline-offset-4">
                    {platformContent.dropzone.chooseFileLink}
                  </span>
                </p>
                <p className="font-sans text-sm text-ink-soft">{idleCaption}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Multiple Files Dropped Note */}
      {multiFileNotice && !displayError && (
        <InlineMessage variant="note" className="w-full">
          {multiFileNotice}
        </InlineMessage>
      )}

      {/* Inline Error Message */}
      {displayError && (
        <InlineMessage id={errorElementId} variant="error" className="w-full">
          {displayError}
        </InlineMessage>
      )}
    </div>
  );
};
