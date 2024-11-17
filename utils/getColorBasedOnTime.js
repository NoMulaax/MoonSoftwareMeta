export function getColorBasedOnTime(date) {
    const now = new Date();
    const difference = date - now; // difference in milliseconds

    if (difference <= 0) {
        // date is now or in the past
        return 'red';
    } else if (difference <= 3600000) { // 1 hour in milliseconds
        // date is within the next hour
        return 'red';
    } else if (difference <= 86400000) { // 1 day in milliseconds
        // date is between 1 hour and 1 day in the future
        return 'orange';
    } else {
        // date is more than 1 day in the future
        return 'green';
    }
}
