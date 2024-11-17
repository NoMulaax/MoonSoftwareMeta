import {Paper, Text} from "@mantine/core";
import {BarChart} from "@mantine/charts";

export default function ProductRevenueChart({data, currencyPrefix}) {
    return (
        <Paper>
            <Text mb="1rem" fw={600} size="sm">Revenue by product</Text>
            <BarChart
                h={240}
                data={data}
                dataKey="product"
                tooltipAnimationDuration={200}
                valueFormatter={(value) => currencyPrefix + new Intl.NumberFormat('en-US').format(value)}
                series={[
                    {name: '', color: 'violet.6'},
                    {name: 'Earned', color: 'violet.6'},
                    {name: '', color: 'violet.6'},
                ]}
                tickLine="xy"
                gridAxis="x"
            />
        </Paper>
    )
}