/** The sprite scroll signet, optionally with a pixel-font label ("Made by Lore"). */
export interface SignetProps {
  /** Width in px; height is 1.2× (20×24 grid). Use integer multiples of 20. @default 32 */
  size?: number;
  /** Label rendered beside the mark */
  label?: string;
  /** Path to scroll.svg relative to the consuming page @default 'assets/scroll.svg' */
  src?: string;
}
export declare function Signet(props: SignetProps): JSX.Element;
