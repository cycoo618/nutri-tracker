// ============================================
// Firestore 连接诊断组件（调试用，上线前移除）
// ============================================

import { useState } from 'react';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { auth } from '../../config/firebase';

interface DiagStep {
  label: string;
  status: 'pending' | 'running' | 'ok' | 'fail';
  detail?: string;
}

export function FirestoreDiag() {
  const [steps, setSteps] = useState<DiagStep[]>([]);
  const [running, setRunning] = useState(false);

  const update = (index: number, patch: Partial<DiagStep>) => {
    setSteps(prev => prev.map((s, i) => i === index ? { ...s, ...patch } : s));
  };

  const run = async () => {
    setRunning(true);
    const initial: DiagStep[] = [
      { label: '检查 Auth 状态', status: 'pending' },
      { label: 'Firestore 写入测试', status: 'pending' },
      { label: 'Firestore 读取测试', status: 'pending' },
      { label: '清理测试文档', status: 'pending' },
    ];
    setSteps(initial);

    // Step 0: Auth
    initial[0].status = 'running';
    setSteps([...initial]);
    await new Promise(r => setTimeout(r, 100));

    const user = auth.currentUser;
    if (!user) {
      update(0, { status: 'fail', detail: '未登录，请先登录' });
      setRunning(false);
      return;
    }
    update(0, { status: 'ok', detail: `uid=${user.uid.slice(0, 8)}...` });

    // Step 1: Write
    update(1, { status: 'running' });
    const testDocRef = doc(db, '_diag_', user.uid);
    try {
      const start = Date.now();
      await Promise.race([
        setDoc(testDocRef, { ts: Date.now(), uid: user.uid }),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error('TIMEOUT_8S')), 8000)),
      ]);
      update(1, { status: 'ok', detail: `${Date.now() - start}ms` });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      update(1, { status: 'fail', detail: msg });
      setRunning(false);
      return;
    }

    // Step 2: Read
    update(2, { status: 'running' });
    try {
      const start = Date.now();
      const snap = await Promise.race([
        getDoc(testDocRef),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error('TIMEOUT_8S')), 8000)),
      ]);
      update(2, { status: 'ok', detail: `exists=${snap.exists()} ${Date.now() - start}ms` });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      update(2, { status: 'fail', detail: msg });
    }

    // Step 3: Cleanup
    update(3, { status: 'running' });
    try {
      await deleteDoc(testDocRef);
      update(3, { status: 'ok' });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      update(3, { status: 'fail', detail: msg });
    }

    setRunning(false);
  };

  const icon = (s: DiagStep['status']) =>
    ({ pending: '○', running: '⟳', ok: '✓', fail: '✗' }[s]);
  const color = (s: DiagStep['status']) =>
    ({ pending: 'text-gray-400', running: 'text-blue-500 animate-pulse', ok: 'text-green-600', fail: 'text-red-600' }[s]);

  return (
    <div className="fixed bottom-4 left-4 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-80 z-50 text-xs">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono font-bold text-gray-700">Firestore 诊断</span>
        <button
          onClick={run}
          disabled={running}
          className="px-3 py-1 bg-blue-600 text-white rounded-lg disabled:opacity-50 text-xs"
        >
          {running ? '运行中...' : '运行诊断'}
        </button>
      </div>

      {steps.length === 0 && (
        <p className="text-gray-400">点击「运行诊断」检查连接</p>
      )}

      <div className="space-y-1.5">
        {steps.map((s, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className={`font-mono mt-0.5 ${color(s.status)}`}>{icon(s.status)}</span>
            <div>
              <div className={color(s.status)}>{s.label}</div>
              {s.detail && (
                <div className="text-gray-500 break-all leading-tight mt-0.5">{s.detail}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
