import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCheck,
  Inbox,
  Mail,
  MailOpen,
  Reply,
  Search,
  Trash2,
} from "lucide-react";
import type { Message } from "../../../shared/types";
import { api } from "../../lib/api";
import { formatDateTime, relativeTime } from "../../lib/format";
import { useToast } from "../../components/Toast";
import { useAdmin } from "../context";
import {
  AdminError,
  AdminLoading,
  AdminPageHeader,
  ConfirmDialog,
  EmptyState,
  Modal,
  formatApiError,
} from "../ui";

type Filter = "all" | "unread" | "read";

export function MessagesAdminPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Message | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [updatingRead, setUpdatingRead] = useState(false);
  const { showToast } = useToast();
  const { setUnreadCount } = useAdmin();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    api.admin
      .getMessages()
      .then((items) => {
        if (!cancelled) setMessages(items);
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(formatApiError(caught));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const unread = messages.filter((message) => !message.isRead).length;

  useEffect(() => {
    if (!loading) setUnreadCount(unread);
  }, [unread, loading, setUnreadCount]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return messages.filter((message) => {
      if (filter === "unread" && message.isRead) return false;
      if (filter === "read" && !message.isRead) return false;
      if (!normalized) return true;
      return [message.name, message.email, message.subject, message.body]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [messages, filter, query]);

  const openMessage = async (message: Message) => {
    setSelected(message);
    if (message.isRead) return;
    setUpdatingRead(true);
    try {
      const updated = await api.admin.updateMessage(message.id, true);
      setMessages((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setSelected(updated);
    } catch {
      showToast("标记已读失败，但留言内容仍可查看", "error");
    } finally {
      setUpdatingRead(false);
    }
  };

  const toggleRead = async (message: Message) => {
    setUpdatingRead(true);
    try {
      const updated = await api.admin.updateMessage(
        message.id,
        !message.isRead,
      );
      setMessages((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setSelected(updated);
      showToast(updated.isRead ? "已标记为已读" : "已标记为未读");
    } catch (caught) {
      showToast(formatApiError(caught), "error");
    } finally {
      setUpdatingRead(false);
    }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      const result = await api.admin.markAllMessagesRead();
      setMessages((current) =>
        current.map((message) => ({ ...message, isRead: true })),
      );
      if (selected) setSelected({ ...selected, isRead: true });
      showToast(
        result.updated > 0
          ? `已将 ${result.updated} 条留言标记为已读`
          : "没有未读留言",
      );
    } catch (caught) {
      showToast(formatApiError(caught), "error");
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      await api.admin.deleteMessage(selected.id);
      setMessages((current) =>
        current.filter((message) => message.id !== selected.id),
      );
      setSelected(null);
      setDeleteOpen(false);
      showToast("留言已删除");
    } catch (caught) {
      showToast(formatApiError(caught), "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="admin-page messages-admin-page">
      <AdminPageHeader
        eyebrow="INBOX / SIGNALS"
        title="留言收件箱"
        description="来自网站的每一条信号。及时回复，让对话继续。"
        actions={
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={markAllRead}
            disabled={markingAll || unread === 0}
          >
            <CheckCheck size={15} />
            {markingAll ? "处理中" : "全部标为已读"}
          </button>
        }
      />

      <div className="admin-list-toolbar">
        <div className="admin-tabs" role="tablist" aria-label="筛选留言">
          <button
            type="button"
            className={filter === "all" ? "is-active" : ""}
            onClick={() => setFilter("all")}
            role="tab"
            aria-selected={filter === "all"}
          >
            全部 <span>{messages.length}</span>
          </button>
          <button
            type="button"
            className={filter === "unread" ? "is-active" : ""}
            onClick={() => setFilter("unread")}
            role="tab"
            aria-selected={filter === "unread"}
          >
            未读 <span>{unread}</span>
          </button>
          <button
            type="button"
            className={filter === "read" ? "is-active" : ""}
            onClick={() => setFilter("read")}
            role="tab"
            aria-selected={filter === "read"}
          >
            已读 <span>{messages.length - unread}</span>
          </button>
        </div>
        <label className="admin-search">
          <Search size={15} />
          <span className="sr-only">搜索留言</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索姓名、邮箱或内容"
          />
        </label>
      </div>

      {loading ? (
        <AdminLoading label="正在收取信号" />
      ) : error ? (
        <AdminError
          message={error}
          onRetry={() => setReloadKey((value) => value + 1)}
        />
      ) : filtered.length > 0 ? (
        <div className="admin-message-list">
          {filtered.map((message) => (
            <button
              type="button"
              key={message.id}
              className={`admin-message-row ${message.isRead ? "" : "is-unread"}`.trim()}
              onClick={() => openMessage(message)}
            >
              <span className="admin-message-avatar">
                {message.name.slice(0, 1).toUpperCase()}
              </span>
              <div className="admin-message-main">
                <div className="admin-message-top">
                  <strong>{message.name}</strong>
                  <span className="admin-message-email">{message.email}</span>
                  <time>{relativeTime(message.createdAt)}</time>
                </div>
                <h2>{message.subject}</h2>
                <p>{message.body}</p>
              </div>
              <span className="admin-message-status">
                {message.isRead ? (
                  <MailOpen size={15} aria-label="已读" />
                ) : (
                  <span className="unread-dot" aria-label="未读" />
                )}
              </span>
            </button>
          ))}
        </div>
      ) : messages.length === 0 ? (
        <EmptyState
          title="收件箱很安静"
          description="当有人通过联系表单给你留言时，它们会出现在这里。"
          icon={<Inbox size={20} />}
        />
      ) : (
        <EmptyState
          title="没有匹配的留言"
          description="换一个关键词，或切换筛选条件试试。"
          action={
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setFilter("all");
                setQuery("");
              }}
            >
              清除筛选
            </button>
          }
        />
      )}

      <div className="admin-list-foot">
        <span>
          共 {messages.length} 条留言 · {unread} 条未读
        </span>
        <span>仅保留最近 200 条</span>
      </div>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.subject ?? "留言详情"}
        description={
          selected
            ? `${selected.name} · ${formatDateTime(selected.createdAt)}`
            : undefined
        }
        size="lg"
        footer={
          selected ? (
            <>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 size={14} />
                删除留言
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => toggleRead(selected)}
                disabled={updatingRead}
              >
                {selected.isRead ? <Mail size={14} /> : <Check size={14} />}
                {selected.isRead ? "标为未读" : "标为已读"}
              </button>
              <a
                href={`mailto:${selected.email}?subject=${encodeURIComponent(
                  `Re: ${selected.subject}`,
                )}`}
                className="btn btn-primary btn-sm"
              >
                <Reply size={14} />
                邮件回复
              </a>
            </>
          ) : null
        }
      >
        {selected ? (
          <div className="message-detail">
            <div className="message-detail-meta">
              <div>
                <span>发件人</span>
                <strong>{selected.name}</strong>
              </div>
              <div>
                <span>邮箱</span>
                <a href={`mailto:${selected.email}`}>{selected.email}</a>
              </div>
              <div>
                <span>状态</span>
                <strong>{selected.isRead ? "已读" : "未读"}</strong>
              </div>
            </div>
            <div className="message-detail-body">{selected.body}</div>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        title="删除这条留言？"
        description="删除后无法恢复。如果已经通过邮件回复，建议先保留备份。"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => {
          if (!deleting) setDeleteOpen(false);
        }}
      />
    </div>
  );
}
