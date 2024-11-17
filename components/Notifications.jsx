'use client'

import { Center, Stack, Text, Title } from "@mantine/core";
import Head from "next/head";
import { useEffect, useState } from "react";
import { TbInbox } from "react-icons/tb";
import NotificationWidget from "./NotificationWidget/NotificationWidget";
import { useEmberUser } from "../hooks/useEmberUser";
import { supabaseClient } from "../utils/supabaseClient";

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([])
    const user = useEmberUser().userData;

    useEffect(() => {
        async function fetchNotifications() {
            if (user) {
                const {
                    data,
                    error
                } = await supabaseClient.from('notifications').select('id, created_at, panel_id, title, message, link, subject ( username ), read').eq('panel_id', user.id).order('created_at', { ascending: false })
                if (!error) {
                    setNotifications(data)
                }
            }
        }

        if (notifications.length === 0) {
            fetchNotifications();
        }
    }, [user])


    return (
        <>
            <Head>
                <title>Notifications | Ember</title>
            </Head>
            <Title>Notifications</Title>
            <Stack gap="0.4rem" maw="30rem">
                {notifications.length > 0 ? (
                    notifications.map((notification) => {
                        return (
                            <NotificationWidget
                                isInPopover
                                handleRefreshRead={(id) => {
                                    setNotifications(notifications.map((item) => {
                                        if (item.id === id) {
                                            item.read = true
                                        }
                                        return item
                                    }))
                                }}
                                key={notification.id}
                                {...notification}
                            >
                                {notification.message}
                            </NotificationWidget>
                        )
                    })
                ) : (
                    <Center my="7rem">
                        <Stack align="center">
                            <TbInbox size="1.4rem" stroke="#858585" />
                            <Text mb={0} className="grey2">No notifications!</Text>
                        </Stack>
                    </Center>
                )}
            </Stack>
        </>
    )
}
