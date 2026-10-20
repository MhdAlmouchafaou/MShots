import { create } from 'zustand';

export type SheetAction = { label: string; icon?: string; destructive?: boolean; onPress: () => void };

type Prompt = { title: string; message?: string; placeholder?: string; initial?: string; confirmLabel?: string; multiline?: boolean; onSubmit: (v: string) => void };
type Confirm = { title: string; message?: string; confirmLabel: string; destructive?: boolean; onConfirm: () => void; onCancel?: () => void };

type UIState = {
  sheet: { title?: string; subtitle?: string; actions: SheetAction[] } | null;
  prompt: Prompt | null;
  confirm: Confirm | null;
  toast: { id: number; text: string; tone?: 'ok' | 'error' } | null;
  busy: { text: string; progress?: number } | null;
};

export const useUI = create<UIState>(() => ({ sheet: null, prompt: null, confirm: null, toast: null, busy: null }));

export const toast = (text: string, tone?: 'ok' | 'error') => useUI.setState({ toast: { id: Date.now(), text, tone } });
export const showSheet = (sheet: UIState['sheet']) => useUI.setState({ sheet });
export const showPrompt = (prompt: Prompt) => useUI.setState({ prompt });
export const showConfirm = (confirm: Confirm) => useUI.setState({ confirm });
export const setBusy = (busy: UIState['busy']) => useUI.setState({ busy });
