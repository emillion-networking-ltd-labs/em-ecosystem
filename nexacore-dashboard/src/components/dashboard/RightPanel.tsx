"use client";

import { Bug, MessageSquare, ShoppingCart, Inbox } from "lucide-react";

/* ===== Static data ===== */

const notifications = [
  {
    icon: Bug,
    message: "You fixed a bug.",
    time: "Just now",
    color: "purple" as const,
  },
  {
    icon: MessageSquare,
    message: "New message received",
    time: "59 minutes ago",
    color: "blue" as const,
  },
  {
    icon: ShoppingCart,
    message: "New order placed",
    time: "12 hours ago",
    color: "purple" as const,
  },
  {
    icon: Inbox,
    message: "Server report generated",
    time: "Yesterday",
    color: "blue" as const,
  },
];

const activities = [
  { name: "Alice Chen", action: "updated profile", time: "2 min ago" },
  { name: "Bob Smith", action: "changed password", time: "15 min ago" },
  { name: "Carol Davis", action: "logged in", time: "1 hour ago" },
  { name: "Dan Wilson", action: "registered", time: "3 hours ago" },
  { name: "Eve Martinez", action: "updated role", time: "Yesterday" },
];

const contacts = [
  { name: "Natali Craig", initials: "NC" },
  { name: "Drew Cano", initials: "DC" },
  { name: "Orlando Diggs", initials: "OD" },
  { name: "Andi Lane", initials: "AL" },
  { name: "Kate Morrison", initials: "KM" },
  { name: "Koray Okumus", initials: "KO" },
];

export default function RightPanel() {
  return (
    <div className="space-y-6 p-4">
      {/* Notifications */}
      <section>
        <h3 className="px-2 py-1 text-body font-semibold text-content-primary">
          Notifications
        </h3>
        <div className="mt-2 space-y-1">
          {notifications.map((item, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl p-2">
              <div
                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg ${
                  item.color === "purple"
                    ? "bg-notification-purple"
                    : "bg-notification-blue"
                }`}
              >
                <item.icon size={16} className="text-content-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-body text-content-primary">
                  {item.message}
                </p>
                <p className="text-caption text-content-tertiary">
                  {item.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Activities */}
      <section>
        <h3 className="px-2 py-1 text-body font-semibold text-content-primary">
          Activities
        </h3>
        <div className="relative mt-2 space-y-1">
          {/* Timeline line */}
          <div className="absolute bottom-2 left-[19px] top-2 w-px border-l border-dashed border-border-default" />

          {activities.map((item, i) => (
            <div key={i} className="relative flex items-center gap-2 p-2">
              <div className="relative z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-surface-subtle">
                <span className="text-caption font-semibold text-content-primary">
                  {item.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-body text-content-primary">
                  <span className="font-normal">{item.name}</span>{" "}
                  <span className="text-content-tertiary">{item.action}</span>
                </p>
                <p className="text-caption text-content-tertiary">
                  {item.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contacts */}
      <section>
        <h3 className="px-2 py-1 text-body font-semibold text-content-primary">
          Contacts
        </h3>
        <div className="mt-2 space-y-1">
          {contacts.map((contact) => (
            <div
              key={contact.name}
              className="flex items-center gap-2 rounded-xl p-2"
            >
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-surface-subtle">
                <span className="text-caption font-semibold text-content-primary">
                  {contact.initials}
                </span>
              </div>
              <span className="truncate text-body text-content-primary">
                {contact.name}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
