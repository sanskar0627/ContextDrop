import type { Bookmark } from "@/lib/types";

interface ConversationReaderProps {
  bookmark: Bookmark;
}

export function ConversationReader({ bookmark }: ConversationReaderProps) {
  return (
    <article className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4">
      <h2 className="text-xl font-semibold">{bookmark.title}</h2>
      <div className="mt-4 grid gap-3">
        {bookmark.messages.map((message, index) => (
          <section
            key={`${bookmark.id}-${index}`}
            className={`rounded-xl border p-3 text-sm whitespace-pre-wrap ${
              message.role === "user" ? "bg-teal-50 border-teal-100" : "bg-orange-50 border-orange-100"
            }`}
          >
            <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">{message.role}</p>
            {message.content}
          </section>
        ))}
      </div>
    </article>
  );
}
