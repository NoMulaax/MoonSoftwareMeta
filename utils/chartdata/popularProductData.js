export function popularProductData(data) {
    const completionCounts = {};

    data.filter(item => item.status === "completed" && item.product).forEach(commission => {
        const productDescription = commission.product.description;
        completionCounts[productDescription] = (completionCounts[productDescription] || 0) + 1;
    });

    const chartData = [];
    const colors = ['cyan', 'cyan.6', 'primary.5', 'indigo.5', 'blue.3'];
    let colorIndex = 0;

    for (const [product, count] of Object.entries(completionCounts)) {
        chartData.push({
            value: count, color: colors[colorIndex % colors.length], name: product
        });
        colorIndex++;
    }
    return chartData;
}
