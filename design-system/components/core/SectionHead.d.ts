/** Document section header (serif title + pixel count badge + rule) and StatTile (blackletter numeral tile). */
export interface SectionHeadProps {
  title: string;
  count?: number | string;
  /** Italic note under the rule */
  note?: string;
}
export declare function SectionHead(props: SectionHeadProps): JSX.Element;
export interface StatTileProps {
  value: number | string;
  label: string;
  /** @default 'neutral' */
  tone?: 'neutral' | 'danger' | 'warn' | 'gold' | 'arcane' | 'success';
}
export declare function StatTile(props: StatTileProps): JSX.Element;
