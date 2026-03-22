export default function ContactCard({ name, role, avatarUrl, id }: { name: string; role: string; avatarUrl?: string | null; id: string }) {
  return (
    <div className="hc-emp">
      <img src={avatarUrl || `https://i.pravatar.cc/26?u=${id}`} alt="" />
      <div className="hce-info">
        <strong>{name}</strong>
        <span>{role}</span>
      </div>
    </div>
  )
}
