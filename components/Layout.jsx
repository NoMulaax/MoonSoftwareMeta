'use client'

import { useDisclosure } from '@mantine/hooks';
import { Anchor, AppShell, Box, Center, Flex, Group, Paper, Popover, ScrollArea, Stack, Text, Tooltip, } from '@mantine/core';
import Sidebar from "./Sidebar/Sidebar";
import Aside from "./Aside/Aside";
import { PiBellDuotone, PiSidebarDuotone } from "react-icons/pi";
import { usePageTitle } from "../hooks/usePageTitle";
import { useEmberUser } from "../hooks/useEmberUser";
import { usePathname, useRouter } from "next/navigation";
import { IoLogoDiscord } from "react-icons/io5";
import { supabaseClient } from "../utils/supabaseClient";
import { notifications as mantineNotifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import { TbInbox, TbTrash } from "react-icons/tb";
import Link from "next/link";
import NotificationWidget from "./NotificationWidget/NotificationWidget";

export default function Layout({ children }) {
    const [notifications, setNotifications] = useState([])
    const user = useEmberUser().userData;
    const pathname = usePathname();
    const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
    const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
    const title = usePageTitle();
    const minimalRoutes = ['/', '/login', '/quote/[quoteId]', '/track/[trackingId]']

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

    const handleClearNotifs = async () => {
        if (user) {
            const { error } = await supabaseClient.from('notifications').delete().eq('panel_id', user.id)
            if (error) {
                mantineNotifications.show({
                    color: "red",
                    title: 'Error',
                    message: 'There was an error clearing your notifications. Please try again.',
                })
            } else {
                mantineNotifications.show({
                    color: "green",
                    title: 'Success',
                    message: 'Your notifications have been cleared',
                })
                setNotifications([])
            }
        }
    }

    if (!minimalRoutes.includes(pathname)) {
        return (
            <AppShell
                layout="alt"
                withBorder={false}
                header={{ height: 58 }}
                navbar={{
                    width: 300,
                    breakpoint: 'sm',
                    collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
                }}
                aside={{
                    width: 300,
                    breakpoint: 'md',
                    collapsed: { mobile: true, desktop: !desktopOpened },
                }}
                padding={{ base: "1rem", sm: "2rem" }}
            >
                <AppShell.Navbar p="0" bg="dark.8">
                    <Box className="pointer" pos="absolute" top="1.1rem" left="80%" onClick={toggleMobile}
                        hiddenFrom="sm"
                        size="sm">
                        <PiSidebarDuotone size="1.4rem" color="gray" />
                    </Box>
                    <Box className="pointer" pos="absolute" top="1.1rem" left="15.8rem" onClick={toggleDesktop}
                        visibleFrom="sm" size="sm">
                        <PiSidebarDuotone size="1.4rem" color="gray" />
                    </Box>
                    <Sidebar />
                </AppShell.Navbar>

                <AppShell.Header w={{ base: "auto" }}
                    style={{ borderBottom: "1px solid var(--mantine-color-dark-7)" }}
                    bg="dark.8" py="1rem"
                    pl={{ base: "1rem", sm: "2rem" }}
                    pr={desktopOpened ? { base: "1rem", sm: "calc(300px + 2rem)" } : "2rem"}>
                    <Group>
                        <Group>
                            <Box className="pointer" color="white" onClick={toggleMobile} hiddenFrom="sm">
                                <PiSidebarDuotone size="1.8rem" color="gray" />
                            </Box>
                            <Box className="pointer" lh={0} hidden={desktopOpened} color="white" onClick={toggleDesktop}
                                visibleFrom="sm">
                                <PiSidebarDuotone size="1.8rem" color="gray" />
                            </Box>
                            <Popover shadow="md" width={340} position="bottom-end"
                                transitionProps={{ transition: 'pop', duration: 100 }}>

                                <Popover.Target>
                                    <div style={{ lineHeight: 1 }}>
                                        <PiBellDuotone
                                            aria-label="Notifications"
                                            className={"pointer " + (notifications.length > 0 && notifications.some((item) => item.read === false) ? 'ring' : '')}
                                            size="1.6rem" />
                                    </div>
                                </Popover.Target>

                                <Popover.Dropdown p={6} style={{ border: "none" }} bg="dark.7">
                                    <Stack gap="0.4rem" justify="space-between">
                                        <ScrollArea h="20rem">
                                            <Stack gap="0.4rem">
                                                {notifications.length > 0 ? (
                                                    notifications.map((notification) => {
                                                        return (
                                                            <NotificationWidget
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
                                        </ScrollArea>
                                        <Flex gap="0.4rem">
                                            <Link style={{ flexBasis: "90%" }} href="/notifications">
                                                <Paper radius={6} py="0.6rem">
                                                    <Text size="md" mb={0} align="center">
                                                        See all
                                                    </Text>
                                                </Paper>
                                            </Link>
                                            <Tooltip label="Clear all">
                                                <Paper radius={6} onClick={handleClearNotifs} component={Center}
                                                    className="pointer" style={{ flexGrow: 1 }} py="0.6rem">
                                                    <TbTrash size="1.2rem" />
                                                </Paper>
                                            </Tooltip>
                                        </Flex>
                                    </Stack>
                                </Popover.Dropdown>
                            </Popover>
                            <Tooltip label="Join the Discord">
                                <Anchor lh={1} target="_blank" href="https://discord.gg/buzz"><IoLogoDiscord
                                    color="#fff "
                                    size="1.6rem" /></Anchor>
                            </Tooltip>
                        </Group>
                        <Group justify="space-between">
                            <Text lineClamp={1} miw="8rem" size="sm" c="white">{user?.display_name} / <Text size="sm"
                                span
                                c="dimmed">{title}</Text></Text>
                        </Group>
                    </Group>
                </AppShell.Header>

                <AppShell.Main>
                    {children}
                </AppShell.Main>

                <AppShell.Aside style={{ borderLeft: "1px solid var(--mantine-color-dark-7)" }} bg="dark.8" p="1.8rem">
                    <Aside />
                </AppShell.Aside>
            </AppShell>
        );
    }
    return children
}
