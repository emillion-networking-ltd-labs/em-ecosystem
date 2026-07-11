import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Star } from "lucide-react";
import IconBadge from "@/components/ui/IconBadge";

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
