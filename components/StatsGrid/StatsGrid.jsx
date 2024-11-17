import {Group, Paper, SimpleGrid, Text} from '@mantine/core';
import {IconArrowDownRight, IconArrowUpRight,} from '@tabler/icons-react';
import classes from './StatsGrid.module.css';
import {PiClockClockwiseDuotone, PiCoinsDuotone, PiMoneyDuotone, PiUsersThreeDuotone} from "react-icons/pi";

const icons = {
    revenue: PiMoneyDuotone,
    total_clients: PiUsersThreeDuotone,
    total_value: PiCoinsDuotone,
    clock: PiClockClockwiseDuotone,
};

const data = [
    {title: 'Revenue', icon: 'revenue', value: '$13,456', diff: "$942"},
    {title: 'Completed this month', icon: 'total_clients', value: '13', diff: "3"},
    {title: 'Avg commission value', icon: 'total_value', value: '$4,145', diff: "$135"},
    {title: 'Avg completion time', icon: 'clock', value: '3d 8h', diff: "3h"},
];

export function StatsGrid() {
    const stats = data.map((stat) => {
        const Icon = icons[stat.icon];
        const DiffIcon = stat.diff > 0 ? IconArrowUpRight : IconArrowDownRight;

        return (
            <Paper withBorder p="md" radius="md" key={stat.title}>
                <Group justify="space-between">
                    <Text size="xs" c="dimmed" className={classes.title}>
                        {stat.title}
                    </Text>
                    <Icon className={classes.icon} size="1.4rem" stroke={1.5}/>
                </Group>

                <Group align="flex-end" gap="xs" mt={25}>
                    <Text className={classes.value}>{stat.value}</Text>
                    <Text c={stat.diff > 0 ? 'teal' : 'red'} fz="sm" fw={500} className={classes.diff}>
                        <span>{stat.diff}</span>
                        <DiffIcon size="1rem" stroke={1.5}/>
                    </Text>
                </Group>

                <Text fz="xs" c="dimmed" mt={7}>
                    Compared to previous month
                </Text>
            </Paper>
        );
    });
    return (
        <div className={classes.root}>
            <SimpleGrid cols={{base: 1, xs: 2, md: 4}}>{stats}</SimpleGrid>
        </div>
    );
}