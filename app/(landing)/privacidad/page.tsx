import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Política de Privacidad — Deriva Coffee Studio" },
  description:
    "Información sobre los datos tratados para la lista de apertura y, cuando un comercio autoriza Uber Eats, para consultar sus tiendas autorizadas.",
};

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <article className="legal-shell">
        <header>
          <p className="legal-eyebrow">Deriva Coffee Studio · Providencia, Santiago</p>
          <h1 className="legal-title">Política de Privacidad</h1>
          <p className="legal-meta">Última actualización: noviembre 2026</p>
        </header>

        <section>
          <h2>Responsable de los datos</h2>
          <p>
            Deriva Coffee Studio, con domicilio en Magnere 1570 Local 105, Providencia, Santiago, Chile, es
            responsable del tratamiento de la información descrita en esta política: los datos de la lista de
            apertura y, cuando un comercio autoriza la conexión con Uber Eats, la información que recibimos
            para consultar sus tiendas autorizadas.
          </p>
        </section>

        <section>
          <h2>Datos que recopilamos</h2>
          <p>
            Para la lista de apertura, recopilamos únicamente los datos que entregas voluntariamente al
            suscribirte: tu correo electrónico y, opcionalmente, tu nombre.
          </p>
        </section>

        <section>
          <h2>Finalidad del tratamiento</h2>
          <p>
            Para la lista de apertura, usamos esta información solo para avisarte cuando abramos, enviarte la
            invitación a la apertura y confirmarte el canje de la primera taza por nuestra cuenta. No usamos
            estos datos de la lista para perfilamiento, publicidad de terceros ni decisiones automatizadas.
          </p>
        </section>

        <section>
          <h2>Servicio de correo de la lista de apertura</h2>
          <p>
            Para gestionar el envío de los correos de la lista de apertura utilizamos a Resend (resend.com), que
            actúa como encargado de tratamiento bajo nuestras instrucciones. Los datos de la lista pueden ser
            almacenados fuera de Chile en infraestructura propia del proveedor.
          </p>
        </section>

        <section>
          <h2>Retención</h2>
          <p>
            Para la lista de apertura, conservamos tu correo mientras seas parte de ella. Si te das de baja,
            eliminamos tu información de la lista de nuestros sistemas activos.
          </p>
        </section>

        <section>
          <h2>Integración de Uber Eats para comercios</h2>
          <p>
            Cuando un comercio autoriza la conexión con Uber Eats, el servidor de Deriva recibe un código de
            autorización y lo canjea por un token temporal para solicitar a Uber la lista de tiendas autorizadas.
            El código y el token se usan solo para esa consulta y no se guardan en la base de datos de Deriva.
          </p>
          <p>
            La respuesta que mostramos a la persona administradora incluye el nombre y el identificador de cada
            tienda autorizada. Uber puede incluir datos de ubicación y contacto en la respuesta; este flujo los
            descarta.
          </p>
          <p>
            Este paso solo descubre tiendas autorizadas. Vincular una tienda con Deriva y gestionar su menú son
            capacidades separadas que podrán habilitarse en el futuro; si se habilitan, describiremos entonces
            el tratamiento de datos correspondiente.
          </p>
          <p>
            Uber gestiona el inicio de sesión y trata la información que recibe en ese proceso conforme a su{" "}
            <a href="https://www.uber.com/global/es/privacy-notice-drivers-delivery-people/" target="_blank" rel="noreferrer">
              aviso de privacidad para socios de la App
            </a>
            , que incluye a propietarios y trabajadores de restaurantes en Uber Eats. Para consultas o
            solicitudes sobre los datos que Deriva trata en esta integración, escríbenos a{" "}
            <a href="mailto:hola@derivastudio.cl">hola@derivastudio.cl</a>.
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
            Si estás en la lista de apertura, también puedes darte de baja de sus correos en cualquier momento
            usando el enlace incluido al pie de cada mensaje.
          </p>
        </section>

        <section>
          <h2>Cambios en esta política</h2>
          <p>
            Si actualizamos esta política, publicaremos la nueva versión en esta misma página y, cuando
            corresponda, avisaremos por correo a las personas de la lista de apertura.
          </p>
        </section>

        <footer className="legal-footer">
          <a href="/">← Volver al inicio</a>
        </footer>
      </article>
    </main>
  );
}
