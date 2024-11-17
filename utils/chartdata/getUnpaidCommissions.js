export function getUnpaidCommissions(commissions, limit = 5) {
    return commissions
        .filter(commission => commission.total_value > commission.total_paid)
        .slice(0, limit)
        .map(commission => {
            const unpaidAmount = commission.total_value - commission.total_paid;
            const progressPercentage = (commission.total_paid / commission.total_value) * 100;

            return {
                title: commission.title,
                progress: progressPercentage,
                unpaidAmount: unpaidAmount,
                clientAvatar: commission.client.avatar_url,
            };
        });
}
