// Read-only display data for the pricing table UI in AdminHub

export interface PriceRow {
  label: string;
  deluxe_weekday: number;
  vip_weekday: number;
  deluxe_weekend: number;
  vip_weekend: number;
}

export const PRICE_TABLE_DISPLAY: { section: string; rows: PriceRow[] }[] = [
  {
    section: 'Theo giờ (3–4h)',
    rows: [
      { label: '12h–15h / 13h–16h / 16h–19h / 17h–20h', deluxe_weekday: 359000, vip_weekday: 389000, deluxe_weekend: 389000, vip_weekend: 419000 },
    ],
  },
  {
    section: 'Trong ngày',
    rows: [
      { label: '6h – 11h cùng ngày',  deluxe_weekday: 560000, vip_weekday: 640000, deluxe_weekend: 580000, vip_weekend: 660000 },
      { label: '11h – 18h cùng ngày', deluxe_weekday: 640000, vip_weekday: 690000, deluxe_weekend: 670000, vip_weekend: 710000 },
      { label: '12h – 19h cùng ngày', deluxe_weekday: 570000, vip_weekday: 650000, deluxe_weekend: 610000, vip_weekend: 690000 },
      { label: '14h – 24h cùng ngày', deluxe_weekday: 690000, vip_weekday: 750000, deluxe_weekend: 710000, vip_weekend: 770000 },
    ],
  },
  {
    section: 'Qua đêm',
    rows: [
      { label: 'Combo 3 (21h – 11h hôm sau)', deluxe_weekday: 599000, vip_weekday: 660000, deluxe_weekend: 649000, vip_weekend: 710000 },
      { label: 'Combo 4 (14h – 11h hôm sau)', deluxe_weekday: 699000, vip_weekday: 760000, deluxe_weekend: 749000, vip_weekend: 819000 },
    ],
  },
];
