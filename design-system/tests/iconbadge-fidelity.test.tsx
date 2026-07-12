import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Star } from "lucide-react";
import IconBadge, { type IconBadgeVariant } from "@/components/ui/IconBadge";

// ECO-187 — FIDELIDAD de la migración a tailwind-variants: el conjunto de clases del <div> debe ser IDÉNTICO
// viejo (concat de strings + mapas) vs nuevo (tv, twMerge:false), para cada variant×size. Se retira al cerrar
// la pieza (cuando ya no queda el concat viejo con qué comparar).
const OLD_ROOT = "inline-flex shrink-0 items-center justify-center";
const OLD_VARIANT: Record<IconBadgeVariant, string> = {
  default: "bg-surface-subtle text-content-primary",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  error: "bg-error-bg text-error",
  info: "bg-info-bg text-info",
};
const OLD_SIZE = {
  sm: "h-8 w-8 rounded-md",
  md: "h-10 w-10 rounded-md",
  lg: "h-14 w-14 rounded-md",
} as const;
const VARIANTS = ["default", "success", "warning", "error", "info"] as const;
const SIZES = ["sm", "md", "lg"] as const;
const classSet = (el: Element | null) =>
  el
    ? (el.getAttribute("class") || "").split(/\s+/).filter(Boolean).sort()
    : [];

describe("IconBadge — fidelidad de la caja (viejo concat vs nuevo tv), por caso", () => {
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      it(`${variant} · ${size}`, () => {
        const oldSet = `${OLD_ROOT} ${OLD_VARIANT[variant]} ${OLD_SIZE[size]}`
          .split(/\s+/)
          .filter(Boolean)
          .sort();
        const r = render(<IconBadge variant={variant} size={size} />);
        const neu = classSet(r.container.querySelector("div"));
        r.unmount();
        expect(neu).toEqual(oldSet);
      });
    }
  }
});

// ECO-183 — FIDELIDAD del prop `icon` de IconBadge: el contenedor impone el tamaño desde la escala
// (sm→md 16, md→lg 24, lg→xl 32). El SVG de `<IconBadge icon={Glyph} size=.../>` debe equivaler al viejo
// children dimensionado a mano (sm=16, md=24). `lg` recupera su 32 fiel (xl) con la escala regular de ECO-184.
const svgSig = (c: HTMLElement) => {
  const svg = c.querySelector("svg")!;
  return {
    width: svg.getAttribute("width"),
    height: svg.getAttribute("height"),
    parts: svg.querySelectorAll("path,line,circle,rect,polyline,polygon")
      .length,
  };
};

describe("IconBadge — prop `icon` impone el tamaño desde la escala", () => {
  it("sm → 16px (== <Glyph size={16}> como children)", () => {
    const viaProp = render(<IconBadge icon={Star} size="sm" />);
    const sigProp = svgSig(viaProp.container);
    viaProp.unmount();

    const viaChild = render(
      <IconBadge size="sm">
        <Star size={16} />
      </IconBadge>,
    );
    const sigChild = svgSig(viaChild.container);
    viaChild.unmount();

    expect(sigProp.width).toBe("16");
    expect(sigProp).toEqual(sigChild);
  });

  it("md → 24px (== <Glyph size={24}> como children)", () => {
    const viaProp = render(<IconBadge icon={Star} size="md" />);
    const sigProp = svgSig(viaProp.container);
    viaProp.unmount();

    const viaChild = render(
      <IconBadge size="md">
        <Star size={24} />
      </IconBadge>,
    );
    const sigChild = svgSig(viaChild.container);
    viaChild.unmount();

    expect(sigProp.width).toBe("24");
    expect(sigProp).toEqual(sigChild);
  });

  it("lg → 32px (xl, fiel con la escala regular de ECO-184)", () => {
    const viaProp = render(<IconBadge icon={Star} size="lg" />);
    expect(svgSig(viaProp.container).width).toBe("32");
    viaProp.unmount();
  });
});
