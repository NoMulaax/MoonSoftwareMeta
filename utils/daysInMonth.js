export function daysInMonth(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const daysArray = [];

    const firstDayOfMonth = new Date(year, month - 1, 1);
    const lastDayOfMonth = new Date(year, month, 0);

    let prependDays = (firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1);
    for (let i = prependDays; i > 0; i--) {
        const day = new Date(firstDayOfMonth);
        day.setDate(day.getDate() - i);
        daysArray.push({ date: day, notInMonth: true });
    }

    const daysInMonth = lastDayOfMonth.getDate();
    for (let day = 1; day <= daysInMonth; day++) {
        daysArray.push({ date: new Date(year, month - 1, day), notInMonth: false });
    }

    let appendDays = 7 - (lastDayOfMonth.getDay() === 0 ? 7 : lastDayOfMonth.getDay());
    for (let i = 1; i <= appendDays; i++) {
        const day = new Date(lastDayOfMonth);
        day.setDate(day.getDate() + i);
        daysArray.push({ date: day, notInMonth: true });
    }

    return daysArray;
}
