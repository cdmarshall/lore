/** Square-cornered container with hard sprite shadow; optional dithered wash footer. */
export interface PanelProps {
  /** card = 1px rule border; hero = 2px ink; parchment = scroll-flavored; band = flat tint @default 'card' */
  variant?: 'card' | 'hero' | 'parchment' | 'band';
  /** Bottom dither wash */
  wash?: 'ink' | 'gold' | 'arcane';
  children?: React.ReactNode;
}
export declare function Panel(props: PanelProps): JSX.Element;
