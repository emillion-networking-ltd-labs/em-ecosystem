import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BentoGrid, BentoGridItem } from "@/components/ui/BentoGrid";

// Aceternity UI (MIT), adoptado verbatim en ECO-88.
const meta = {
  title: "Marketing/BentoGrid",
  component: BentoGrid,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof BentoGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

const Header = () => (
  <div className="flex h-full min-h-24 w-full rounded-xl [background-image:var(--gradient-brand)] opacity-80" />
);

const items = [
  { title: "Rápido", description: "Rendimiento de fábrica.", className: "md:col-span-2" },
  { title: "Accesible", description: "WCAG AA por construcción.", className: "" },
  { title: "Gobernado", description: "Tokens y registry.", className: "" },
  { title: "Bello", description: "Composición por sector.", className: "md:col-span-2" },
];

export const Default: Story = {
  render: () => (
    <BentoGrid>
      {items.map((it) => (
        <BentoGridItem
          key={it.title}
          title={it.title}
          description={it.description}
          header={<Header />}
          className={it.className}
        />
      ))}
    </BentoGrid>
  ),
};
