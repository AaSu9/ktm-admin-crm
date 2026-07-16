'use client';

import React from 'react';

interface DeleteFormProps {
  action: (formData: FormData) => void | Promise<void>;
  confirmMessage?: string;
  children: React.ReactNode;
  className?: string;
}

export default function DeleteForm({
  action,
  confirmMessage = 'Are you sure?',
  children,
  className = 'inline',
}: DeleteFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!confirm(confirmMessage)) {
      e.preventDefault();
    }
  };

  return (
    <form action={action} onSubmit={handleSubmit} className={className}>
      {children}
    </form>
  );
}
