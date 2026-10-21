import React from 'react';
import { Modal, Button } from '@/components/ui';
import { useSharingModal } from './SharingModalContext';
import { shellContent } from '@/content/shell';

/**
 * Sharing guidance modal adhering to Section 7.4 of design.md.
 * Opened from "Why?" links and the FAB on /app.
 */
export const SharingModal: React.FC = () => {
  const { isOpen, closeSharingModal } = useSharingModal();

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeSharingModal}
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
          <Button variant="primary" onClick={closeSharingModal}>
            {shellContent.sharingModal.closeAction}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
