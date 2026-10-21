import React, { useState } from 'react';
import { Dropzone, KeyInput } from '@/components/platform';
import { Button } from '@/components/ui/Button';
import { platformContent } from '@/content/platform';
import { commonContent } from '@/content/common';

/**
 * RevealModeStub: temporary placeholder for Reveal mode on /app.
 * Will be fully replaced in Prompt 8.
 */
export const RevealModeStub: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [key, setKey] = useState<string>('');

  return (
    <div className="space-y-8">
      {/* Dropzone in Reveal Mode */}
      <Dropzone
        mode="reveal"
        file={file}
        previewUrl={null}
        onFile={setFile}
        onClear={() => setFile(null)}
      />

      {/* Key Input */}
      <div className="space-y-2">
        <KeyInput value={key} onChange={setKey} />
      </div>

      {/* Disabled Reveal Action Button */}
      <div className="pt-2">
        <Button variant="primary" disabled fullWidthOnMobile className="w-full">
          {commonContent.actions.revealMessage}
        </Button>
      </div>

      <div className="text-center pt-2">
        <p className="font-sans text-xs text-ink-soft">
          Reveal mode engine is being assembled. Full reveal flow arriving in the next release.
        </p>
      </div>
    </div>
  );
};
