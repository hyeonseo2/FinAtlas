export const fmtRate = (v?: number | null) => (v == null ? "-" : `${v.toFixed(2)}%`);
export const fmtMoney = (v?: number | null) => (v == null ? "-" : `${Intl.NumberFormat("ko-KR").format(v)}원`);
