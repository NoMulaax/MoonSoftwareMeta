import {Paper, Text} from "@mantine/core";
import {BarChart} from "@mantine/charts";

export default function WeeklyRevenueChart({data, currencyPrefix}) {
    return (
        <Paper mt="1.5rem">
            <Text mb="3rem" fw={600} size="sm">Monthly revenue</Text>

            <BarChart
                h={240}
                data={data}
                dataKey="product"
                tooltipAnimationDuration={200}
                valueFormatter={(value) => currencyPrefix + new Intl.NumberFormat('en-US').format(value)}
                series={[
                    {name: '', color: 'violet.6'},
                    {name: 'Revenue', color: 'orange.3'},
                    {name: '', color: 'violet.6'},
                ]}
                tickLine="xy"
                gridAxis="x"
            />
        </Paper>
    )
}