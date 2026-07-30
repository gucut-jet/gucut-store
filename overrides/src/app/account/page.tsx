"use client";

import { useEffect, useRef, useState } from "react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type ConfirmationResult,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "../../lib/firebase";

// ---- helpers -------------------------------------------------

/** Convert a Thai local mobile number (08x-xxx-xxxx) to E.164 (+668xxxxxxxx). */
function toE164Thai(raw: string): string | null {
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.length === 10 && digits.startsWith("0")) {
    return "+66" + digits.slice(1);
  }
  if (digits.length === 9) {
    return "+66" + digits;
  }
  if (raw.trim().startsWith("+66") && digits.length >= 11) {
    return "+" + digits.replace(/^0+/, "");
  }
  return null;
}

function maskPhone(e164: string): string {
  // +66812345678 -> 081-234-5678
  const digits = e164.replace("+66", "0");
  if (digits.length !== 10) return e164;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function firebaseErrorToThai(code: string): string {
  switch (code) {
    case "auth/invalid-phone-number":
      return "เบอร์โทรศัพท์ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง";
    case "auth/missing-phone-number":
      return "กรุณากรอกเบอร์โทรศัพท์";
    case "auth/quota-exceeded":
    case "auth/too-many-requests":
      return "มีการขอรหัสมากเกินไป กรุณาลองใหม่ภายหลัง";
    case "auth/invalid-verification-code":
      return "รหัส OTP ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง";
    case "auth/code-expired":
      return "รหัส OTP หมดอายุ กรุณาขอรหัสใหม่";
    case "auth/user-disabled":
      return "บัญชีนี้ถูกระงับการใช้งาน";
    case "auth/network-request-failed":
      return "การเชื่อมต่อขัดข้อง กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่";
    case "auth/captcha-check-failed":
      return "ตรวจสอบยืนยันตัวตนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
    case "auth/account-exists-with-different-credential":
      return "อีเมลนี้ถูกใช้เข้าสู่ระบบด้วยวิธีอื่นแล้ว";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "";
    case "auth/invalid-email":
      return "รูปแบบอีเมลไม่ถูกต้อง";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
    case "auth/weak-password":
      return "รหัสผ่านสั้นเกินไป กรุณาใช้อย่างน้อย 6 ตัวอักษร";
    case "auth/email-already-in-use":
      return "อีเมลนี้ถูกใช้งานแล้ว กรุณาตรวจสอบรหัสผ่านอีกครั้ง";
    default:
      return "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
  }
}

const RESEND_SECONDS = 60;

type Step = "phone" | "otp" | "email";

export default function AccountPage() {
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [lineLoading, setLineLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const e164Ref = useRef<string>("");

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });

    // Pick up the result of a Google/Facebook sign-in redirect, if we just
    // came back from one. Any error here is surfaced the same way as a
    // phone-auth error.
    getRedirectResult(auth).catch((err: any) => {
      // eslint-disable-next-line no-console
      console.error("[GUCUT auth] redirect login failed:", err?.code, err?.message, err);
      const msg = firebaseErrorToThai(err?.code ?? "");
      if (msg) setError(msg);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  function ensureRecaptcha(): RecaptchaVerifier {
    const auth = getFirebaseAuth();
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });
    }
    return recaptchaRef.current;
  }

  async function handleSendOtp(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    const e164 = toE164Thai(phone);
    if (!e164) {
      setError("กรุณากรอกเบอร์โทรศัพท์มือถือให้ถูกต้อง (10 หลัก)");
      return;
    }
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      const verifier = ensureRecaptcha();
      const result = await signInWithPhoneNumber(auth, e164, verifier);
      confirmationRef.current = result;
      e164Ref.current = e164;
      setStep("otp");
      setResendIn(RESEND_SECONDS);
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error("[GUCUT auth] sendOtp failed:", err?.code, err?.message, err);
      setError(firebaseErrorToThai(err?.code ?? ""));
      // reset recaptcha widget so the user can retry
      try {
        recaptchaRef.current?.clear();
      } catch {}
      recaptchaRef.current = null;
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    if (otp.trim().length < 6) {
      setError("กรุณากรอกรหัส OTP ให้ครบ 6 หลัก");
      return;
    }
    if (!confirmationRef.current) {
      setError("เซสชันหมดอายุ กรุณาขอรหัส OTP ใหม่");
      setStep("phone");
      return;
    }
    setLoading(true);
    try {
      await confirmationRef.current.confirm(otp.trim());
      setToast("เข้าสู่ระบบสำเร็จ");
      setStep("phone");
      setPhone("");
      setOtp("");
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error("[GUCUT auth] verifyOtp failed:", err?.code, err?.message, err);
      setError(firebaseErrorToThai(err?.code ?? ""));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError(null);
    setGoogleLoading(true);
    try {
      // Popup (not redirect) avoids the same Safari/iOS ITP issue as the
      // Facebook login below: the full-page round trip through
      // firebaseapp.com doesn't reliably survive Safari's tracking
      // prevention, which silently bounced the user back unauthenticated.
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setToast("เข้าสู่ระบบสำเร็จ");
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error("[GUCUT auth] googleLogin failed:", err?.code, err?.message, err);
      if (
        err?.code === "auth/popup-blocked" ||
        err?.code === "auth/operation-not-supported-in-this-environment"
      ) {
        try {
          const auth = getFirebaseAuth();
          const provider = new GoogleAuthProvider();
          await signInWithRedirect(auth, provider);
          return;
        } catch (err2: any) {
          // eslint-disable-next-line no-console
          console.error(
            "[GUCUT auth] googleLogin redirect fallback failed:",
            err2?.code,
            err2?.message,
            err2
          );
        }
      }
      const msg = firebaseErrorToThai(err?.code ?? "");
      if (msg) setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleFacebookLogin() {
    setError(null);
    setFacebookLoading(true);
    try {
      // Popup (not redirect) avoids a known Safari/iOS issue where the
      // pending-auth state doesn't survive the full-page round trip through
      // firebaseapp.com (Intelligent Tracking Prevention wipes the session
      // storage Firebase needs), which made the login silently bounce back
      // to this page without ever signing the user in.
      const auth = getFirebaseAuth();
      const provider = new FacebookAuthProvider();
      await signInWithPopup(auth, provider);
      setToast("เข้าสู่ระบบสำเร็จ");
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error("[GUCUT auth] facebookLogin failed:", err?.code, err?.message, err);
      // Some in-app/older browsers block popups outright — fall back to a
      // full-page redirect rather than leaving the user stuck.
      if (
        err?.code === "auth/popup-blocked" ||
        err?.code === "auth/operation-not-supported-in-this-environment"
      ) {
        try {
          const auth = getFirebaseAuth();
          const provider = new FacebookAuthProvider();
          await signInWithRedirect(auth, provider);
          return;
        } catch (err2: any) {
          // eslint-disable-next-line no-console
          console.error(
            "[GUCUT auth] facebookLogin redirect fallback failed:",
            err2?.code,
            err2?.message,
            err2
          );
        }
      }
      const msg = firebaseErrorToThai(err?.code ?? "");
      if (msg) setError(msg);
    } finally {
      setFacebookLoading(false);
    }
  }

  async function handleLineLogin() {
    setError(null);
    setLineLoading(true);
    try {
      // Same Safari/iOS ITP issue as Google/Facebook above — use a popup
      // first, falling back to a full-page redirect only if the popup is
      // blocked.
      const auth = getFirebaseAuth();
      const provider = new OAuthProvider("oidc.line");
      await signInWithPopup(auth, provider);
      setToast("เข้าสู่ระบบสำเร็จ");
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error("[GUCUT auth] lineLogin failed:", err?.code, err?.message, err);
      if (
        err?.code === "auth/popup-blocked" ||
        err?.code === "auth/operation-not-supported-in-this-environment"
      ) {
        try {
          const auth = getFirebaseAuth();
          const provider = new OAuthProvider("oidc.line");
          await signInWithRedirect(auth, provider);
          return;
        } catch (err2: any) {
          // eslint-disable-next-line no-console
          console.error(
            "[GUCUT auth] lineLogin redirect fallback failed:",
            err2?.code,
            err2?.message,
            err2
          );
        }
      }
      const msg = firebaseErrorToThai(err?.code ?? "");
      if (msg) setError(msg);
    } finally {
      setLineLoading(false);
    }
  }

  async function handleEmailSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    if (!email.trim() || !email.includes("@")) {
      setError("กรุณากรอกอีเมลให้ถูกต้อง");
      return;
    }
    if (password.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      try {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } catch (signInErr: any) {
        // Account doesn't exist yet — treat this as a combined sign-in/sign-up
        // flow, same as the phone+OTP path above.
        if (
          signInErr?.code === "auth/user-not-found" ||
          signInErr?.code === "auth/invalid-credential"
        ) {
          await createUserWithEmailAndPassword(auth, email.trim(), password);
        } else {
          throw signInErr;
        }
      }
      setToast("เข้าสู่ระบบสำเร็จ");
      setStep("phone");
      setEmail("");
      setPassword("");
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error("[GUCUT auth] emailLogin failed:", err?.code, err?.message, err);
      setError(firebaseErrorToThai(err?.code ?? ""));
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    const auth = getFirebaseAuth();
    await signOut(auth);
    setToast("ออกจากระบบแล้ว");
  }

  function handleChangeNumber() {
    setStep("phone");
    setOtp("");
    setError(null);
    confirmationRef.current = null;
  }

  function comingSoon() {
    setToast("ฟีเจอร์นี้จะเปิดให้ใช้งานเร็วๆ นี้");
  }

  // ---- render -------------------------------------------------

  if (!authReady) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-700 border-t-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] px-4 pb-24 pt-8">
      {toast && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full bg-neutral-800 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      {user ? (
        <LoggedInView
          phoneDisplay={
            user.phoneNumber
              ? maskPhone(user.phoneNumber)
              : user.email || user.displayName || "-"
          }
          onLogout={handleLogout}
          onComingSoon={comingSoon}
        />
      ) : (
        <div className="mx-auto max-w-sm">
          {/* big brand mark, Shopee/TikTok style */}
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-500 text-3xl font-extrabold text-white shadow-lg shadow-orange-500/20">
              G
            </div>
            <h1 className="text-xl font-bold text-white">GUCUT</h1>
            <p className="mt-1 text-sm text-neutral-400">
              เข้าสู่ระบบ / สมัครสมาชิก
            </p>
          </div>

          {step === "phone" ? (
            <form onSubmit={handleSendOtp} className="space-y-3">
              <div className="flex overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900 focus-within:border-orange-500">
                <span className="flex items-center gap-1 border-r border-neutral-700 px-3 text-sm text-neutral-400">
                  🇹🇭 +66
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="หมายเลขโทรศัพท์"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={10}
                  className="w-full bg-transparent px-3 py-3.5 text-white placeholder-neutral-500 outline-none"
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-orange-500 py-3.5 font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? "กำลังส่งรหัส..." : "ดำเนินการต่อ"}
              </button>

              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-neutral-800" />
                <span className="text-xs text-neutral-500">หรือ</span>
                <div className="h-px flex-1 bg-neutral-800" />
              </div>

              <div className="overflow-hidden rounded-xl bg-neutral-900">
                <SocialRow
                  icon={<span className="text-lg">✉️</span>}
                  label="ดำเนินการต่อด้วยอีเมล"
                  onClick={() => {
                    setError(null);
                    setStep("email");
                  }}
                />
                <SocialRow
                  icon={<span className="text-lg">📘</span>}
                  label="ดำเนินการต่อด้วย Facebook"
                  onClick={handleFacebookLogin}
                  loading={facebookLoading}
                  bordered
                />
                <SocialRow
                  icon={<span className="text-lg"></span>}
                  label="ดำเนินการต่อด้วย Apple"
                  onClick={comingSoon}
                  bordered
                />
                <SocialRow
                  icon={<GoogleIcon />}
                  label="ดำเนินการต่อด้วย Google"
                  onClick={handleGoogleLogin}
                  loading={googleLoading}
                  bordered
                />
                <SocialRow
                  icon={<span className="text-lg">💬</span>}
                  label="ดำเนินการต่อด้วย LINE"
                  onClick={handleLineLogin}
                  loading={lineLoading}
                  bordered
                />
              </div>

              <p className="text-center text-xs text-neutral-500">
                การเข้าสู่ระบบถือว่ายอมรับข้อตกลงการใช้งานของ GUCUT
              </p>
            </form>
          ) : step === "email" ? (
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="อีเมล"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-3.5 text-white placeholder-neutral-500 outline-none focus:border-orange-500"
              />
              <input
                type="password"
                autoComplete="current-password"
                placeholder="รหัสผ่าน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-3.5 text-white placeholder-neutral-500 outline-none focus:border-orange-500"
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-orange-500 py-3.5 font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? "กำลังดำเนินการ..." : "ดำเนินการต่อ"}
              </button>
              <p className="text-center text-xs text-neutral-500">
                หากยังไม่มีบัญชี ระบบจะสมัครสมาชิกให้อัตโนมัติ
              </p>
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setError(null);
                }}
                className="w-full text-center text-sm text-neutral-400 hover:underline"
              >
                ← กลับ
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-3">
              <p className="text-sm text-neutral-300">
                กรอกรหัส OTP ที่ส่งไปที่{" "}
                <span className="font-medium text-white">
                  {maskPhone(e164Ref.current)}
                </span>
              </p>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="- - - - - -"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                maxLength={6}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-3 text-center text-2xl tracking-[0.5em] text-white placeholder-neutral-600 outline-none focus:border-orange-500"
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-orange-500 py-3 font-medium text-white transition active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? "กำลังตรวจสอบ..." : "ยืนยันรหัส OTP"}
              </button>
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={handleChangeNumber}
                  className="text-neutral-400 underline-offset-2 hover:underline"
                >
                  เปลี่ยนเบอร์โทรศัพท์
                </button>
                {resendIn > 0 ? (
                  <span className="text-neutral-500">ส่งรหัสใหม่ได้ใน {resendIn}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    disabled={loading}
                    className="text-orange-400 hover:underline"
                  >
                    ส่งรหัสอีกครั้ง
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      )}

      {/* invisible reCAPTCHA anchor required by Firebase phone auth.
          Google's badge is fixed bottom-right by default, which collides
          with our fixed bottom nav bar — push it up above the nav. */}
      <style>{`.grecaptcha-badge { bottom: 84px !important; z-index: 40; }`}</style>
      <div id="recaptcha-container" />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-[18px] w-[18px]">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20.4H24v7.2h11.3c-1.6 4.6-6 7.9-11.3 7.9-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.1-5.1C33.6 6.1 29 4.4 24 4.4 13.2 4.4 4.4 13.2 4.4 24S13.2 43.6 24 43.6 43.6 34.8 43.6 24c0-1.2-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6 4.4C13.9 15.6 18.6 12.4 24 12.4c3.1 0 5.9 1.2 8 3.1l5.1-5.1C33.6 6.1 29 4.4 24 4.4c-7.7 0-14.3 4.4-17.7 10.3z"
      />
      <path
        fill="#4CAF50"
        d="M24 43.6c4.9 0 9.4-1.9 12.7-4.9l-5.9-5c-1.9 1.4-4.4 2.3-6.8 2.3-5.3 0-9.7-3.3-11.3-7.9l-6 4.6C10 39 16.4 43.6 24 43.6z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20.4H24v7.2h11.3c-.8 2.2-2.2 4.1-4 5.5l5.9 5c-.4.4 6.4-4.7 6.4-14.1 0-1.2-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

function SocialRow({
  icon,
  label,
  onClick,
  bordered,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  bordered?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm text-white transition hover:bg-neutral-800 disabled:opacity-60 ${
        bordered ? "border-t border-neutral-800" : ""
      }`}
    >
      <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
      <span>{loading ? "กำลังเชื่อมต่อ..." : label}</span>
    </button>
  );
}

function LoggedInView({
  phoneDisplay,
  onLogout,
  onComingSoon,
}: {
  phoneDisplay: string;
  onLogout: () => void;
  onComingSoon: () => void;
}) {
  const menuItems: Array<{ icon: string; label: string }> = [
    { icon: "📦", label: "รายการสั่งซื้อของฉัน" },
    { icon: "📍", label: "ที่อยู่จัดส่ง" },
    { icon: "🎟️", label: "คูปองส่วนลด" },
    { icon: "❤️", label: "สินค้าที่ถูกใจ" },
  ];

  return (
    <div className="mx-auto max-w-sm">
      <div className="mb-4 flex items-center gap-4 rounded-2xl bg-neutral-900 p-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/20 text-2xl">
          👤
        </div>
        <div>
          <p className="text-base font-semibold text-white">{phoneDisplay}</p>
          <p className="text-sm text-neutral-400">สมาชิก GUCUT</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-neutral-900">
        {menuItems.map((item, i) => (
          <button
            key={item.label}
            onClick={onComingSoon}
            className={`flex w-full items-center justify-between px-4 py-3.5 text-left text-white transition hover:bg-neutral-800 ${
              i !== menuItems.length - 1 ? "border-b border-neutral-800" : ""
            }`}
          >
            <span className="flex items-center gap-3">
              <span>{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </span>
            <span className="text-neutral-600">›</span>
          </button>
        ))}
      </div>

      <button
        onClick={onLogout}
        className="mt-4 w-full rounded-xl border border-neutral-700 py-3 text-sm font-medium text-red-400 transition hover:bg-neutral-900"
      >
        ออกจากระบบ
      </button>
    </div>
  );
}
