import Link from 'next/link';

const links = [['Dashboard', '/app/reports/dashboard'], ['Revenue', '/app/reports/revenue'], ['Patients', '/app/reports/patients'], ['Appointments', '/app/reports/appointments'], ['Communications', '/app/reports/communications'], ['Clinical', '/app/reports/clinical']];
export function ReportNav() { return <nav aria-label="Reports" className="mt-6 flex flex-wrap gap-3">{links.map(([label, href]) => <Link className="rounded border bg-white px-3 py-2 text-sm font-semibold text-blue-700" href={href} key={href}>{label}</Link>)}</nav>; }
