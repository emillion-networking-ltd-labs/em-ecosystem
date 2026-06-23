// Base i18n del generador de satélites (ECO-58, nivel 1) — UNA fuente de verdad del CHROME.
//
// "Chrome" = los labels de UI que pone el GENERADOR (nav, aria, eyebrows, CTAs, títulos de sección,
// breadcrumb). NO es el CONTENIDO del cliente (servicios, negocio, testimonios…): eso viene del brief en su
// propio idioma y JAMÁS se auto-traduce (guardrail §D4). Antes estos strings estaban hardcodeados e inline en
// los block builders; aquí se centralizan keyed por idioma para que un futuro skill multi-idioma solo añada
// catálogos/locale ENCIMA, sin cazar strings dispersos.
//
// FALLBACK: si identity.language no tiene catálogo (p.ej. "fr"), el chrome cae a INGLÉS — lingua franca
// internacional, mejor neutral que el español que salía hardcodeado. OJO: el fallback es SOLO para los labels;
// <html lang> SIEMPRE refleja el idioma REAL del brief (es el arreglo SEO/a11y), nunca se fuerza al fallback.
export const FALLBACK_LANG = "en";

// Cada label es un string, o una función (siteName) => string cuando interpola la marca.
const CATALOGS = {
  // ES = los textos ACTUALES, VERBATIM (cero cambio para clientes ES → salida byte-idéntica a hoy).
  es: {
    navHome: "Inicio",
    navAria: "Principal",
    ctaContact: "Contacto",
    ctaSeeServices: "Ver servicios",
    servicesEyebrow: "Servicios",
    servicesHomeTitle: (s) => `Lo que ofrece ${s}`,
    servicesFullTitle: (s) => `Servicios de ${s}`,
    servicesViewAll: "Ver todos los servicios",
    portfolioEyebrow: "Portfolio",
    portfolioHomeTitle: "Trabajos destacados",
    portfolioFullTitle: (s) => `Trabajos de ${s}`,
    portfolioViewAll: "Ver portfolio",
    testimonialsEyebrow: "Testimonios",
    testimonialsHomeTitle: "Lo que dicen nuestros clientes",
    testimonialsFullTitle: "Testimonios",
    pricingEyebrow: "Precios",
    pricingTitle: "Planes",
    faqEyebrow: "FAQ",
    faqTitle: "Preguntas frecuentes",
    contactTitle: "Contacto",
    contactFormTitle: "Escríbenos",
    contactFormLead: "Envíanos un mensaje y te responderemos lo antes posible.",
    backHome: "Volver al inicio",
  },
  en: {
    navHome: "Home",
    navAria: "Main",
    ctaContact: "Contact",
    ctaSeeServices: "View services",
    servicesEyebrow: "Services",
    servicesHomeTitle: (s) => `What ${s} offers`,
    servicesFullTitle: (s) => `${s} services`,
    servicesViewAll: "View all services",
    portfolioEyebrow: "Portfolio",
    portfolioHomeTitle: "Featured work",
    portfolioFullTitle: (s) => `${s}'s work`,
    portfolioViewAll: "View portfolio",
    testimonialsEyebrow: "Testimonials",
    testimonialsHomeTitle: "What our clients say",
    testimonialsFullTitle: "Testimonials",
    pricingEyebrow: "Pricing",
    pricingTitle: "Plans",
    faqEyebrow: "FAQ",
    faqTitle: "Frequently asked questions",
    contactTitle: "Contact",
    contactFormTitle: "Send us a message",
    contactFormLead: "Send us a message and we'll be in touch shortly.",
    backHome: "Back to home",
  },
};

export const CHROME_LANGS = Object.freeze(Object.keys(CATALOGS));

// Normaliza un código de idioma a su catálogo: "es" / "es-ES" / "ES" → es. Sin catálogo → FALLBACK_LANG.
export function chromeLang(language) {
  const base = String(language || "").toLowerCase().split(/[-_]/)[0];
  return CATALOGS[base] ? base : FALLBACK_LANG;
}

// El set de labels de chrome para un idioma, con el fallback ya aplicado.
export function chrome(language) {
  return CATALOGS[chromeLang(language)];
}
