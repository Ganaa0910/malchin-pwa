import { AnimalProfile } from "@/components/animal/AnimalProfile";

export default async function AnimalProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AnimalProfile id={id} />;
}
