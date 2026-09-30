/*
  Modal holatini sahifa yangilanganda ham saqlash: ochiq/yopiq, qaysi qoralama yoki
  qaysi yozuv tahrirlanayotgani (tahrirda — forma ma'lumoti ham).
*/

export interface ModalSession<F = unknown> {
  mode: 'new' | 'edit';
  draftId?: string | null;
  editingId?: string | null;
  form?: F;
}

const key = (kind: string) => `admin-modal-session:${kind}`;

export function readModalSession<F = unknown>(kind: string): ModalSession<F> | null {
  try {
    const raw = localStorage.getItem(key(kind));
    return raw ? (JSON.parse(raw) as ModalSession<F>) : null;
  } catch {
    return null;
  }
}

export function writeModalSession<F = unknown>(kind: string, session: ModalSession<F>) {
  try {
    localStorage.setItem(key(kind), JSON.stringify(session));
  } catch {}
}

export function clearModalSession(kind: string) {
  try {
    localStorage.removeItem(key(kind));
  } catch {}
}
