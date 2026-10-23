"use client";

import { buildWhatsAppShareUrl, formatStockShare } from "../../../../src/stock/share";
import type { StockSnapshot } from "../../../../src/stock/types";
import { formatClock, formatHeaderDate } from "./format";

export type StockShareState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; snapshot: StockSnapshot; readAt: Date; depletedIds: ReadonlySet<string>; copied: boolean; copyError: string };

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button type="button" className="stock-icon-button" onClick={onClose} aria-label="Cerrar">
      <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    </button>
  );
}

function unknownSummary(count: number): string {
  return count === 1
    ? "1 artículo sin contar, no incluido."
    : `${new Intl.NumberFormat("es-CL").format(count)} artículos sin contar, no incluidos.`;
}

export function StockShare(props: {
  state: StockShareState;
  titleId: string;
  onClose: () => void;
  onRefresh: () => void;
  onCopy: (message: string) => void;
}) {
  const preview = props.state.status === "ready"
    ? formatStockShare(props.state.snapshot.items, props.state.readAt, props.state.depletedIds)
    : null;
  const shareMessage = preview?.message ?? "";
  const canShare = shareMessage.length > 0;

  return (
    <section className="stock-editor stock-share" aria-busy={props.state.status === "loading"}>
      <header className="stock-editor__head">
        <div>
          <p className="stock-editor__kind">Inventario</p>
          <h2 id={props.titleId} tabIndex={-1}>Compartir stock</h2>
          <p className="stock-editor__help">Revisa el mensaje. Luego elige el grupo en WhatsApp.</p>
        </div>
        <CloseButton onClose={props.onClose} />
      </header>

      {props.state.status === "loading" && (
        <p className="stock-share__state" role="status">Actualizando el inventario guardado…</p>
      )}

      {props.state.status === "error" && (
        <div className="stock-share__state stock-share__state--error" role="alert">
          <strong>No pudimos actualizar el inventario.</strong>
          <span>{props.state.message}</span>
        </div>
      )}

      {props.state.status === "ready" && preview && (
        <>
          <p className="stock-share__meta">
            Consultado el {formatHeaderDate(props.state.readAt)} a las {formatClock(props.state.readAt)}
          </p>

          {canShare ? (
            <pre className="stock-share__preview" role="region" aria-label="Vista previa del mensaje" tabIndex={0}>
              {preview.message}
            </pre>
          ) : (
            <div className="stock-share__empty" role="status">
              <strong>No hay artículos con stock ni recién agotados para compartir.</strong>
              <span>Cuenta al menos un artículo para preparar un mensaje.</span>
              {preview.uncountedCount > 0 && <span>{unknownSummary(preview.uncountedCount)}</span>}
            </div>
          )}

          {props.state.copyError && <p className="stock-share__copy-error" role="alert">{props.state.copyError}</p>}
          {props.state.copied && <p className="stock-share__copied" role="status">Mensaje copiado.</p>}
        </>
      )}

      <div className="stock-editor__actions stock-share__actions">
        {props.state.status === "loading" || props.state.status === "error" ? (
          <button
            type="button"
            className="stock-button stock-button--outline"
            onClick={props.state.status === "error" ? props.onRefresh : props.onClose}
            disabled={props.state.status === "loading"}
          >
            {props.state.status === "loading" ? "Actualizando…" : "Volver a intentar"}
          </button>
        ) : (
          <>
            {canShare ? (
              <a
                className="stock-button stock-share__whatsapp"
                href={buildWhatsAppShareUrl(shareMessage)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Compartir por WhatsApp
              </a>
            ) : (
              <button type="button" className="stock-button stock-share__whatsapp" disabled>
                Compartir por WhatsApp
              </button>
            )}
            <button
              type="button"
              className="stock-button stock-button--outline"
              onClick={() => props.onCopy(shareMessage)}
              disabled={!canShare}
            >
              Copiar mensaje
            </button>
          </>
        )}
      </div>
    </section>
  );
}
