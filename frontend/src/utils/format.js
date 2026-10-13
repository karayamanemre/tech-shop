export const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(n));
export const date=s=>new Date(s).toLocaleDateString('tr-TR');
