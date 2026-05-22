export const utils = {
    parseISO(str) { return new Date(str); },
    
    toLocalISOString(date) {
        const pad = n => n < 10 ? '0'+n : n;
        return date.getFullYear() + '-' + pad(date.getMonth()+1) + '-' + pad(date.getDate()) + 'T' + pad(date.getHours()) + ':' + pad(date.getMinutes());
    },

    formatDisplayDate(dateStr) {
        const d = this.parseISO(dateStr);
        const pad = n => n < 10 ? '0'+n : n;
        return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    },

    formatMoney(amount) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    }
};
