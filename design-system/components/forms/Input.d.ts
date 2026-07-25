/** Form primitives: square Input with pixel label, Checkbox with ink check, dither-edged ProgressBar. */
export interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: any) => void;
}
export declare function Input(props: InputProps): JSX.Element;
export interface CheckboxProps {
  label?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}
export declare function Checkbox(props: CheckboxProps): JSX.Element;
export interface ProgressBarProps {
  /** 0–100 */
  value?: number;
  /** @default 'gold' */
  tone?: 'gold' | 'ink' | 'arcane';
}
export declare function ProgressBar(props: ProgressBarProps): JSX.Element;
