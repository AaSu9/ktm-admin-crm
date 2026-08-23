'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DeleteFormProps {
  action: (formData: FormData) => void | Promise<unknown>;
  confirmMessage?: string;
  children: React.ReactNode;
  className?: string;
  successMessage?: string;
}

export default function DeleteForm({
  action,
  confirmMessage = 'Are you sure you want to delete this?',
  children,
  className = 'inline',
  successMessage = 'Item deleted successfully',
}: DeleteFormProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isDeleting) return;

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsDeleting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const res = await action(formData);
      if (res && typeof res === 'object' && 'success' in res && res.success === false) {
        toast.error((res.error as string) || 'Failed to delete item');
      } else {
        toast.success(successMessage);
      }
    } catch (error) {
      console.error('Delete action failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete item');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      {isDeleting ? (
        <span className="p-1.5 inline-flex items-center justify-center text-red-500 animate-spin" title="Deleting...">
          <Loader2 className="h-4 w-4" />
        </span>
      ) : (
        children
      )}
    </form>
  );
}
