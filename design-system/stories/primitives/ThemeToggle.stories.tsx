import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ThemeToggle from "@/components/ui/ThemeToggle";

// App-coupled: usa useTheme → @/context/ThemeContext. En el catálogo se cablea contra un
// ThemeContext MOCK (ver .storybook/mocks/context); en la app real lo provee el dashboard.
const meta = {
  title: "Primitives/ThemeToggle",
  component: ThemeToggle,
  tags: ["autodocs"],
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
