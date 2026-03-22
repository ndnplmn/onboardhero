export default async function TeamMemberPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <h1>Team Member {id}</h1>
}
