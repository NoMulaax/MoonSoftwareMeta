'use client'

import {
    Avatar,
    Button,
    Center,
    Flex,
    Grid,
    Group,
    NumberFormatter,
    NumberInput,
    Paper,
    ScrollArea,
    SimpleGrid,
    Stack,
    Text,
    TextInput,
    Timeline
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { isInRange, useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import axios from 'axios';
import Head from "next/head";
import Image from "next/image";
import React, { useState } from "react";
import { PiClockCountdownBold } from "react-icons/pi";
import { timeUntil } from "../utils/timeUntil";
import StatusBadge from "./StatusBadge/StatusBadge";

export default function TrackingPage({ commission }) {
    const [allRequests, setAllRequests] = useState(commission.requests);
    const requestForm = useForm({
        initialValues: {
            description: '',
            offered_amount: 0,
            deadline: new Date()
        },
        validate: {
            offered_amount: isInRange({ min: 0 }, 'Offered amount must be more than 0!'),
            description: (value) => value.length < 5 ? 'Description must be more than 5 characters!' : null,
        }
    })

    const handleSubmitRequest = async () => {
        if (requestForm.validate().hasErrors) return;

        axios.post('/api/request/insert', {
            tracking_id: commission.tracking_id,
            commission_id: commission.id,
            panel_id: commission.panel_id,
            description: requestForm.values.description,
            offered_amount: requestForm.values.offered_amount,
            deadline: requestForm.values.deadline,
            client_id: commission.client.id,
        })
            .then(response => {
                const data = response.data.data;
                console.log(data)
                notifications.show({
                    title: 'Success',
                    message: 'Your request has been submitted',
                    color: 'green',
                });
                setAllRequests(allRequests => [...allRequests, data]);
                requestForm.reset();
            })
            .catch((error) => {
                console.error('Axios error: ', error);
                const message = error.response && error.response.data && error.response.data.error
                    ? error.response.data.error
                    : "Error when submitting your request! Please contact support.";
                notifications.show({
                    title: 'Error',
                    message,
                    color: 'red',
                });
            });
    }

    return (<>
        <Head>
            <title>Commission #{commission?.id} | Ember</title>
            <meta property="og:title" content={"Commission " + commission.id} />
            <meta property="og:description"
                content="Review this quote and use the buttons below to accept or reject it." />
            <meta name="description"
                content="Review this quote and use the buttons below to accept or reject it." />
        </Head>
        <Center my="3%">
            <Paper pb="2rem" w="55rem" className="threeDimensionalShadow">
                <Flex wrap="wrap" align="center" justify="space-between">
                    <Image src="/logo.svg" alt="Logo" width={44} height={44} />
                    <Group>
                        <Text size="sm">Commission #{commission.id} for {commission.client.username}</Text>
                        <Avatar size="sm" src={commission.client.avatar_url} alt="Avatar" radius="xl" />
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
                        <Text lineClamp={4} c="dimmed">{commission.title}</Text>
                    </Stack>
                    <Stack gap="0.2rem">
                        <Text fw={600} c="white">Start date</Text>
                        <Text
                            c="dimmed">{new Date(commission.start_date).toLocaleDateString('en-GB')}</Text>
                    </Stack>
                    <Stack gap="0.2rem">
                        <Text fw={600} c="white">Deadline</Text>
                        <Text c="dimmed">{timeUntil(new Date(commission.deadline))}</Text>
                    </Stack>
                    <Stack gap="0.2rem">
                        <Text fw={600} c="white">Total value</Text>
                        <Text c="dimmed"><NumberFormatter prefix={commission.settings?.currency_prefix || '$'} 
                            value={commission.total_value} /></Text>
                    </Stack>
                    <Stack gap="0.2rem">
                        <Text fw={600} c="white">Total paid</Text>
                        <Text c="dimmed"><NumberFormatter prefix={commission.settings?.currency_prefix || '$'} 
                            value={commission.total_paid} /></Text>
                    </Stack>
                    <Stack gap="0.2rem">
                        <Text fw={600} c="white">Status</Text>
                        <StatusBadge status={commission.status} />
                    </Stack>
                </SimpleGrid>
                <Grid mt="3rem">
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Text fw={600} c="white">Change requests</Text>
                        <Text mb="2rem" size="sm" c="dimmed">All current change requests for this
                            commission</Text>
                        <ScrollArea h={350}>
                            <Timeline color="primary.5" active={999} bulletSize={16} lineWidth={2}>
                                {allRequests?.map(request => (
                                    <Timeline.Item key={request.id}
                                        bullet={<Paper bg="grey" radius="50%" p="0rem" />}
                                        title={request.description}>
                                        <Text mb="0.2rem" size="xs"
                                            mt={4}
                                            c="dimmed">requested {timeUntil(new Date(request.created_at))}</Text>
                                        <StatusBadge status={request.status} />
                                    </Timeline.Item>
                                ))}
                            </Timeline>
                        </ScrollArea>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Text fw={600} c="white">Request a feature</Text>
                        <Text mb="2rem" size="sm" c="dimmed">Let the freelancer know what you'd like
                            changed, added or removed</Text>
                        <TextInput label="Description"
                            description="Outline what you want changed" {...requestForm.getInputProps('description')}
                            placeholder="e.g. 'Upload new logo to NavBar'" />
                        <Group grow mt="1rem" gap="1rem">
                            <NumberInput min={0} prefix={commission.settings?.currency_prefix || '$'} {...requestForm.getInputProps('offered_amount')}
                                description="Amount you offer to pay"
                                label="Offered amount"
                                placeholder="0"
                                required />
                            <DateTimePicker leftSection={<PiClockCountdownBold size="1.1rem" />}
                                valueFormat="DD MMM YYYY hh:mm A" {...requestForm.getInputProps('deadline')}
                                description="Deadline date for the request"
                                label="Deadline"
                                required />
                        </Group>
                        <Button size="xs" mt="1rem" onClick={handleSubmitRequest}>Submit request</Button>
                    </Grid.Col>
                </Grid>
            </Paper>
        </Center>
    </>)
}
