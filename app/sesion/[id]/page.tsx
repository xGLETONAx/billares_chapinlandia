import { SesionConsumos } from "@/components/sesion-consumos"

interface PageProps {
  params: {
    id: string
  }
}

export default function SesionPage({ params }: PageProps) {
  return <SesionConsumos mesaId={params.id} />
}
