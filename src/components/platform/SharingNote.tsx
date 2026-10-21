import React, { useState } from 'react';
import { platformContent } from '@/content/platform';
import { TextLink } from '@/components/ui/TextLink';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { shellContent } from '@/content/shell';

export interface SharingNoteProps {
  onOpenModal?: () => void;
  className?: string;
  id?: string;
}

/**
 * SharingNote (design.md 6.2 D5)
 * A small inline sand note:
 * "Send this image as a file, not a photo. The key goes in a different message."
 * followed by a TextLink "Why?" that opens the SharingModal.
 */
export const SharingNote: React.FC<SharingNoteProps> = ({
  onOpenModal,
  className = '',
  id,
}) => {
  const [isLocalModalOpen, setIsLocalModalOpen] = useState(false);

  const handleWhyClick = () => {
    if (onOpenModal) {
      onOpenModal();
    } else {
      setIsLocalModalOpen(true);
    }
  };

  return (
    <>
      <div
        id={id}
        className={`bg-sand-soft rounded-btn border border-line p-3.5 text-sm font-sans text-ink flex flex-wrap items-center gap-1.5 leading-normal ${className}`}
      >
        <span>{platformContent.sharingNote.text}</span>
        <TextLink as="button" onClick={handleWhyClick} className="font-medium">
          {platformContent.sharingNote.whyLink}
        </TextLink>
      </div>

      {/* Fallback local modal when rendered outside of SharingModalProvider */}
      {!onOpenModal && (
        <Modal
          isOpen={isLocalModalOpen}
          onClose={() => setIsLocalModalOpen(false)}
          title={shellContent.sharingModal.title}
        >
          <div className="space-y-6">
            <div>
              <h3 className="t-h3 font-serif font-normal text-ink mb-1">
                {shellContent.sharingModal.title}
              </h3>
            </div>

            <div className="space-y-3.5 font-sans text-base text-ink leading-relaxed">
              <p>{shellContent.sharingModal.tip1}</p>
              <p>{shellContent.sharingModal.tip2}</p>
              <p>{shellContent.sharingModal.tip3}</p>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="primary" onClick={() => setIsLocalModalOpen(false)}>
                {shellContent.sharingModal.closeAction}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
