"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import FormField from "@/components/ui/FormField";

const serviceOptions = [
  { value: "entrenamiento", label: "Entrenamiento Personalizado" },
  { value: "nutricion", label: "Asesoramiento nutricional" },
  { value: "seguimiento", label: "Seguimiento Online" },
  { value: "competicion", label: "Preparacion de Competicion" },
  { value: "otro", label: "Otro" },
];

/**
 * ContactForm — bloque de formulario sin <section> wrapper. Diseñado para
 * vivir dentro de un layout 2-cols controlado por la página padre.
 *
 * GDPR: checkbox de consentimiento explícito (no pre-marcado), separado de
 * cualquier T&C, con link a la política de privacidad. Validación obligatoria.
 *
 * Submission: provisionalmente solo cambia state a `submitted`. Reemplazar por
 * fetch a `/api/contacto` (Route Handler) cuando se conecte con un servicio
 * real (Resend, SendGrid, etc.).
 */
export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [service, setService] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2)
      errs.name = "El nombre es obligatorio";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "Email no válido";
    if (!consent) errs.consent = "Debes aceptar la política de privacidad";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="card-flat py-10 text-center">
        <p className="text-3xl text-accent">&#10003;</p>
        <h3 className="mt-3 text-h2 font-semibold text-content-primary">
          Solicitud enviada
        </h3>
        <p className="mt-2 text-body text-content-secondary">
          Te contactaré personalmente en menos de 24 horas.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card-flat space-y-5" noValidate>
      <FormField label="Nombre" error={errors.name} required>
        <Input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((p) => ({ ...p, name: "" }));
          }}
          placeholder="Tu nombre"
          hasError={!!errors.name}
        />
      </FormField>
      <FormField label="Email" error={errors.email} required>
        <Input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((p) => ({ ...p, email: "" }));
          }}
          placeholder="tu@email.com"
          hasError={!!errors.email}
        />
      </FormField>
      <FormField label="Servicio de interés">
        <Select
          options={serviceOptions}
          value={service}
          onChange={setService}
          placeholder="Selecciona un servicio"
          size="md"
          fullWidth
          ariaLabel="Servicio de interés"
        />
      </FormField>
      <FormField label="Tu objetivo">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Quiero perder grasa, ganar músculo..."
          className="w-full resize-none rounded-md border border-line-control bg-transparent px-4 py-3 text-body text-content-primary outline-hidden transition-colors placeholder:text-content-placeholder focus:outline-2 focus:outline-content-primary/75"
        />
      </FormField>

      {/* GDPR consent — opt-in obligatorio, no pre-marcado */}
      <div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              if (errors.consent && e.target.checked) {
                setErrors((p) => ({ ...p, consent: "" }));
              }
            }}
            className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-accent"
          />
          <span className="text-caption leading-relaxed text-content-secondary">
            He leído y acepto la{" "}
            <Link
              href="/legal/privacidad"
              className="text-accent underline decoration-dotted underline-offset-2 hover:text-content-primary"
            >
              política de privacidad
            </Link>{" "}
            y autorizo el tratamiento de mis datos para responder a esta
            consulta.
          </span>
        </label>
        {errors.consent && (
          <p className="mt-1 text-caption text-error">{errors.consent}</p>
        )}
      </div>

      <Button variant="primary" size="lg" fullWidth type="submit">
        RESERVAR MI LLAMADA
      </Button>
    </form>
  );
}
