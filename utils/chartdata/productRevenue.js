export function getTotalRevenueByProduct(initialData) {
    const totalEarnedByProduct = {};
    initialData.forEach(item => {
        if(!item.product) return;
        const product = item.product.description;
        if (!totalEarnedByProduct[product]) {
            totalEarnedByProduct[product] = 0;
        }
        totalEarnedByProduct[product] += item.total_paid;
    });

    const sortedProducts = Object.entries(totalEarnedByProduct)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([product, Earned]) => ({ product, Earned }));

    return sortedProducts.map(item => ({...item, ignore: 0, ignore2: 0}));
}
