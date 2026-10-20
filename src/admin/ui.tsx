import {
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Inbox,
  LoaderCircle,
  RefreshCw,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ApiError } from "../lib/api";

export function formatApiError(error: unknown): string {
  if (error instanceof ApiError) {
    const details = Object.values(error.details).flat();
    if (details.length > 0) {
      return `${error.message} ${details[0]}`;
    }
    return error.message;
  }
  return error instanceof Error ? error.message : "操作失败，请稍后重试。";
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
  back,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  back?: { to: string; label: string };
}) {
  return (
    <header className="admin-page-header">
      <div className="admin-page-heading">
        {back ? (
          <Link to={back.to} className="back-link admin-back-link">
            <ArrowLeft size={14} />
            {back.label}
          </Link>
        ) : null}
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="admin-page-actions">{actions}</div> : null}
    </header>
  );
}

export function Card({
  title,
  description,
  actions,
  children,
  className = "",
  flush = false,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <section className={`admin-card ${className}`.trim()}>
      {title || description || actions ? (
        <header className="admin-card-head">
          <div>
            {title ? <h2>{title}</h2> : null}
            {description ? <p>{description}</p> : null}
          </div>
          {actions ? <div className="admin-card-actions">{actions}</div> : null}
        </header>
      ) : null}
      <div className={flush ? "admin-card-body-flush" : "admin-card-body"}>
        {children}
      </div>
    </section>
  );
}

export function FormField({
  label,
  htmlFor,
  hint,
  error,
  required,
  full,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  full?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`form-field ${full ? "form-field-full" : ""}`.trim()}>
      <label htmlFor={htmlFor}>
        {label}
        {required ? <span className="required-mark">*</span> : null}
      </label>
      {children}
      {error ? <small className="field-error">{error}</small> : null}
      {hint ? <small className="field-hint">{hint}</small> : null}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`admin-toggle ${checked ? "is-on" : ""}`.trim()}
      onClick={() => onChange(!checked)}
    >
      <span className="admin-toggle-track">
        <span />
      </span>
      <span className="admin-toggle-copy">
        <strong>{label}</strong>
        {description ? <small>{description}</small> : null}
      </span>
    </button>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "muted" | "accent";
}) {
  return <span className={`admin-badge badge-${tone}`}>{children}</span>;
}

export function AdminLoading({ label = "正在读取内容" }: { label?: string }) {
  return (
    <div className="admin-loading-block" role="status">
      <div className="admin-skeleton admin-skeleton-title" />
      <div className="admin-skeleton" />
      <div className="admin-skeleton admin-skeleton-short" />
      <p>
        <LoaderCircle size={14} className="spin" />
        {label}
      </p>
    </div>
  );
}

export function AdminError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="admin-error-block" role="alert">
      <AlertTriangle size={20} />
      <div>
        <h3>内容没有加载成功</h3>
        <p>{message}</p>
      </div>
      {onRetry ? (
        <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
          <RefreshCw size={14} />
          重试
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="admin-empty">
      <span className="admin-empty-icon">
        {icon ?? <Inbox size={21} />}
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    window.setTimeout(() => dialogRef.current?.focus(), 20);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="admin-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={`admin-modal admin-modal-${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <header className="admin-modal-head">
          <div>
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          <button
            type="button"
            className="admin-icon-button"
            onClick={onClose}
            aria-label="关闭弹窗"
          >
            <X size={17} />
          </button>
        </header>
        <div className="admin-modal-body">{children}</div>
        {footer ? <footer className="admin-modal-foot">{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "确认删除",
  loading = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <LoaderCircle size={14} className="spin" /> : null}
            {loading ? "处理中" : confirmLabel}
          </button>
        </>
      }
    >
      <p className="confirm-copy">{description}</p>
    </Modal>
  );
}

export function SavedIndicator({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="saved-indicator">
      <CheckCircle2 size={13} />
      已保存
    </span>
  );
}
