"use client";

import { useRef } from "react";
import { useConfirm } from "@/components/layout/AegisConfirm";

interface ConfirmSubmitButtonProps {
  title: string;
  message: string;
  className?: string;
  style?: React.CSSProperties;
  buttonTitle?: string;
  children: React.ReactNode;
}

/**
 * Wraps a form submit button with an accessible in-app confirmation modal
 * so server-action delete forms require explicit confirmation first.
 */
export default function ConfirmSubmitButton({
  title,
  message,
  className,
  style,
  buttonTitle,
  children,
}: ConfirmSubmitButtonProps) {
  const { showConfirm } = useConfirm();
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = async () => {
    const confirmed = await showConfirm(title, message);
    if (confirmed) {
      const form = btnRef.current?.closest("form");
      form?.requestSubmit();
    }
  };

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={handleClick}
      className={className}
      style={style}
      title={buttonTitle}
      aria-label={buttonTitle}
    >
      {children}
    </button>
  );
}
