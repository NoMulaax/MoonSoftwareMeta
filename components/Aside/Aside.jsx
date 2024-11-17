'use client'

import {Avatar, Box, Group, Paper, Stack, Text} from "@mantine/core";
import {PiNewspaperClippingDuotone} from "react-icons/pi";
import classes from "./Aside.module.css";
import {useAllClients} from "../../hooks/useAllClients";
import Link from "next/link";
import {useEffect, useState} from "react";
import {supabaseClient} from "../../utils/supabaseClient";
import {timeUntil} from "../../utils/timeUntil";
import {getColorBasedOnTime} from "../../utils/getColorBasedOnTime";

export default function Aside() {
    const clients = useAllClients([]);
    const [commissionDue, setCommissionDue] = useState(null);
    const [requestsDue, setRequestsDue] = useState(null);

    useEffect(()=>{
        async function fetchData() {
            const {data: commissions, error: commissionsError} = await supabaseClient
                .from('panel_commissions')
                .select('id, title, deadline')
                .neq('status', 'completed')
                .neq('status', 'cancelled')
                .order('deadline', {ascending: true})
                .limit(4)
            if (commissionsError) console.log(commissionsError);
            else setCommissionDue(commissions);

            const {data: requests, error: requestsError} = await supabaseClient
                .from('panel_requests')
                .select('id, description, deadline, commission ( client ( id ) )')
                .neq('status', 'completed')
                .neq('status', 'cancelled')
                .neq('status', 'paused')
                .neq('status', 'rejected')
                .order('deadline', {ascending: true})
                .limit(4)
            if (requestsError) console.log(requestsError);
            else setRequestsDue(requests);
        }

        fetchData();
    }, [])


    return (
        <>
            <Box mb="2.6rem">
                <Text c="white" size="sm" fw={600} mb="1.2rem">Commissions due</Text>
                {commissionDue?.length === 0 && <Text c="dimmed" size="sm" fw={400} mb="1.2rem">You have no commissions due</Text>}
                <Stack gap="1rem">
                    {commissionDue?.map((commission) => (
                        <Group key={commission.id} component={Link} href={"/commissions?page=1&sort=deadline&descending=false&search=" + commission.id} className={classes.due_commissions}>
                            <Paper lh="0" p="0.4rem" bg="white.2">
                                <PiNewspaperClippingDuotone color="black" size="1.2rem"/>
                            </Paper>
                            <div>
                                <Text maw="12rem" lineClamp={1} fw={400} size="sm" c="white">{commission.title}</Text>
                                <Text c={getColorBasedOnTime(new Date(commission.deadline))} size="xs">due {timeUntil(new Date(commission.deadline))}</Text>
                            </div>
                        </Group>
                    ))}

                </Stack>
            </Box>

            <Box mb="2.6rem">
                <Text c="white" size="sm" fw={600} mb="1.2rem">Open change requests</Text>
                {requestsDue?.length === 0 && <Text c="dimmed" size="sm" fw={400} mb="1.2rem">You have no requests</Text>}
                <Stack gap="1rem">
                    {requestsDue?.map((request) => {
                        const client = clients?.find((client) => client.id === request.commission.client.id);
                        return(
                            <Group key={request.id} component={Link} href={"/requests?page=1&sort=deadline&descending=false&search=" + request?.id } className={classes.due_commissions}>
                                <Avatar
                                    src={client?.avatar_url}
                                    size="2.1rem"/>
                                <div>
                                    <Text maw="11rem" lineClamp={1} fw={400} size="sm" c="white">{request.description}</Text>
                                    <Text c={getColorBasedOnTime(new Date(request.deadline))} size="xs">due {timeUntil(new Date(request.deadline))}</Text>
                                </div>
                            </Group>
                        )
                    })}
                </Stack>
            </Box>

            <Box>
                <Text c="white" size="sm" fw={600} mb="1.2rem">Your clients</Text>
                <Stack gap="0.6rem">
                    {clients?.length === 0 && <Text c="dimmed" size="sm" fw={400} mb="1.2rem">You have no clients yet</Text>}
                    {clients && clients.slice(0, 5).map((client) => (
                        <Group component={Link} href={"/clients?page=1&sort=username&descending=false&search=" + client.id} key={client.id}>
                            <Avatar
                                src={client.avatar_url}
                                size="2.1rem"/>
                            <Text lineClamp={1} fw={400} size="sm" c="white">{client.username}</Text>
                        </Group>
                    ))}

                </Stack>
            </Box>
        </>
    )
}