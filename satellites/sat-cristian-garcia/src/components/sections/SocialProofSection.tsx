import { socialProofStats } from "@/lib/data";

export default function SocialProofSection() {
  return (
    <section className="bg-surface-secondary py-16">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 px-6 sm:grid-cols-4">
        {socialProofStats.map((s) => (
          <div key={s.label} className="card-flat text-center py-8">
            <p className="text-h1 font-black text-accent">{s.value}</p>
            <p className="mt-2 text-body text-content-secondary">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
