function pluralize(unit, quantity) {
    return quantity === 1 ? unit : `${unit}s`;
}

export function timeUntil(date) {
    const now = new Date();
    let difference = date - now;
    const past = difference < 0;
    difference = Math.abs(difference);

    const seconds = Math.round(difference / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);
    const weeks = Math.round(days / 7);

    if (seconds < 60) {
        return past ? 'a moment ago' : 'in a few seconds';
    } else if (minutes < 60) {
        return past ? `${minutes} ${pluralize('minute', minutes)} ago` : `in ${minutes} ${pluralize('minute', minutes)}`;
    } else if (hours < 24) {
        return past ? `${hours} ${pluralize('hour', hours)} ago` : `in ${hours} ${pluralize('hour', hours)}`;
    } else if (days < 7) {
        return past ? (days === 1 ? 'yesterday' : `${days} ${pluralize('day', days)} ago`) : (days === 1 ? 'tomorrow' : `in ${days} ${pluralize('day', days)}`);
    } else if (weeks < 5) {
        return past ? `${weeks} ${pluralize('week', weeks)} ago` : `in ${weeks} ${pluralize('week', weeks)}`;
    } else {
        const months = Math.round(days / 30);
        const years = Math.round(days / 365);

        if (months < 12) {
            return past ? `${months} ${pluralize('month', months)} ago` : `in ${months} ${pluralize('month', months)}`;
        } else {
            return past ? `${years} ${pluralize('year', years)} ago` : `in ${years} ${pluralize('year', years)}`;
        }
    }
}
