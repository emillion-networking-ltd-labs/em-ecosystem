export const siteConfig = {
  name: "Cristian García Espadas",
  tagline: "Entrenador Personal · Asesor Nutricional",
  location: "Granada, España",
  email: "info@cristiangarcia.com",
  instagram: "@cristiangarciaespadas",
  // PLACEHOLDER — actualizar con número real cuando Cristian lo provea.
  // Formato internacional E.164 sin espacios para wa.me/<numero>.
  whatsapp: "+34600000000",
  responseTime: "Respondo personalmente en menos de 24 horas.",
};

export const navLinks = [
  { label: "Inicio", href: "/" },
  { label: "Servicios", href: "/servicios" },
  { label: "Sobre Mí", href: "/sobre-mi" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Testimonios", href: "/testimonios" },
  { label: "Precios", href: "/precios" },
  { label: "Contacto", href: "/contacto" },
];

export const socialProofStats = [
  { value: "+500", label: "Clientes transformados" },
  { value: "20+", label: "Años de experiencia" },
  { value: "100%", label: "Compromiso" },
  { value: "24/7", label: "Seguimiento" },
];

export const services = [
  { id: "entrenamiento", title: "Entrenamiento Personalizado", shortDesc: "Rutinas diseñadas para tu cuerpo, objetivos y ritmo de vida.", fullDesc: "Cada programa está basado en tu nivel, objetivos y disponibilidad. Sin plantillas. Analizo tu situación, diseño un plan progresivo y lo ajusto semana a semana.", features: ["Programación periodizada", "Ajustes semanales", "Vídeos explicativos", "Análisis postural"] },
  { id: "nutricion", title: "Asesoramiento Nutricional", shortDesc: "Planes basados en ciencia, adaptados a tu día a día.", fullDesc: "Diseño planes alimenticios basados en evidencia, adaptados a tus gustos y restricciones. Calculo macros, estructuro comidas y te enseño a comer bien para siempre.", features: ["Macros personalizados", "Plan flexible", "Educación nutricional", "Ajustes por fase"] },
  { id: "seguimiento", title: "Seguimiento Online", shortDesc: "Revisiones semanales y ajustes en tiempo real.", fullDesc: "Cada semana reviso tu progreso, analizo mediciones, evalúo rendimiento y ajusto todo. Contacto directo conmigo por WhatsApp.", features: ["Check-in semanal", "Análisis con fotos", "Ajuste continuo", "WhatsApp directo"] },
  { id: "suplementacion", title: "Guía de Suplementación", shortDesc: "Recomendaciones honestas de lo que realmente funciona.", fullDesc: "Te digo exactamente qué tomar, cuándo y por qué. Basado en evidencia y en mi experiencia como competidor. Sin patrocinios.", features: ["Solo con evidencia", "Dosificación óptima", "Sin conflicto de intereses", "Actualizado"] },
  { id: "videollamadas", title: "Videollamadas", shortDesc: "Sesiones en vivo para técnica y planificación.", fullDesc: "Reserva una sesión para revisar técnica, planificar tu siguiente fase o resolver dudas complejas.", features: ["Revisión de técnica", "Planificación", "Resolución de dudas", "30 o 60 minutos"] },
  { id: "recetas", title: "Recetas Saludables", shortDesc: "Fáciles, deliciosas y con macros calculados.", fullDesc: "Acceso a mi colección personal de recetas: todas calculadas, fáciles de preparar y pensadas para rendir.", features: ["Macros calculados", "15-30 min preparación", "Para todas las fases", "Nuevas cada mes"] },
];

export const testimonials = [
  { name: "María L.", quote: "En 4 meses he conseguido lo que no pude en 3 años sola. Cristian no solo te entrena, te educa.", result: "-12kg de grasa" },
  { name: "Carlos R.", quote: "Pensé que a los 45 ya no podía cambiar. Me equivocaba. El seguimiento semanal es brutal.", result: "+8kg de músculo" },
  { name: "Ana P.", quote: "Las recetas me salvaron. Por fin como rico y sigo avanzando. Lo mejor: aprendí a hacerlo sola.", result: "Competidora amateur" },
  { name: "Javi M.", quote: "Llevo 2 años con Cristian. El mejor dinero que he invertido en mi salud.", result: "Transformación completa" },
];

// MOCK — sustituir por integración con Google Places API cuando Cristian vincule
// su Google Business Profile. La estructura coincide con la respuesta de la API
// (`fields=rating,user_ratings_total,reviews`) para que el swap sea directo.
// Cuando se vincule: cambiar `isMock` a false y conectar el `place_id` real.
export const googleReviewsMock = {
  isMock: true,
  rating: 4.9,
  totalReviews: 23,
  profileUrl: "#",
  reviews: [
    {
      name: "Laura Martín",
      relativeDate: "Hace 1 mes",
      rating: 5,
      text: "Cristian es un profesional excepcional. Tras 3 meses con su plan he visto resultados que no había conseguido entrenando por mi cuenta durante años. Atención personal y método riguroso.",
    },
    {
      name: "Daniel R.",
      relativeDate: "Hace 2 meses",
      rating: 5,
      text: "Llevo casi un año entrenando con él. La diferencia con otros entrenadores es la cercanía y el ajuste continuo. Recomiendo 100%.",
    },
    {
      name: "Sara G.",
      relativeDate: "Hace 3 meses",
      rating: 5,
      text: "Empecé sin saber por dónde tirar y hoy estoy preparando mi primera competición. Plan de nutrición y entrenamiento adaptado a cada fase. Top.",
    },
    {
      name: "Iván López",
      relativeDate: "Hace 4 meses",
      rating: 5,
      text: "Conocimiento técnico, exigencia justa y resultados reales. He probado varios coaches y este nivel no lo había encontrado.",
    },
    {
      name: "Marta Vega",
      relativeDate: "Hace 6 meses",
      rating: 5,
      text: "Perdí 14 kilos en 5 meses sin pasar hambre y aprendí a comer bien. Lo mejor: mantenerlo es sostenible porque aprendí en el proceso.",
    },
    {
      name: "Pablo Hernández",
      relativeDate: "Hace 8 meses",
      rating: 4,
      text: "Buen entrenador y muy profesional. Resultados visibles desde el primer mes. Quito una estrella solo porque a veces tarda en responder los fines de semana.",
    },
  ],
};

export const transformations = [
  {
    id: 1,
    name: "Javier Ruiz",
    instagram: "@javi.ruiz.fit",
    location: "Granada",
    age: 32,
    duration: "6 meses",
    result: "Listo para competir",
    quote: "Llegué a Cristian con un cuerpo aceptable pero sin la condición ni la confianza para subir a tarima. Su método combina planificación periodizada, técnica depurada y ajustes semanales según mis sensaciones y mediciones. En 6 meses pasé de entrenar por inercia a presentarme en forma competitiva real, con la base física y mental para competir.",
    before: "/images/transformations/before-1.png",
    after: "/images/transformations/after-1.png",
  },
  {
    id: 3,
    name: "Daniel Navarro",
    instagram: "@dani.navarro.gym",
    location: "Madrid",
    age: 25,
    duration: "2 meses",
    result: "Transformación completa",
    quote: "Empecé con dudas sobre si a los 25 años, después de varios intentos por mi cuenta, podría cambiar mi composición corporal. En menos de 2 meses con el programa de Cristian noté cambios visibles que no había logrado en años entrenando solo. La diferencia fue tener un plan estructurado, ajustes constantes y un seguimiento real semana a semana. El mejor dinero invertido en mi salud, volvería a empezar mañana.",
    before: "/images/transformations/before-3.png",
    after: "/images/transformations/after-3.png",
  },
];

export const portfolioImages = [
  { src: "/images/portfolio-double-biceps.jpeg", alt: "Doble bíceps frontal" },
  { src: "/images/portfolio-side-chest.jpeg", alt: "Pecho lateral" },
  { src: "/images/portfolio-lat-spread.jpeg", alt: "Dorsal frontal" },
  { src: "/images/portfolio-most-muscular.jpeg", alt: "Most muscular" },
  { src: "/images/portfolio-back-pose.jpeg", alt: "Doble bíceps espalda" },
  { src: "/images/portfolio-relaxed.jpeg", alt: "Pose relajada" },
  { src: "/images/portfolio-side-dark.jpeg", alt: "Lateral dramático" },
  { src: "/images/portfolio-stage.jpeg", alt: "En competición" },
  { src: "/images/portfolio-lat-smile.jpeg", alt: "Dorsal con sonrisa" },
  { src: "/images/portfolio-classic-bw.jpeg", alt: "Clásica B&W" },
  { src: "/images/portfolio-group-back.jpeg", alt: "Grupo espalda" },
  { src: "/images/portfolio-front-pose.jpeg", alt: "Frontal en escenario" },
];

// Palmarés verificado — fuente: Granada Hoy. Todos los logros documentados son de 2011.
export const portfolioPalmares = [
  {
    year: "2011",
    title: "Campeonato de Andalucía",
    scope: "Regional",
    category: "Sub 23",
    result: "1° puesto",
    note: "Campeón de Andalucía Sub-23 — primer título oficial.",
  },
  {
    year: "2011",
    title: "Campeonato de España",
    scope: "Nacional",
    category: "Sub 23",
    result: "1° puesto",
    note: "Campeón de España Sub-23 — título nacional.",
  },
  {
    year: "2011",
    title: "Míster Universo",
    scope: "Internacional",
    category: "Talla Atlética",
    result: "Top 15 mundial",
    note: "Finalista en la escena mundial.",
  },
];

// Apariciones en prensa verificadas. Para añadir nuevas: misma estructura de objeto.
export const portfolioMedia = [
  {
    publication: "Granada Hoy",
    year: "2018",
    title: "Un granadino entre los grandes",
    excerpt:
      "Su trayectoria lo posiciona como uno de los entrenadores más sólidos en transformación física, recomposición corporal y entrenamiento online.",
    url: "https://www.granadahoy.com/deportes/granadino-grandes_0_581942036.html",
  },
];

export const pricingPlans = [
  { name: "Básico", price: "89", period: "/mes", description: "Para quien empieza.", features: ["Plan de entrenamiento", "Plan nutricional básico", "Check-in quincenal", "Acceso a recetas", "Soporte por email"], cta: "EMPEZAR", highlighted: false },
  { name: "Pro", price: "149", period: "/mes", description: "El más elegido.", features: ["Todo lo del Básico", "Check-in semanal", "Guía de suplementación", "WhatsApp directo", "1 videollamada/mes", "Acceso prioritario"], cta: "ELEGIR PRO", highlighted: true },
  { name: "Elite", price: "249", period: "/mes", description: "Competidores y transformaciones.", features: ["Todo lo del Pro", "Check-in 2x/semana", "2 videollamadas/mes", "Prep competición", "Análisis corporal", "Soporte 24/7"], cta: "IR A ELITE", highlighted: false },
];

export const aboutContent = {
  name: "Cristian García Espadas",
  title: "De Granada al Top 15 mundial.",
  lead: "Lo que empezó a los 15 años entrenando con mi padre se convirtió en una carrera que me llevó al Top 15 del mundo en Míster Universo.",
  subtitle: "Campeón de España Sub 23 · Finalista Míster Universo · Entrenador Certificado",
  paragraphs: [
    "Nací en Granada y llevo más de 20 años dedicado al fitness y la competición. Empecé a los 15 años en un gimnasio pequeño y casero, junto a mi padre — él fue mi primer entrenador, mi compañero y la razón por la que esto se convirtió en pasión antes que en profesión.",
    "Esa misma manera de trabajar es la que aplico hoy con cada cliente: cercanía real, plan personalizado y resultados sostenibles. No vendo humo, no prometo milagros. Te doy un método que funciona, te enseño a ejecutarlo y te acompaño hasta que lo logres.",
    "Si buscas resultados, hablemos.",
  ],
  philosophy: {
    headline: "Disciplina. Consistencia. Ciencia.",
    body: "Tres pilares y una creencia: el deporte se disfruta. La transformación duradera no se construye con sufrimiento, se construye con un plan que respetes y un proceso del que disfrutes.",
  },
  timeline: [
    {
      eyebrow: "El comienzo",
      title: "15 años, junto a mi padre",
      description: "Mi padre fue mi primer entrenador y compañero. Lo que empezó como una rutina compartida en un gimnasio casero se convirtió en pasión.",
    },
    {
      eyebrow: "Primer título",
      title: "Campeón de Andalucía",
      description: "Mi primera victoria regional. La validación de que el método y la constancia funcionan.",
    },
    {
      eyebrow: "Nivel nacional",
      title: "Campeón de España Sub 23",
      description: "Título nacional Sub 23. El salto definitivo de aficionado a competidor profesional.",
    },
    {
      eyebrow: "Escena mundial",
      title: "Top 15 Míster Universo",
      description: "Entre los 15 mejores del mundo. Prueba de que la planificación y la consistencia compiten al máximo nivel.",
    },
    {
      eyebrow: "Hoy",
      title: "+500 clientes transformados",
      description: "Aplico el mismo método con el que llegué al podio: ciencia, consistencia y atención personal con cada uno de mis clientes.",
    },
  ],
  credentials: ["Campeón Andalucía", "Campeón España Sub 23", "Top 15 Míster Universo", "Asesor Nutricional", "+500 Clientes"],
};

export const footerLinks = {
  nav: [{ label: "Inicio", href: "/" }, { label: "Servicios", href: "/servicios" }, { label: "Sobre Mí", href: "/sobre-mi" }, { label: "Portfolio", href: "/portfolio" }, { label: "Testimonios", href: "/testimonios" }, { label: "Precios", href: "/precios" }, { label: "Contacto", href: "/contacto" }],
  legal: [{ label: "Privacidad", href: "/legal/privacidad" }, { label: "Términos", href: "/legal/terminos" }],
};
