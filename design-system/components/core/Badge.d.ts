/** Status badge (uppercase pixel label, soft tint) and toggleable delegation Chip (square dot). */
export interface BadgeProps {
  /** @default 'neutral' */
  tone?: 'danger' | 'warn' | 'success' | 'info' | 'gold' | 'arcane' | 'neutral';
  children?: React.ReactNode;
}
export declare function Badge(props: BadgeProps): JSX.Element;
export interface ChipProps {
  tone?: 'danger' | 'warn' | 'success' | 'info' | 'gold' | 'arcane' | 'neutral';
  /** Filled/active state @default false */
  on?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}
export declare function Chip(props: ChipProps): JSX.Element;
