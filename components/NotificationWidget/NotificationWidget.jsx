'use client'

import {Box, Flex, Paper, Text} from '@mantine/core'
import {timeUntil} from "../../utils/timeUntil";
import {PiQuotesDuotone} from "react-icons/pi";
import Link from "next/link";
import {supabaseClient} from "../../utils/supabaseClient";
import {useState} from "react";

export default function NotificationWidget({id, created_at, title, message, link, subject, read, isInPopover}) {
    const [isRead, setIsRead] = useState(read);

    const handleMarkAsRead = async () => {
        const {error} = await supabaseClient.from('notifications').update({read: true}).eq('id', id)
        setIsRead(true)
        if (error) {
            console.error(error)
        }
    }

    return (<Paper onClick={handleMarkAsRead} component={Link} href={link} radius={6} p="0.8rem" bg={isInPopover ? (isRead ? "dark.8" : "dark.6") : (isRead ? "dark.7" : "dark.6")}>
            <Flex align="start" gap="xs">
                <Paper lh={0} radius={6} p="0.4rem">
                    <PiQuotesDuotone/>
                </Paper>
                <Box w="100%">
                    <Flex w="100%" justify="space-between" align="center" columnGap="0.6rem">
                        <Text maw="10rem" mb={0} fw={600} size="sm" lineClamp={1}>{title}</Text>
                        <Text c="dimmed" size="xs" mb={0}>{timeUntil(new Date(created_at))}</Text>
                    </Flex>
                    <Text mb={0} size="sm"
                          c="dimmed" lineClamp={1}>{message.replaceAll("%subject_username%", subject.username)}</Text>
                </Box>
            </Flex>
        </Paper>

    )
}