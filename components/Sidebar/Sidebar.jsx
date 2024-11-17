'use client'

import {
    Avatar,
    Box,
    Collapse,
    Group,
    NumberFormatter,
    Paper,
    rem,
    ScrollArea,
    Skeleton,
    Stack,
    Text,
    UnstyledButton
} from '@mantine/core';
import classes from './Sidebar.module.css';
import { IconChevronRight } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import {
    PiBookBookmarkDuotone,
    PiCalendarBlankDuotone,
    PiGaugeDuotone,
    PiGearDuotone,
    PiNewspaperClippingDuotone,
    PiQuestionDuotone,
    PiQuotesDuotone,
    PiTruckDuotone,
    PiUsersThreeDuotone,
} from "react-icons/pi";
import Link from "next/link";
import { useEmberUser } from "../../hooks/useEmberUser";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { supabaseClient } from "../../utils/supabaseClient";
import { TbEye, TbTrash } from "react-icons/tb";
import { useViews } from "../../hooks/useViews";
import { notifications } from "@mantine/notifications";
import { IconFileInvoice } from '@tabler/icons-react'

const data = [{
    label: 'Overview', icon: PiGaugeDuotone, links: "/overview"
}, {
    label: 'Commissions',
    icon: PiNewspaperClippingDuotone,
    links: [{ label: 'All commissions', link: '/commissions?page=1&sort=deadline&descending=false' }, {
        label: 'Active commissions', link: '/commissions?page=1&sort=deadline&descending=false&status=in_progress'
    }, {
        label: 'Unstarted commissions',
        link: '/commissions?page=1&sort=deadline&descending=false&status=not_started'
    },],
},
{
    icon: IconFileInvoice,
    label: 'Invoices',
    links: '/invoices',
},
{
    label: 'Clients', icon: PiUsersThreeDuotone, links: "/clients?page=1&sort=username&descending=false"
}, {
    label: 'Change requests',
    icon: PiQuestionDuotone,
    links: [{ label: 'All requests', link: '/requests?page=1&sort=deadline&descending=false' }, {
        label: 'Pending requests', link: '/requests?page=1&status=requested&sort=deadline&descending=false'
    }, { label: 'Completed requests', link: '/requests?page=1&status=completed&sort=deadline&descending=false' },],
}, {
    label: 'Quotes',
    icon: PiQuotesDuotone,
    links: [{ label: 'All quotes', link: '/quotes?page=1&sort=start_date&descending=false' }, {
        label: 'Pending quotes', link: '/quotes?filter=pending&page=1&sort=start_date&descending=false'
    }, { label: 'Accepted quotes', link: '/quotes?filter=accepted&page=1&sort=start_date&descending=false' },],
}];


export default function Sidebar() {
    const { viewsData, refreshData } = useViews();
    const [widgetStats, setWidgetStats] = useState({
        value: 0,
        total: 0,
    });
    const user = useEmberUser().userData;

    const viewsLinks = viewsData.map(view => ({
        id: view.id,
        label: view.label,
        link: view.link,
    }));


    const dynamicData = [...data, {
        label: 'Views',
        icon: TbEye,
        links: viewsLinks,
    }];

    const linksComponents = dynamicData.map((item) => <LinksGroup refreshData={refreshData} {...item} key={item.label} />);

    useEffect(() => {
        supabaseClient.from('panel_commissions').select('total_value, status').neq('status', 'completed').neq('status', 'cancelled').then(({ data }) => {
            const total = data.length;
            const value = data.reduce((total, commission) => total + commission.total_value, 0);
            setWidgetStats({ value, total });
        });
    }, []);

    return (<>
        <nav className={classes.navbar}>
            <Link href="/overview">
                {(user && user.logo) ?
                    <Avatar maw="13rem" mb="1rem" radius={0} style={{ objectFit: "cover" }} h="2rem" mah="2rem" w="80%"
                        src={user.logo} alt="Logo" />
                    : <Skeleton mb="1rem" radius={10} mah="2rem" h="2rem" w="80%" />}
            </Link>

            <Paper mt="1rem" mb="1.4rem">
                <Stack gap="0.3rem">
                    <Text c="dimmed" size="sm">Active commission value</Text>
                    <Text size="xl" c="white"><NumberFormatter fixedDecimalScale={2} decimalScale={2} value={widgetStats.value} prefix={user?.settings?.currency_prefix} /></Text>
                    <Text size="xs" c="dark.3">{widgetStats.total} commissions</Text>
                </Stack>
            </Paper>

            <ScrollArea mb="3rem" offsetScrollbars className={classes.links}>
                <Stack gap="0.2rem">
                    <Text ml="1rem" fw={400} size="sm" c="dimmed">Dashboard</Text>
                    {linksComponents}
                    <Text mt="1rem" ml="1rem" fw={400} size="sm" c="dimmed">Tools</Text>
                    <LinksGroup label="Calendar" icon={PiCalendarBlankDuotone} links="/calendar" />
                    <LinksGroup label="Products" icon={PiTruckDuotone} links="/products" />
                    <LinksGroup label="Settings" icon={PiGearDuotone} links="/settings" />
                </Stack>
            </ScrollArea>

        </nav>
        <UserButton />
    </>);
}

