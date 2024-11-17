import {Avatar, Flex, Group, Paper, Progress, rem, ScrollArea, Stack, Text} from "@mantine/core";

export default function UnpaidCommissionsTable({data}) {
    return (<Paper mih={rem(360)}>
        <Text fw={600} size="sm">Unpaid commissions</Text>
        {data.length === 0 && <Text mt="1rem" mb="-1.4rem" c="dimmed" size="sm" fw={400}>No data here yet!</Text>}
            <ScrollArea mt="3rem" h={250}>
                <Stack gap="1.4rem">
                    {data.map((commission, index) => (
                        <Group grow wrap="nowrap" key={index} align="center" justify="space-between">
                            <Flex align="center" gap="0.4rem">
                                <Avatar src={commission.clientAvatar} size="1.5rem" radius="xl"/>
                                <Text c="white" lineClamp={1} size="sm">{commission.title}</Text>
                            </Flex>
                            <Progress color={commission.progress > 50 ? "green" : "orange"} w="14rem"
                                      value={commission.progress}/>
                            <Text maw="6rem" c="dark.1" size="sm">${commission.unpaidAmount} unpaid</Text>
                        </Group>))}
                </Stack>
            </ScrollArea>
        </Paper>)
}