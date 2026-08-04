"use client";

import { useState, type FormEvent } from "react";
import { LoaderCircle, Mail, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function AuthForm() {
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [value, setValue] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  function switchMethod(nextMethod: "email" | "phone") {
    setMethod(nextMethod);
    setPhoneCodeSent(false);
    setOtp("");
    setStatus("idle");
    setMessage("");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");

    try {
      const supabase = createClient();
      const emailRedirectTo = `${window.location.origin}/auth/callback`;
      const result =
        method === "email"
          ? await supabase.auth.signInWithOtp({
              email: value,
              options: { emailRedirectTo },
            })
          : await supabase.auth.signInWithOtp({ phone: value });
      if (result.error) throw result.error;

      setStatus("sent");
      if (method === "phone") {
        setPhoneCodeSent(true);
        setMessage("Мы отправили код для входа в SMS.");
      } else {
        setMessage("Мы отправили ссылку для входа на вашу почту.");
      }
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Не удалось отправить код. Попробуйте позднее.",
      );
    }
  }

  async function verifyPhoneCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        phone: value,
        token: otp,
        type: "sms",
      });
      if (error) throw error;
      window.location.assign("/onboarding");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Не удалось подтвердить код.",
      );
    }
  }

  return (
    <div className="mt-7">
      <div className="grid grid-cols-2 rounded-xl bg-[#f8eef0] p-1">
        <button
          className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition ${method === "email" ? "bg-white text-[#bd3e66] shadow-sm" : "text-[#806970]"}`}
          onClick={() => switchMethod("email")}
          type="button"
        >
          <Mail className="size-4" /> Почта
        </button>
        <button
          className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition ${method === "phone" ? "bg-white text-[#bd3e66] shadow-sm" : "text-[#806970]"}`}
          onClick={() => switchMethod("phone")}
          type="button"
        >
          <Smartphone className="size-4" /> Телефон
        </button>
      </div>

      {!phoneCodeSent ? (
        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-[#5c464d]">
              {method === "email" ? "Электронная почта" : "Номер телефона"}
            </span>
            <input
              autoComplete={method === "email" ? "email" : "tel"}
              className="h-11 w-full rounded-xl border border-[#e7d8dc] bg-white px-3.5 text-sm outline-none transition placeholder:text-[#b3a0a6] focus:border-[#df4f7d] focus:ring-4 focus:ring-[#df4f7d]/10"
              inputMode={method === "email" ? "email" : "tel"}
              onChange={(event) => setValue(event.target.value)}
              placeholder={method === "email" ? "you@example.com" : "+7 999 000-00-00"}
              required
              type={method === "email" ? "email" : "tel"}
              value={value}
            />
            {method === "phone" && (
              <span className="mt-1.5 block text-xs text-[#9b858c]">
                Укажите номер в международном формате.
              </span>
            )}
          </label>
          <Button className="w-full" disabled={status === "sending"} type="submit">
            {status === "sending" && (
              <LoaderCircle className="mr-2 size-4 animate-spin" />
            )}
            {method === "email" ? "Получить ссылку" : "Получить код"}
          </Button>
        </form>
      ) : (
        <form className="mt-5 space-y-4" onSubmit={verifyPhoneCode}>
          <p className="text-sm leading-6 text-[#826c73]">
            Введите код из SMS, отправленный на <b>{value}</b>.
          </p>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-[#5c464d]">
              Код подтверждения
            </span>
            <input
              autoComplete="one-time-code"
              className="h-11 w-full rounded-xl border border-[#e7d8dc] bg-white px-3.5 text-center text-lg tracking-[0.4em] outline-none transition placeholder:text-[#b3a0a6] focus:border-[#df4f7d] focus:ring-4 focus:ring-[#df4f7d]/10"
              inputMode="numeric"
              maxLength={6}
              onChange={(event) => setOtp(event.target.value)}
              placeholder="000000"
              required
              value={otp}
            />
          </label>
          <Button className="w-full" disabled={status === "sending"} type="submit">
            {status === "sending" && (
              <LoaderCircle className="mr-2 size-4 animate-spin" />
            )}
            Подтвердить код
          </Button>
          <button
            className="w-full text-sm font-semibold text-[#a13d5e]"
            onClick={() => setPhoneCodeSent(false)}
            type="button"
          >
            Изменить номер
          </button>
        </form>
      )}
      {message && (
        <p
          className={`mt-4 rounded-xl px-3.5 py-3 text-sm leading-5 ${status === "sent" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}
          role="status"
        >
          {message}
        </p>
      )}
    </div>
  );
}
