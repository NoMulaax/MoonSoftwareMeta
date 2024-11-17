export function getWeekData(initialData) {
    const getStartOfWeek = (date) => {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - start.getDay());
        return start;
    };

    const addDays = (date, days) => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    };

    const currentDate = new Date();
    const currentWeekStart = getStartOfWeek(currentDate);
    const previousWeekStart = addDays(currentWeekStart, -7);

    const revenueData = Array.from({ length: 7 }, (_, i) => ({
        date: addDays(currentWeekStart, i).toLocaleString('en-GB', { weekday: 'short' }),
        'current week': 0,
        'previous week': 0
    }));

    initialData.forEach(item => {
        const createdDate = new Date(item.created_at);
        const totalPaid = item.total_value;

        if (createdDate >= currentWeekStart && createdDate < addDays(currentWeekStart, 7)) {
            const dayIndex = createdDate.getDay();
            revenueData[dayIndex]['current week'] += totalPaid;
        } else if (createdDate >= previousWeekStart && createdDate < currentWeekStart) {
            const dayIndex = createdDate.getDay();
            revenueData[dayIndex]['previous week'] += totalPaid;
        }
    });

    return revenueData;
}
