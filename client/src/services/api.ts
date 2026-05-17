const API_BASE = '/api';

export async function getPolls() {
  const res = await fetch(`${API_BASE}/polls`);
  return res.json();
}

export async function getPollById(id: string) {
  const res = await fetch(`${API_BASE}/polls/${id}`);
  return res.json();
}

export async function getPollByCode(code: string) {
  const res = await fetch(`${API_BASE}/polls/code/${code}`);
  return res.json();
}

export async function getPollResults(id: string) {
  const res = await fetch(`${API_BASE}/polls/${id}/results`);
  return res.json();
}

export async function createPoll(title: string, options: string[]) {
  const res = await fetch(`${API_BASE}/polls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, options })
  });
  return res.json();
}

export async function closePoll(id: string) {
  const res = await fetch(`${API_BASE}/polls/${id}/close`, { method: 'PATCH' });
  return res.json();
}

export async function deletePoll(id: string) {
  const res = await fetch(`${API_BASE}/polls/${id}`, { method: 'DELETE' });
  return res.json();
}

export async function vote(pollId: string, optionIndex: number, voterName: string) {
  const res = await fetch(`${API_BASE}/polls/${pollId}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ optionIndex, voterName })
  });
  return res.json();
}
