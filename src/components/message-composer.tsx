"use client";

import { useActionState, useRef, useState } from "react";
import { AlertCircle, Send } from "lucide-react";

import { sendDirectMessage, type MessageActionState } from "@/app/messages/actions";

/**
 * MVP composer for the personal chat: a growing textarea, Enter to send
 * (Shift+Enter for a new line), inline send errors, pending state.
 * No voice/video/stickers — the chat stays a minimal, honest MVP.
 */
export function MessageComposer({ conversationId }: { conversationId: string }) {
  const [state, formAction] = useActionState<MessageActionState, FormData>(
    sendDirectMessage,
    null,
  );
  const [value, setValue] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  function submit() {
    if (!value.trim()) return;
    formRef.current?.requestSubmit();
  }

  return (
    <div className="mt-4 border-t border-[#2c2036]/10 pt-4">
      {state?.error && (
        <div
          className="mb-3 flex items-start gap-2 rounded-2xl border border-[#f0c8c8] bg-[#fff5f5] p-3 text-[#c0392b]"
          role="alert"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p className="text-[11px] font-bold leading-4">{state.error}</p>
        </div>
      )}
      <form action={formAction} className="flex gap-2" ref={formRef}>
        <input name="conversation_id" type="hidden" value={conversationId} />
        <textarea
          className="max-h-36 min-h-11 grow resize-none rounded-xl border border-[#2c2036]/10 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-[#a69bab] focus:border-[#9a62eb] focus:ring-4 focus:ring-[#9a62eb]/10"
          maxLength={2000}
          name="body"
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          placeholder="Напишите сообщение"
          rows={1}
          value={value}
        />
        <button
          aria-label="Отправить"
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-r from-[#ff5d9a] to-[#8254ed] text-white shadow-[0_6px_14px_rgba(160,75,213,.2)] transition disabled:pointer-events-none disabled:opacity-50"
          disabled={!value.trim()}
          onClick={submit}
          type="button"
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}
