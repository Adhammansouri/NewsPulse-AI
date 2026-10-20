export function PageSkeleton() {
  return (
    <div className="page" aria-busy="true" aria-label="جارٍ التحميل">
      <span className="skel" style={{ width: "38%", height: "2rem", marginBottom: "1rem" }} />
      <span className="skel" style={{ width: "64%", height: "1rem", marginBottom: "2rem" }} />
      <div style={{ display: "grid", gap: "0.75rem" }}>
        {[88, 76, 82, 70].map((w) => (
          <span key={w} className="skel" style={{ width: `${w}%`, height: "3.5rem" }} />
        ))}
      </div>
    </div>
  );
}
