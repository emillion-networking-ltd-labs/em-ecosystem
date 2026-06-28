import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { BarChart3, ShoppingCart, Settings } from "lucide-react";
import Tabs from "@/components/ui/Tabs";

// Only the variants the dashboard uses: nav (vertical) and nav-horizontal (top bar). The bordered
// "subtle" selector variant isn't documented here — that pattern is covered by SegmentedControl.
const navItems = [
  { label: "Dashboard", value: "dashboard", icon: <BarChart3 size={16} /> },
  { label: "Orders", value: "orders", icon: <ShoppingCart size={16} /> },
  { label: "Settings", value: "settings", icon: <Settings size={16} /> },
];

// Responsive wrapper for nav-horizontal (same pattern as the dashboard showcase): horizontal
// scroll + drag, plus navigation DOTS shown only when the tabs overflow their container.
function ScrollDotsWrapper({
  tabs,
  activeTab,
  onChange,
  children,
}: {
  tabs: { value: string }[];
  activeTab: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const scrollLeftRef = useRef(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => setOverflows(el.scrollWidth > el.clientWidth + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const el = scrollRef.current;
      if (!el) return;
      e.preventDefault();
      el.scrollLeft = scrollLeftRef.current - (e.clientX - startX.current);
    };
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging]);

  const onMouseDown = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el || !overflows) return;
    setDragging(true);
    startX.current = e.clientX;
    scrollLeftRef.current = el.scrollLeft;
  };

  return (
    <>
      <div
        ref={scrollRef}
        style={{ cursor: overflows ? (dragging ? "grabbing" : "grab") : undefined }}
        className={`overflow-x-auto scrollbar-hide touch-pan-x select-none ${
          dragging ? "**:pointer-events-none" : ""
        }`}
        onMouseDown={onMouseDown}
      >
        {children}
      </div>
      {overflows && (
        <div className="mt-2 flex justify-center gap-1">
          {tabs.map((tab, i) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                onChange(tab.value);
                const el = scrollRef.current;
                if (!el) return;
                const tabEl = el.querySelectorAll("[role='tab']")[i] as HTMLElement;
                if (tabEl)
                  tabEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
              }}
              className="cursor-pointer p-1"
              aria-label={`Go to ${tab.value}`}
            >
              <div
                className={`h-[9px] w-[9px] rounded-full transition-colors ${
                  activeTab === tab.value
                    ? "bg-surface-inverse"
                    : "bg-border-strong hover:bg-content-primary/30"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </>
  );
}

const meta = {
  title: "Primitives/Tabs",
  component: Tabs,
  tags: ["autodocs"],
  argTypes: {
    variant: { control: "inline-radio", options: ["nav", "nav-horizontal"] },
  },
  args: {
    tabs: navItems,
    activeTab: "dashboard",
    variant: "nav",
    onChange: () => {},
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

// variant=nav — vertical navigation (sidebar). Active: bg-surface-subtle; inactive shows a
// ChevronRight + optional icon (16px).
export const Nav: Story = {
  render: (args) => {
    const [active, setActive] = useState(args.activeTab);
    return (
      <div className="w-[240px]">
        <Tabs {...args} variant="nav" activeTab={active} onChange={setActive} />
      </div>
    );
  },
};

// variant=nav-horizontal — top bar, wrapped in the responsive ScrollDotsWrapper (same as the
// dashboard). On a wide screen all tabs fit and it shows complete (no scroll, no dots). When the
// tabs no longer fit — i.e. on a mobile viewport — it scrolls horizontally and the navigation dots
// appear below. Use Storybook's viewport toolbar (mobile) to see the dots activate.
export const NavHorizontal: Story = {
  render: (args) => {
    const [active, setActive] = useState(args.activeTab);
    return (
      <ScrollDotsWrapper tabs={navItems} activeTab={active} onChange={setActive}>
        <Tabs {...args} variant="nav-horizontal" activeTab={active} onChange={setActive} />
      </ScrollDotsWrapper>
    );
  },
};
