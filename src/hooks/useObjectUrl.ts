import { useState, useEffect } from 'react';

/**
 * Hook to manage an object URL for a File or Blob.
 * Automatically creates an object URL when a file is provided,
 * and always revokes the prior URL on change, clear, and unmount.
 */
export function useObjectUrl(file: File | Blob | null | undefined): string | null {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setObjectUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  return objectUrl;
}
