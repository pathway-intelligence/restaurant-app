import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page page-detail">
      <div className="page-head">
        <Link className="back-link" href="/invoices">
          ← Invoices
        </Link>
        <h1 className="title">Not found</h1>
      </div>
    </div>
  );
}
