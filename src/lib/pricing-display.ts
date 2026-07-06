export interface PriceTableRow {
  label: string;
  deluxe_weekday: number;
  vip_weekday: number;
  deluxe_weekend: number;
  vip_weekend: number;
}

export interface PriceTableSection {
  section: string;
  rows: PriceTableRow[];
}

export const PRICE_TABLE_DISPLAY: PriceTableSection[] = [
  {
    section: '1 ĐÊM',
    rows: [
      { label: '1 đêm', deluxe_weekday: 750_000, vip_weekday: 950_000, deluxe_weekend: 900_000, vip_weekend: 1_100_000 },
    ],
  },
  {
    section: '2 ĐÊM',
    rows: [
      { label: '2 đêm', deluxe_weekday: 1_500_000, vip_weekday: 1_900_000, deluxe_weekend: 1_800_000, vip_weekend: 2_200_000 },
    ],
  },
  {
    section: '3 ĐÊM',
    rows: [
      { label: '3 đêm', deluxe_weekday: 2_250_000, vip_weekday: 2_850_000, deluxe_weekend: 2_700_000, vip_weekend: 3_300_000 },
    ],
  },
  {
    section: '1 TUẦN',
    rows: [
      { label: '7 đêm', deluxe_weekday: 5_250_000, vip_weekday: 6_650_000, deluxe_weekend: 6_300_000, vip_weekend: 7_700_000 },
    ],
  },
];
