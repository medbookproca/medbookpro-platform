import Link from 'next/link';
import { Card } from '@medbookpro/ui';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';
import { logDiagnostic } from '@/lib/observability';
import { archiveDocumentAction, restoreDocumentAction } from './actions';
import { DocumentMetadataForm } from './document-metadata-form';

export default async function DocumentsPage() {
  const user = await requireAuthenticatedUser('/app/documents');
  const context = await getActiveOrganizationContext(user.id);
  if (!context) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('documents')
    .select(
      'id,title,description,mime_type,file_size_bytes,archived,deleted,created_at',
    )
    .eq('organization_id', context.organizationId)
    .eq('deleted', false)
    .order('created_at', { ascending: false });
  if (error) {
    logDiagnostic('error', 'documents.list.failed', {
      code: error.code,
    });
  }
  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
        <div className="mx-auto max-w-6xl">
          <Card>
            <h1 className="text-3xl font-semibold">
              Documents are temporarily unavailable.
            </h1>
            <p className="mt-3 text-slate-600">Please try again shortly.</p>
          </Card>
        </div>
      </main>
    );
  }
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Documents
            </p>
            <h1 className="mt-2 text-4xl font-semibold">Document library</h1>
            <p className="mt-3 text-slate-600">
              Metadata-only foundation. No file is uploaded or stored by this
              workflow.
            </p>
          </div>
          <nav className="flex gap-3 text-sm">
            <Link
              className="text-blue-700 underline"
              href="/app/documents/patients"
            >
              Patients
            </Link>
            <Link
              className="text-blue-700 underline"
              href="/app/documents/encounters"
            >
              Encounters
            </Link>
            <Link
              className="text-blue-700 underline"
              href="/app/documents/categories"
            >
              Categories
            </Link>
            <Link
              className="text-blue-700 underline"
              href="/app/documents/settings"
            >
              Retention
            </Link>
          </nav>
        </div>
        <Card className="mt-8">
          <h2 className="text-xl font-semibold">Placeholder upload workflow</h2>
          <DocumentMetadataForm />
        </Card>
        <div className="mt-8 space-y-4">
          {data?.map((document) => (
            <Card key={document.id}>
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <h2 className="font-semibold">{document.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {document.description ?? 'No description'} ·{' '}
                    {document.mime_type ?? 'No MIME type'} ·{' '}
                    {document.archived ? 'Archived' : 'Active'}
                  </p>
                </div>
                <div className="flex gap-3">
                  <form
                    action={
                      document.archived
                        ? restoreDocumentAction
                        : archiveDocumentAction
                    }
                  >
                    <input
                      type="hidden"
                      name="documentId"
                      value={document.id}
                    />
                    <button
                      className="text-sm font-medium text-blue-700 underline"
                      type="submit"
                    >
                      {document.archived ? 'Restore' : 'Archive'}
                    </button>
                  </form>
                  <Link
                    className="text-sm font-medium text-blue-700 underline"
                    href={`/app/documents/${document.id}`}
                  >
                    Metadata and versions
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
