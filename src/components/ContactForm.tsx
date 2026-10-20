import { useState, type FormEvent } from "react";
import { AlertCircle, ArrowUpRight, Check, Send } from "lucide-react";
import { ApiError, api } from "../lib/api";
import { Spinner } from "./Brand";

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
  website: string;
}

const initialForm: FormState = {
  name: "",
  email: "",
  subject: "",
  message: "",
  website: "",
};

export function ContactForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const update = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((current) => ({ ...current, [field]: [] }));
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    setSending(true);
    try {
      await api.sendContact(form);
      setSuccess(true);
      setForm(initialForm);
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
        setFieldErrors(caught.details);
      } else {
        setError("发送失败，请稍后再试。");
      }
    } finally {
      setSending(false);
    }
  };

  if (success) {
    return (
      <div className="contact-success" role="status">
        <span className="success-icon">
          <Check size={24} />
        </span>
        <p className="eyebrow">MESSAGE RECEIVED</p>
        <h3>谢谢你，留言已经抵达。</h3>
        <p>我会在 1–2 个工作日内回复。在此之前，也可以直接发邮件。</p>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setSuccess(false)}
        >
          再写一条
        </button>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      <div className="form-row">
        <label className="field">
          <span>你的名字</span>
          <input
            type="text"
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder="怎么称呼你？"
            autoComplete="name"
            maxLength={60}
            required
          />
          {fieldErrors.name?.[0] ? (
            <small className="field-error">{fieldErrors.name[0]}</small>
          ) : null}
        </label>
        <label className="field">
          <span>邮箱</span>
          <input
            type="email"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            maxLength={120}
            required
          />
          {fieldErrors.email?.[0] ? (
            <small className="field-error">{fieldErrors.email[0]}</small>
          ) : null}
        </label>
      </div>

      <label className="field">
        <span>想聊点什么</span>
        <input
          type="text"
          value={form.subject}
          onChange={(event) => update("subject", event.target.value)}
          placeholder="合作、咨询，或者只是打个招呼"
          maxLength={120}
          required
        />
        {fieldErrors.subject?.[0] ? (
          <small className="field-error">{fieldErrors.subject[0]}</small>
        ) : null}
      </label>

      <label className="field">
        <span>留言</span>
        <textarea
          rows={5}
          value={form.message}
          onChange={(event) => update("message", event.target.value)}
          placeholder="简单说说你的想法、背景和期待……"
          maxLength={3000}
          required
        />
        <small className="field-hint">
          {form.message.length} / 3000
          {fieldErrors.message?.[0] ? (
            <span className="field-error"> · {fieldErrors.message[0]}</span>
          ) : null}
        </small>
      </label>

      <div className="hp-field" aria-hidden="true">
        <label>
          Website
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(event) => update("website", event.target.value)}
          />
        </label>
      </div>

      {error ? (
        <p className="form-error" role="alert">
          <AlertCircle size={15} />
          {error}
        </p>
      ) : null}

      <div className="form-footer">
        <p>信息只会用于回复你，不会用于营销。</p>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={sending}
        >
          {sending ? <Spinner label="正在发送" /> : <Send size={16} />}
          {sending ? "发送中" : "发送留言"}
          {!sending ? <ArrowUpRight size={15} /> : null}
        </button>
      </div>
    </form>
  );
}
