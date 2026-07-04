"use client";

import { useState, type ReactNode } from "react";
import { Check } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import FormField from "@/components/ui/FormField";
import Checkbox from "@/components/ui/Checkbox";
import Textarea from "@/components/ui/Textarea";
import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";

// Sección CONTACTO del design-system — RECONSTRUIDA ECO-93 siguiendo la página /contacto del sat: 2 columnas
// — MÉTODOS directos (enlaces que SIEMPRE funcionan, sin backend → no engañan) + un FORMULARIO con primitivos
// (Input/Select/FormField/Checkbox/Button), validación, consentimiento GDPR y estado "enviado". Front-end: el
// DS NO postea; el consumidor cablea su backend vía `onSubmit`. Lenguaje NEUTRO, a11y. Contenido por props.
export interface ContactMethod {
  /** Icono (p.ej. `<Mail size={18} />`). */
  icon: ReactNode;
  label: string;
  value: string;
  href?: string;
  external?: boolean;
}
export interface ContactFormData {
  name: string;
  email: string;
  subject?: string;
  message: string;
}
export interface ContactProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  methods?: ContactMethod[];
  methodsTitle?: string;
  formTitle?: string;
  /** Opciones del select de asunto. Si no hay, se omite el campo. */
  subjectOptions?: { value: string; label: string }[];
  subjectLabel?: string;
  privacyHref?: string;
  submitText?: string;
  /** Se llama con los datos válidos al enviar. El DS NO postea: cablea aquí tu backend (Resend, API route…). */
  onSubmit?: (data: ContactFormData) => void;
}

function MethodCard({ method }: { method: ContactMethod }) {
  const inner = (
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-tertiary text-content-primary">
        {method.icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-caption font-semibold uppercase tracking-widest text-content-secondary">
          {method.label}
        </p>
        <p className="mt-1 break-words text-body text-content-primary">
          {method.value}
        </p>
      </div>
    </div>
  );
  if (method.href) {
    return (
      <a
        href={method.href}
        {...(method.external
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
        className="card-flat block transition-[border-color,box-shadow] duration-[var(--duration-fast)] hover:border-border-strong hover:shadow-[var(--shadow-card)]"
      >
        {inner}
      </a>
    );
  }
  return <div className="card-flat">{inner}</div>;
}

function ContactFormBlock({
  subjectOptions,
  subjectLabel = "Subject",
  privacyHref = "#",
  submitText = "Send message",
  onSubmit,
}: Pick<
  ContactProps,
  "subjectOptions" | "subjectLabel" | "privacyHref" | "submitText" | "onSubmit"
>) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = "Please enter your name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "Enter a valid email";
    if (!consent) errs.consent = "Please accept the privacy policy";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit?.({ name, email, subject: subject || undefined, message });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="card-flat py-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-tertiary text-content-primary">
          <Check size={24} />
        </div>
        <h3 className="mt-3 text-h2 font-semibold text-content-primary">
          Message sent
        </h3>
        <p className="mt-2 text-body text-content-secondary">
          We&apos;ll get back to you within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card-flat space-y-5" noValidate>
      <FormField label="Name" error={errors.name} required>
        <Input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((p) => ({ ...p, name: "" }));
          }}
          placeholder="Your name"
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
          placeholder="you@email.com"
          hasError={!!errors.email}
        />
      </FormField>
      {subjectOptions && subjectOptions.length ? (
        <FormField label={subjectLabel}>
          {/* El Select es inline-block (content-width por diseño). FormField es flex-col → estiraría el Select
              a ancho completo y su dropdown se posicionaría respecto al borde del FORM, no del trigger. Un
              wrapper en BLOQUE lo mantiene content-width → el panel cae bajo el trigger (como en el catálogo).
              No tocamos el primitivo: el fix es del USO. */}
          <div>
            <Select
              options={subjectOptions}
              value={subject}
              onChange={setSubject}
              placeholder="Select an option"
              size="md"
            />
          </div>
        </FormField>
      ) : null}
      <FormField label="Message">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Tell us about your project…"
        />
      </FormField>
      <div>
        {/* ECO-121: consentimiento y enlace en UNA fila, a los EXTREMOS (checkbox izq / enlace der),
            centrados en su eje vertical, con altura fija (min-h-9) → marcar/desmarcar no cambia la altura
            y el botón no se mueve. flex-wrap para que en móvil el enlace baje sin desbordar. */}
        <div className="flex min-h-9 flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <Checkbox
            checked={consent}
            onChange={(c) => {
              setConsent(c);
              if (errors.consent && c)
                setErrors((p) => ({ ...p, consent: "" }));
            }}
            label="I have read and accept the privacy policy"
          />
          <a
            href={privacyHref}
            className="shrink-0 text-caption text-content-primary/75 underline decoration-dotted underline-offset-2 transition-colors hover:text-content-primary"
          >
            Read the privacy policy
          </a>
        </div>
        {/* El slot del error del consent está SIEMPRE montado con altura reservada → no empuja el botón.
            `aria-live` lo anuncia cuando aparece. */}
        <p className="mt-1 min-h-5 text-caption text-error" aria-live="polite">
          {errors.consent}
        </p>
      </div>
      <Button variant="primary" size="lg" fullWidth type="submit">
        {submitText}
      </Button>
    </form>
  );
}

export default function Contact({
  eyebrow,
  title,
  subtitle,
  methods,
  methodsTitle = "Reach us directly",
  formTitle = "Send a message",
  subjectOptions,
  subjectLabel,
  privacyHref,
  submitText,
  onSubmit,
}: ContactProps) {
  const hasMethods = !!methods && methods.length > 0;
  return (
    // ECO-120 — Section (banda + surface + ritmo `md`) + Container (ancho canónico `xl`). La rejilla interna
    // form+métodos es asimétrica (col-span 3/2, condicional) → se mantiene custom (Grid modela rejillas uniformes).
    <Section surface="primary">
      <Container size="xl">
        <div className="mb-12 flex flex-col items-center gap-2 text-center">
          {eyebrow ? (
            <p className="text-caption font-semibold uppercase tracking-wider text-content-secondary">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="font-display text-display-2 font-bold text-content-primary">
            {title}
          </h2>
          {subtitle ? (
            <p className="mx-auto mt-1 max-w-xl text-body text-content-secondary">
              {subtitle}
            </p>
          ) : null}
        </div>
        <div
          className={`grid grid-cols-1 gap-12 ${hasMethods ? "lg:grid-cols-5" : "mx-auto max-w-xl"}`}
        >
          {hasMethods ? (
            <div className="lg:col-span-2">
              <h3 className="text-h2 font-semibold text-content-primary">
                {methodsTitle}
              </h3>
              <div className="mt-6 space-y-3">
                {methods!.map((m) => (
                  <MethodCard key={m.label} method={m} />
                ))}
              </div>
            </div>
          ) : null}
          <div className={hasMethods ? "lg:col-span-3" : ""}>
            {hasMethods ? (
              <h3 className="mb-6 text-h2 font-semibold text-content-primary">
                {formTitle}
              </h3>
            ) : null}
            <ContactFormBlock
              subjectOptions={subjectOptions}
              subjectLabel={subjectLabel}
              privacyHref={privacyHref}
              submitText={submitText}
              onSubmit={onSubmit}
            />
          </div>
        </div>
      </Container>
    </Section>
  );
}
