export const fmtRate = (v) => (v == null ? "-" : `${v.toFixed(2)}%`);
export const fmtMoney = (v) => (v == null ? "-" : `${Intl.NumberFormat("ko-KR").format(v)}원`);
