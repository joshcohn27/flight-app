type StatusMessageProps = {
  title: string
  detail: string
}

function StatusMessage({ title, detail }: StatusMessageProps) {
  return (
    <section className="status">
      <h1 className="status-title">{title}</h1>
      <p className="status-detail">{detail}</p>
    </section>
  )
}

export default StatusMessage