function LinksGroup({ newTab, refreshData, label, icon: Icon, links }) {
    const hasLinks = Array.isArray(links);
    const [opened, setOpened] = useState(false);
    const pathname = usePathname();

    const handleDeleteView = async (viewId) => {
        const { error } = await supabaseClient.from('panel_views').delete().eq('id', viewId);
        if (error) {
            notifications.show({
                title: 'Whoops!',
                message: 'An error occurred while deleting the view',
                color: 'red',
            })
        } else {
            notifications.show({
                title: 'Success!',
                message: 'View has been deleted',
                color: 'green',
            })
            refreshData();
        }
    };

    const items = (hasLinks ? links : []).map((link) => (
        <Group wrap="nowrap" key={link.id || link.label} justify="space-between" align="center">
            <Text w="100%" size="sm" component={Link} shallow className={classes.link} href={link.link}>
                {link.label}
            </Text>
            {label === 'Views' && (
                <Box className="pointer" onClick={() => handleDeleteView(link.id)}>
                    <TbTrash />
                </Box>
            )}
        </Group>
    ));

    return (
        <>

            <UnstyledButton target={newTab ? "_blank" : "_self"} component={hasLinks ? Group : Link} shallow href={!hasLinks ? links : null}
                onClick={() => hasLinks && setOpened((o) => !o)}
                className={clsx(classes.control, { [classes.controlActive]: label.toLowerCase().includes(pathname.replace("/", "")) })}>
                <Group ml={hasLinks ? 0 : 20} gap={4}>
                    {hasLinks && <IconChevronRight color="grey" className={classes.chevron} stroke={1.5} style={{
                        width: rem(16), height: rem(16), transform: opened ? 'rotate(90deg)' : 'none',
                    }} />}
                    <Icon style={{ width: rem(18), height: rem(18) }} />
                    <Text size="sm" fw={400} c="white">{label}</Text>
                </Group>
            </UnstyledButton>
            {hasLinks && <Collapse in={opened}>{items}</Collapse>}
        </>
    );
}

function UserButton() {
    const user = useEmberUser();

    return (<UnstyledButton className={classes.user}>
        <Group>
            {!user.userData && <Skeleton circle mt="0.1rem" height={38} />}
            {user.userData && <Avatar
                src={user.userData.avatar_url}
            />}

            <div>
                {!user.userData && <Skeleton mt="0.1rem" width={140} height={12} radius="sm" />}
                <Text maw="13rem" lineClamp={1} size="sm">
                    {user.userData?.display_name ? user.userData.display_name : ""}
                </Text>

                {!user.userData && <Skeleton mt="0.1rem" width={200} height={16} radius="sm" />}
                <Text maw="13rem" lineClamp={1} c="dimmed" size="xs">
                    {user.userData?.email ? user.userData.email.replace(/(.{0})(.*)(.{1}@.*)/, '$1' + '*'.repeat(Math.max(0, user.userData.email.split('@')[0].length - 2)) + '$3') : ""}
                </Text>
            </div>
        </Group>
    </UnstyledButton>);
}