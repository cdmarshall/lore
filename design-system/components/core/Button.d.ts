/** Dithered-fantasy pixel button. Press physically "sits down" (hard shadow collapses). */
export interface ButtonProps {
  /** Visual variant @default 'primary' */
  variant?: 'primary' | 'secondary' | 'gold' | 'arcane' | 'ghost';
  /** @default 'md' */
  size?: 'sm' | 'md';
  disabled?: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
}
export declare function Button(props: ButtonProps): JSX.Element;
