export function calculateMonthlyRevenue(commissions) {
    const now = new Date();
    const months = Array.from({ length: 12 }, (_, i) => {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        return date.toLocaleString('default', { month: 'short', year: 'numeric' });
    }).reverse();

    const monthlyRevenue = months.reduce((acc, month) => ({ ...acc, [month]: 0 }), {});

    commissions.forEach(commission => {
        const commissionDate = new Date(commission.created_at);
        const formattedDate = commissionDate.toLocaleString('default', { month: 'short', year: 'numeric' });

        if (monthlyRevenue.hasOwnProperty(formattedDate)) {
            monthlyRevenue[formattedDate] += commission.total_paid;
        }
    });

    return Object.entries(monthlyRevenue).map(([month, revenue]) => ({
        product: month,
        Revenue: revenue
    }));
}
