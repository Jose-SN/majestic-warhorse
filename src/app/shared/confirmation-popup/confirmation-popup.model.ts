export type ConfirmationPopupType = 'alert' | 'confirm';

export interface IConfirmationPopupConfig {
  title?: string;
  message: string;
  type: ConfirmationPopupType;
  confirmText?: string;
  cancelText?: string;
}
