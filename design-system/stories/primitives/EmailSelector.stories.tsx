import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import EmailSelector from "@/components/ui/EmailSelector";
import { DemoCard } from "../_kit";

const meta = {
  title: "Primitives/EmailSelector",
  component: EmailSelector,
  tags: ["autodocs"],
  args: {
    email: "anna.smith@company.com",
    onChangeEmail: () => {},
  },
  // Wrapper div so the DemoCard frame centers it (EmailSelector's root has `self-start`, which would
  // otherwise push it to the top).
  render: (args) => (
    <DemoCard>
      <div>
        <EmailSelector {...args} />
      </div>
    </DemoCard>
  ),
} satisfies Meta<typeof EmailSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

// Just shows the email plus a callback to change it — no sizes/variants, so no AllVariants.
// (Long-email handling — fixed width + ellipsis + hover tooltip with the full value — is tracked in ECO-118;
// once done, add a LongEmail story showing the truncation.)
export const Default: Story = {};
