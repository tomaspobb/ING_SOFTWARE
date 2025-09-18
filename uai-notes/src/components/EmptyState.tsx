// src/components/EmptyState.tsx
export default function EmptyState({
  icon = "bi-exclamation-triangle-fill",
  title,
  subtitle,
  action,
}: {
  icon?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-7">
            <div className="card bg-body-tertiary border-0 shadow-sm">
              <div className="card-body p-4 p-md-5 text-center">
                <div className="display-5 mb-3">
                  <i className={`${icon} text-warning`}></i>
                </div>
                <h1 className="h3 fw-bold">{title}</h1>
                {subtitle && <p className="text-secondary mt-2">{subtitle}</p>}
                {action && <div className="mt-4">{action}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
