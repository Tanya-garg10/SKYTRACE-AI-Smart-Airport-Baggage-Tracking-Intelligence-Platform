import { AnimatePresence, motion } from 'motion/react';
import { Bell, CheckCheck, X, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import type { ClientNotification } from '../types';

export function NotificationCenter({
  open,
  notifications,
  onClose,
  onMarkRead,
  onMarkAllRead,
  onSelectBagId,
}: {
  open: boolean;
  notifications: ClientNotification[];
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onSelectBagId?: (bagId: string) => void;
}) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex justify-end bg-[#101B2D]/75 backdrop-blur-sm"
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md h-full bg-[#101B2D] text-[#F3F5F7] border-l border-[#A8B6C7]/15 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#A8B6C7]/15">
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-[#54D6E8]" />
                <h3 className="text-sm font-semibold">
                  Operational Feed ({unreadCount} unread)
                </h3>
              </div>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={onMarkAllRead}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#54D6E8] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-[#A8B6C7] hover:text-[#F3F5F7] hover:bg-[#203650] cursor-pointer"
                  aria-label="Close notifications"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#A8B6C7]/10">
              {notifications.length === 0 ? (
                <div className="p-10 text-center text-xs text-[#A8B6C7]">
                  No operational alerts recorded yet. Live scan events appear here automatically.
                </div>
              ) : (
                notifications.map((item) => {
                  const Icon =
                    item.severity === 'alert' || item.severity === 'warning'
                      ? AlertTriangle
                      : item.severity === 'success'
                      ? CheckCircle2
                      : Info;
                  const iconColor =
                    item.severity === 'alert'
                      ? 'text-[#E87583]'
                      : item.severity === 'warning'
                      ? 'text-[#F0B85B]'
                      : item.severity === 'success'
                      ? 'text-[#52C7A5]'
                      : 'text-[#54D6E8]';

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (!item.read) onMarkRead(item.id);
                        if (item.bagId && onSelectBagId) {
                          onSelectBagId(item.bagId);
                          onClose();
                        }
                      }}
                      className={`p-4 transition-colors cursor-pointer ${
                        item.read
                          ? 'bg-transparent hover:bg-[#203650]/40'
                          : 'bg-[#203650]/65 hover:bg-[#203650]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${iconColor}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-[#F3F5F7] truncate">
                              {item.title}
                            </p>
                            {!item.read && (
                              <span className="text-[11px] font-mono text-[#54D6E8] shrink-0">
                                Unread
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-[#A8B6C7] leading-relaxed">
                            {item.message}
                          </p>
                          <div className="mt-1.5 flex items-center gap-2 text-[11px] font-mono tabular-nums text-[#A8B6C7]">
                            <span>
                              {new Date(item.createdAt).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {item.bagId && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-[#54D6E8]">{item.bagId}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
