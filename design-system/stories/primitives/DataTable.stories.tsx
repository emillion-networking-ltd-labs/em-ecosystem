import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import DataTable, { type ColumnDef } from "@/components/ui/DataTable";

interface Proyecto {
  id: string;
  nombre: string;
  responsable: string;
  estado: string;
}

const filas: Proyecto[] = [
  { id: "1", nombre: "Sitio corporativo", responsable: "Lucía Fernández", estado: "Activo" },
  { id: "2", nombre: "Tienda en línea", responsable: "Marcos Gómez", estado: "En pausa" },
  { id: "3", nombre: "Campaña de marketing", responsable: "Ana Torres", estado: "Activo" },
  { id: "4", nombre: "Rediseño del panel", responsable: "Diego Ruiz", estado: "Finalizado" },
];

const columnas: ColumnDef<Proyecto>[] = [
  { key: "nombre", label: "Proyecto", render: (row) => row.nombre },
  { key: "responsable", label: "Responsable", render: (row) => row.responsable },
  { key: "estado", label: "Estado", align: "right", render: (row) => row.estado },
];

const meta = {
  title: "Primitives/DataTable",
  component: DataTable,
  tags: ["autodocs"],
  args: {
    data: filas,
    columns: columnas,
    keyExtractor: (row: Proyecto) => row.id,
  },
} satisfies Meta<typeof DataTable<Proyecto>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
