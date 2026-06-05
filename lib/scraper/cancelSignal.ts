// ملف بسيط لإدارة إشارات الإلغاء بين الـ API والسكرابر
export const cancelSignals = new Map<string, boolean>();

export function shouldCancel(jobId: string): boolean {
    return cancelSignals.get(jobId) === true;
}

export function setCancel(jobId: string) {
    cancelSignals.set(jobId, true);
}

export function clearCancel(jobId: string) {
    cancelSignals.delete(jobId);
}
