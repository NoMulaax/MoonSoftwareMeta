'use client'

import {
    Alert,
    Avatar,
    Button,
    Center,
    Checkbox,
    Flex,
    Group,
    Loader,
    NumberFormatter,
    Paper,
    SimpleGrid,
    Stack,
    Text
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import parse from 'html-react-parser';
import Image from "next/image";
import { useState } from "react";
import { timeUntil } from "../utils/timeUntil";
import PayTermsBadge from "./PayTermsBadge/PayTermsBadge";
import Confetti from "./reusable/Confetti";

export default function QuotePage({ quote, settings }) {
    const [tosAccepted, setTosAccepted] = useState(false)
    const [acceptLoading, setAcceptLoading] = useState(false)
    const [rejectLoading, setRejectLoading] = useState(false)
    const [confetti, setConfetti] = useState(false)
    const [status, setStatus] = useState(quote.status)

    const handleRejectQuote = () => {
        fetch('/api/quote/reject', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                panelId: quote.panel_id,
                client: quote.client.id,
                quoteId: quote.id,
            }),
        })
            .then(response => response.json().then(data => ({ ok: response.ok, data })))
            .then(({ ok, data }) => {
                if (!ok) {
                    throw new Error(data.error);
                }

                setRejectLoading(true);
                setTimeout(() => {
                    notifications.show({
                        title: 'Success',
                        message: data.message,
                        color: 'green',
                    });
                    setRejectLoading(false)
                    setStatus("rejected")
                }, 600)
            })
            .catch((error) => {
                notifications.show({
                    title: 'Error',
                    message: error.message,
                    color: 'red',
                });
            });
    }

    const handleAcceptQuote = () => {
        fetch('/api/quote/accept', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                quoteId: quote.id,
                acceptedTos: tosAccepted,
                title: quote.title,
                client: quote.client,
                deadline: quote.deadline,
                proposedAmount: quote.proposed_amount,
                panelId: quote.panel_id,

            }),
        })
            .then(response => response.json().then(data => ({ ok: response.ok, data })))
            .then(({ ok, data }) => {
                if (!ok) {
                    throw new Error(data.error);
                }

                setAcceptLoading(true);
                setTimeout(() => {
                    notifications.show({
                        title: 'Success',
                        message: data.message,
                        color: 'green',
                    });
                    setConfetti(true)
                    setAcceptLoading(false)
                    setStatus("accepted")
                }, 600)
            })
            .catch((error) => {
                const errorMessage = error.message;
                console.error('Error:', errorMessage);
                notifications.show({
                    title: 'Error',
                    message: errorMessage,
                    color: 'red',
                });
            });
    };

    return (<>
        <Center my="3%">
            {confetti && <Confetti />}
            <Paper w="50rem" className="threeDimensionalShadow">
                {status !== "pending" ? <Alert color={status === "accepted" ? 'green' : 'red'} mb="1rem" p="0.8rem">
                    This quote has been {status === "accepted" ? 'accepted' : 'rejected'}
                </Alert>
                    : <Alert bg="yellow" mb="1rem" p="0.8rem">
                        <Group gap="0.8rem">
                            <Loader type="oval" color="white" />
                            <Text size="sm">Review this quote from {settings.display_name} and either accept or reject
                                it below</Text>
                        </Group>
                    </Alert>}
                <Flex wrap="wrap" align="center" justify="space-between">
                    <Image src="/logo.svg" alt="Logo" width={44} height={44} />
                    <Group>
                        <Text size="sm">Quote #{quote.id} for {quote.client.username}</Text>
                        <Avatar size="sm" src={quote.client.avatar_url} alt="Avatar" radius="xl" />
                    </Group>
                </Flex>

                <SimpleGrid
                    my="2rem"
                    cols={{ base: 1, xs: 2, sm: 3, md: 3 }}
                    spacing={{ base: 10, sm: 'md' }}
                    verticalSpacing={{ base: 'md', sm: 'md' }}
                >
                    <Stack gap="0.2rem">
                        <Text fw={600} c="white">Title</Text>
                        <Text lineClamp={4} c="dimmed">{quote.title}</Text>
                    </Stack>
                    <Stack gap="0.2rem">
                        <Text fw={600} c="white">Start date</Text>
                        <Text c="dimmed">{new Date(quote.start_date).toLocaleDateString('en-GB')}</Text>
                    </Stack>
                    <Stack gap="0.2rem">
                        <Text fw={600} c="white">Deadline</Text>
                        <Text c="dimmed">{timeUntil(new Date(quote.deadline))}</Text>
                    </Stack>
                    <Stack gap="0.2rem">
                        <Text fw={600} c="white">Proposed price</Text>
                        <Text c="dimmed"><NumberFormatter prefix={settings.settings?.currency_prefix || '$'} 
                            value={quote.proposed_amount} /></Text>
                    </Stack>
                    <Stack gap="0.2rem">
                        <Text fw={600} c="white">Payment terms</Text>
                        <PayTermsBadge payment_terms={quote.payment_terms} />
                    </Stack>
                </SimpleGrid>

                <Text fw={600} c="white">Terms and conditions of this commission</Text>
                <Text c="dimmed">By accepting this quote, you accept that the commission has started, therefore you
                    adhere to these terms and conditions.</Text>
                <Paper px="1rem" py="0.4rem" my="1rem" bg="dark.7">
                    {settings.terms && parse(settings.terms)}
                </Paper>
                {status === "pending" && <>
                    <Checkbox color="gray.7" label="I have read and accept these terms and conditions"
                        checked={tosAccepted} onChange={() => setTosAccepted(!tosAccepted)} />
                    <Text mt="1rem" fw={400}>Please accept or reject the quote using the buttons below</Text>
                </>}
                {(status === "pending" || quote.status === "pending") && <Group mt="0.4rem" justify="space-between">
                    <Button loaderProps={{ color: "white" }} loading={rejectLoading}
                        c="white"
                        color="dark.7" onClick={handleRejectQuote}>Reject</Button>
                    <Button loaderProps={{ color: "white" }} loading={acceptLoading}
                        c="white"
                        color="primary.4" onClick={handleAcceptQuote}>Accept</Button>
                </Group>}
            </Paper>
        </Center>
    </>)
}
