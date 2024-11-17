'use client'

import { ActionIcon, Group, Paper, SimpleGrid, Stack, Text, Title, Tooltip } from "@mantine/core";
import Head from "next/head";
import { useEffect, useState } from "react";
import { TbChevronLeft, TbChevronRight } from "react-icons/tb";
import CalendarWidget from "./Calendar/CalendarWidget";
import { daysInMonth } from "../utils/daysInMonth";
import { supabaseClient } from "../utils/supabaseClient";

export default function Calendar() {
    const [date, setDate] = useState(new Date());
    const [commissionsDue, setCommissionsDue] = useState([]);
    const [requestsDue, setRequestsDue] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const startDate = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
            const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString();

            try {
                const { data, error } = await supabaseClient
                    .from('panel_commissions')
                    .select(`
                    id, 
                    title, 
                    deadline, 
                    client ( avatar_url), 
                    requests:panel_requests!panel_requests_commission_fkey ( 
                        id, 
                        description, 
                        deadline,
                        commission ( id )
                        )`)
                    .gte('deadline', startDate)
                    .lt('deadline', endDate)
                    .in('status', ['not_started', 'in_progress'])
                    .in('panel_requests.status', ['not_started', 'in_progress', 'requested']);

                if (error) console.log(error);

                setCommissionsDue(data);

                const requestsWithCommissionAvatar = data.map(commission => commission.requests.map(request => ({
                    ...request, commission_avatar_url: commission.client.avatar_url,
                }))).flat();

                setRequestsDue(requestsWithCommissionAvatar);
            } catch (error) {
                console.error(error);
            }
        };

        fetchData();
    }, [date]);


    function handlePrevMonth() {
        setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1));
    }

    function handleNextMonth() {
        setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1));
    }

    return (<>
        <Head>
            <title>Calendar | Ember</title>
        </Head>
        <Group justify="space-between">
            <Title>{date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</Title>
            <Group mb="1rem" gap="3rem">
                <Stack gap="0.6rem">
                    <Group gap="0.4rem">
                        <Paper w="fit-content" bg="indigo.9" p="0.3rem" radius="50%" />
                        <Text size="sm">Commissions</Text>
                    </Group>
                    <Group gap="0.4rem">
                        <Paper w="fit-content" bg="yellow.9" p="0.3rem" radius="50%" />
                        <Text size="sm">Requests</Text>
                    </Group>
                </Stack>
                <Group>
                    <Tooltip openDelay={300} label="Previous month">
                        <ActionIcon bg="dark.7" onClick={handlePrevMonth}>
                            <TbChevronLeft size="1.2rem" />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip openDelay={300} label="Next month">
                        <ActionIcon bg="dark.7" onClick={handleNextMonth}>
                            <TbChevronRight size="1.2rem" />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Group>
        </Group>

        <SimpleGrid spacing="0.4rem" verticalSpacing="0.4rem" cols={{ base: 1, xs: 3, sm: 3, md: 3, xl: 7 }}>
            {daysInMonth(date).map((dayObj, index) => {
                const { date: dayDate, notInMonth } = dayObj;
                return (<div key={index}>
                    {notInMonth ? (<Paper radius={8} mih="8rem" bg="#404040">
                        <Text mb="1rem" c="dimgray">{dayDate.toLocaleDateString('en-GB', {
                            weekday: 'short', day: 'numeric'
                        })}</Text>
                    </Paper>) : (<CalendarWidget
                        date={dayDate}
                        commissionsDue={commissionsDue.filter(commission => new Date(commission.deadline).toDateString() === dayDate.toDateString())}
                        requestsDue={requestsDue.filter(request => new Date(request.deadline).toDateString() === dayDate.toDateString())}
                    />)}
                </div>);
            })}
        </SimpleGrid>
    </>);
}
