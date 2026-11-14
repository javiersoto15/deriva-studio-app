"use client";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { getFirebaseAuth } from "../../../../src/auth/firebase";
import { SalonWorkspace } from "./SalonWorkspace";
export function SalonApp() {
  const [session, setSession] = useState<
    { uid: string; email: string } | null | undefined
  >(undefined);
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  useEffect(() => {
    try {
      return onAuthStateChanged(getFirebaseAuth(), (u) =>
        setSession(u ? { uid: u.uid, email: u.email ?? "" } : null),
      );
    } catch {
      setError("No pudimos iniciar la sesión de Salón.");
      setSession(null);
    }
  }, []);
  async function login(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      setPassword("");
    } catch {
      setError("No pudimos entrar. Revisa tu correo, contraseña y conexión.");
    } finally {
      setBusy(false);
    }
  }
  async function logout(forReauthentication = false) {
    if (blocked && !forReauthentication) return;
    try {
      await signOut(getFirebaseAuth());
    } catch {
      setError("No pudimos cerrar la sesión. Inténtalo de nuevo.");
    }
  }
  return (
    <div className="stock-shell salon-shell">
      <header className="salon-top" inert={blocked}>
        <Link href="/admin-console">Admin</Link>
        <nav aria-label="Inventario">
          <Link href="/stock-salon" aria-current="page">
            Stock Salón
          </Link>
        </nav>
        {session && (
          <button className="stock-text-button" onClick={() => void logout()}>
            Salir
          </button>
        )}
      </header>
      {session && error && (
        <p className="salon-alert" role="alert">
          {error}
        </p>
      )}
      {session === undefined ? (
        <main className="salon-signin" role="status">
          Abriendo sesión…
        </main>
      ) : session ? (
        <SalonWorkspace
          key={session.uid}
          accountId={session.uid}
          accountEmail={session.email}
          onBlockingChange={setBlocked}
          onReauthenticate={() => void logout(true)}
        />
      ) : (
        <main className="salon-signin">
          <p className="stock-mono">ADMIN · SALÓN</p>
          <h1>Stock Salón</h1>
          <p>Entra con tu cuenta autorizada para Salón.</p>
          <form onSubmit={login}>
            <label htmlFor="salon-email">Correo</label>
            <input
              id="salon-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label htmlFor="salon-password">Contraseña</label>
            <input
              id="salon-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p role="alert">{error}</p>}
            <button className="stock-button" disabled={busy}>
              {busy ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </main>
      )}
    </div>
  );
}
