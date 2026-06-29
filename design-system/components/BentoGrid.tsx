// BentoGrid / BentoGridItem — Aceternity UI (MIT, © Manu Arora), adoptado (ECO-88, fase 1 / ADR-019; alineado
// en ECO-108: card cruda neutral/white/black → utilidad `card` + tokens content-*).
// Layout bento (rejilla asimétrica) para destacar features. Sin deps externas (el @tabler/icons del
// registry es solo del demo); el icono entra por prop. Solo `cn`.
import { cn } from "@/lib/utils";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "mx-auto grid max-w-7xl grid-cols-1 gap-4 md:auto-rows-[18rem] md:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "group/bento card row-span-1 flex flex-col justify-between space-y-4 p-4 transition duration-200 hover:shadow-xl",
        className,
      )}
    >
      {header}
      <div className="transition duration-200 group-hover/bento:translate-x-2">
        {icon}
        <div className="mt-2 mb-2 text-h3 font-semibold text-content-primary">
          {title}
        </div>
        <div className="text-caption font-normal text-content-secondary">
          {description}
        </div>
      </div>
    </div>
  );
};
