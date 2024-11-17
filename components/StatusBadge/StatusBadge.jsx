import { Group, Loader, Paper, Text } from "@mantine/core";
import React from "react";
import { PiCheckBold } from "react-icons/pi";

export default function StatusBadge({ status }) {
    if (status === "Overdue") return (<Group gap="0.4rem">
        <Paper bg="red.7" p="0.25rem" />
        <Text c="red.7" size="sm" fw={400}>Overdue</Text>
    </Group>)
    if (status === "unpaid") return (<Group gap="0.4rem">
        <Paper bg="red" p="0.25rem" />
        <Text c="red" size="sm" fw={400}>Unpaid</Text>
    </Group>)
    if (status === "paid") return (<Group gap="0.4rem">
        <Paper bg="green" p="0.25rem" />
        <Text c="green" size="sm" fw={400}>Paid</Text>
    </Group>)
    if (status === "not_started") return (<Group gap="0.4rem">
        <Paper bg="grey" p="0.25rem" />
        <Text c="gray.5" size="sm" fw={400}>Not started</Text>
    </Group>)
    if (status === "in_progress") return (<Group gap="0.4rem">
        <Paper bg="blue" p="0.25rem" />
        <Text c="blue.1" size="sm" fw={400}>In progress</Text>
    </Group>)
    if (status === "completed") return (<Group gap="0.4rem">
        <Paper bg="green" p="0.25rem" />
        <Text c="green.2" size="sm" fw={400}>Completed</Text>
    </Group>)
    if (status === "cancelled") return (<Group gap="0.4rem">
        <Paper bg="red" p="0.25rem" />
        <Text c="red" size="sm" fw={400}>Cancelled</Text>
    </Group>)
    if (status === "paused") return (<Group gap="0.4rem">
        <Paper bg="orange" p="0.25rem" />
        <Text c="orange.2" size="sm" fw={400}>Paused</Text>
    </Group>)
    if (status === "requested") return (<Group gap="0.4rem">
        <Paper bg="orange" p="0.25rem" />
        <Text c="orange.2" size="sm" fw={400}>Requested</Text>
    </Group>)
    if (status === "pending") return (<Group gap="0.4rem">
        <Loader type="oval" size="0.8rem" color="orange" />
        <Text c="orange.2" size="sm" fw={400}>Pending</Text>
    </Group>)
    if (status === "accepted") return (<Group gap="0.4rem">
        <PiCheckBold color="lightgreen" />
        <Text c="green" size="sm" fw={400}>Accepted</Text>
    </Group>)
    if (status === "rejected") return (<Group gap="0.4rem">
        <Paper bg="red.7" p="0.25rem" />
        <Text c="red.7" size="sm" fw={400}>Rejected</Text>
    </Group>)
}