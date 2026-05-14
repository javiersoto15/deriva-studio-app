import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad — Deriva Coffee Studio",
  description:
    "Cómo Deriva Coffee Studio recopila, usa y protege los datos personales de quienes se suscriben a la lista de apertura.",
};

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <article className="legal-shell">
        <header>
          <p className="legal-eyebrow">Deriva Coffee Studio · Providencia, Santiago</p>
          <h1 className="legal-title">Política de Privacidad</h1>
          <p className="legal-meta">Última actualización: mayo 2026</p>
        </header>

        <section>
          <h2>Responsable de los datos</h2>
          <p>
            Deriva Coffee Studio, con domicilio en Magnere 1570 Local 105, Providencia, Santiago, Chile, es
            responsable del tratamiento de los datos personales recopilados a través de este sitio.
          </p>
        </section>

        <section>
          <h2>Datos que recopilamos</h2>
          <p>
            Recopilamos únicamente los datos que entregas voluntariamente al suscribirte a nuestra lista de
            apertura: tu correo electrónico y, opcionalmente, tu nombre.
          </p>
        </section>

        <section>
          <h2>Finalidad del tratamiento</h2>
          <p>
            Usamos esta información solo para avisarte cuando abramos, enviarte la invitación a la apertura, y
            confirmarte el canje de la primera taza por nuestra cuenta. No usamos tus datos para perfilamiento,
            publicidad de terceros, ni decisiones automatizadas.
          </p>
        </section>

        <section>
          <h2>Encargado de procesamiento</h2>
          <p>
            Para gestionar el envío de correos utilizamos a Resend (resend.com), que actúa como encargado de
            tratamiento bajo nuestras instrucciones. Los datos pueden ser almacenados fuera de Chile en
            infraestructura propia del proveedor.
          </p>
        </section>

        <section>
          <h2>Retención</h2>
          <p>
            Conservamos tu correo mientras seas parte de la lista. Si te das de baja, eliminamos tu información
            de nuestros sistemas activos.
          </p>
        </section>

        <section>
          <h2>Tus derechos</h2>
          <p>
            Conforme a la Ley 19.628 sobre Protección de la Vida Privada, puedes solicitar el acceso,
            rectificación, cancelación u oposición al tratamiento de tus datos en cualquier momento. Para
            ejercer estos derechos, escríbenos a <a href="mailto:hola@derivastudio.cl">hola@derivastudio.cl</a>.
          </p>
          <p>
            También puedes darte de baja de nuestros correos en cualquier momento usando el enlace incluido al
            pie de cada mensaje.
          </p>
        </section>

        <section>
          <h2>Cambios en esta política</h2>
          <p>
            Si actualizamos esta política, publicaremos la nueva versión en esta misma página y, cuando
            corresponda, te avisaremos por correo.
          </p>
        </section>

        <footer className="legal-footer">
          <a href="/">← Volver al inicio</a>
        </footer>
      </article>
    </main>
  );
}
