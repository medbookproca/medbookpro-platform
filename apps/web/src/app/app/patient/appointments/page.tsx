import { Card } from '@medbookpro/ui';
import { requirePatientPortalAccount } from '@/lib/patient-portal';
import { createClient } from '@/lib/supabase/server';
import { cancelRequestAction } from '../actions';

export default async function PatientAppointmentsPage() {
  await requirePatientPortalAccount('/app/patient/appointments');
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_patient_appointments', {});
  if (error) throw error;
  const appointments = (data ?? []) as Array<{ id: string; scheduledStart?: string; status?: string; appointmentType?: string }>;
  return <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950"><div className="mx-auto max-w-3xl"><h1 className="text-4xl font-semibold">Appointments</h1><p className="mt-3 text-slate-600">Appointment requests and your scheduled visits.</p><div className="mt-8 space-y-4">{appointments.length ? appointments.map((appointment) => <Card key={appointment.id}><p className="font-semibold">{appointment.scheduledStart ?? 'Pending time'}</p><p className="mt-1 text-sm text-slate-600">{appointment.appointmentType ?? 'Appointment'} · {appointment.status}</p><form action={cancelRequestAction} className="mt-4"><input type="hidden" name="appointmentId" value={appointment.id} /><button className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700" type="submit">Cancel request</button></form></Card>) : <Card><p>No appointments or requests are available.</p></Card>}</div></div></main>;
}
