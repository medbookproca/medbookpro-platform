export function startWorker(): { service: string; status: string } { return { service: 'medbookpro-worker', status: 'ready' }; }
console.log(JSON.stringify(startWorker()));
