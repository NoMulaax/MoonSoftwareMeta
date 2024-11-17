import {PieChart} from '@mantine/charts';
import {Flex, Group, Paper, Stack, Text} from "@mantine/core";
import classes from "./PopularProducts.module.css";

export default function PopularProducts({data}) {
    return (<Paper>
        <Text mb="1rem" fw={600} size="sm">Popular products</Text>
        {data.length === 0 && <Text mb="-1.4rem" c="dimmed" size="sm" fw={400}>No data here yet!</Text>}
        <Flex className={classes.container} align="center" gap="2rem">
            <PieChart data={data}
                      strokeWidth={0}
                      withLabelsLine labelsPosition="outside" withLabels
                      withTooltip
                      tooltipDataSource="segment"
            />

            <Stack className={classes.details} w="100%">
                {data.map((item, index) => (<Group key={index} w="100%" justify="space-between">
                    <Group gap="0.4rem">
                        <Paper bg={item.color} p="0.3rem"/>
                        <Text size="sm">{item.name}</Text>
                    </Group>
                    <Text c="dimmed" size="sm">{item.value} completed</Text>
                </Group>))}
            </Stack>
        </Flex>
    </Paper>)
}