import React from 'react';
import { Headline, Button } from '@/components/ui';
import { shellContent } from '@/content/shell';

/**
 * Minimal on-brand 404 NotFound page per Section 2 of design.md.
 */
export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 py-24">
      <div className="max-w-md space-y-8">
        <Headline
          line1={shellContent.notFound.line1}
          line2={shellContent.notFound.line2}
          size="h1"
          align="center"
        />

        <p className="t-lead text-ink-soft">
          {shellContent.notFound.lead}
        </p>

        <div className="pt-2">
          <Button as="link" to="/" variant="primary">
            {shellContent.notFound.action}
          </Button>
        </div>
      </div>
    </div>
  );
};
