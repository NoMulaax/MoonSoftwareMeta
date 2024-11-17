import {Group, Paper, Text} from "@mantine/core";
import React from "react";

export default function PayTermsBadge({payment_terms}) {
    if (payment_terms === "100_before") return (<Group gap="0.4rem">
        <Paper bg="white.3" p="0.25rem"/>
        <Text c="white.2" size="sm" fw={400}>In full, before</Text>
    </Group>)
    if (payment_terms === "100_after") return (<Group gap="0.4rem">
        <Paper bg="white.3" p="0.25rem"/>
        <Text c="white.2" size="sm" fw={400}>In full, after</Text>
    </Group>)
    if (payment_terms === "50_50") return (<Group gap="0.4rem">
        <Paper bg="white.3" p="0.25rem"/>
        <Text c="white.2" size="sm" fw={400}>50% before, 50% after</Text>
    </Group>)
    if (payment_terms === "25_75") return (<Group gap="0.4rem">
        <Paper bg="white.3" p="0.25rem"/>
        <Text c="white.2" size="sm" fw={400}>25% before, 75% after</Text>
    </Group>)
    if (payment_terms === "custom") return (<Group gap="0.4rem">
        <Paper bg="white.3" p="0.25rem"/>
        <Text c="white.2" size="sm" fw={400}>Other</Text>
    </Group>)

}