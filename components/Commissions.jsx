'use client'

import {
    ActionIcon,
    Avatar,
    Button,
    Checkbox,
    Flex,
    Group,
    Menu,
    NumberFormatter,
    Pagination,
    Paper,
    rem,
    ScrollArea,
    Stack,
    Switch,
    Table,
    Text,
    TextInput,
    Tooltip
} from '@mantine/core';
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconSearch } from "@tabler/icons-react";
import cx from 'clsx';
import exportFromJSON from 'export-from-json';
import Head from "next/head";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useState } from 'react';
import {
    PiArrowsDownUpBold,
    PiCaretRightBold,
    PiDownloadSimple,
    PiLightningBold,
    PiListFill,
    PiPushPinDuotone,
    PiUserBold,
    PiXBold
} from "react-icons/pi";
import { TbEyePlus, TbFilter } from "react-icons/tb";
import classes from '../styles/pages/Commissions.module.css';
import { formatDateToUKTime } from "../utils/formatDate";
import { getColorBasedOnTime } from "../utils/getColorBasedOnTime";
import { supabaseClient } from "../utils/supabaseClient";
import { timeUntil } from "../utils/timeUntil";
import CreateModal from "./CreateModal/Commissions";
import ManageButton from "./ManageButton/Commission";
import SaveViewModal from "./reusable/SaveViewModal";
import StatusBadge from "./StatusBadge/StatusBadge";

const itemsPerPage = 10;

export default function CommissionsPage({ settings }) {
    return <Suspense fallback={<div>Loading...</div>}>
        <Commissions settings={settings} />
    </Suspense>
}

function Commissions({ settings }) {
    const [selectedRows, setSelectedRows] = useState([]);
    const searchParams = useSearchParams();
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [filteredData, setFilteredData] = useState([]);
    const [allData, setAllData] = useState([]);
    const [scrolled, setScrolled] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [debouncedSearch] = useDebouncedValue(searchValue, 200);
    const [sort, setSort] = useState(searchParams.get('sort') || "deadline");
    const [sortOrder, setSortOrder] = useState(searchParams.get('descending') === 'true' ? 'descending' : 'ascending');
    const [createModalOpened, { toggle: toggleCreateModal }] = useDisclosure(false);
    const [saveViewModal, { toggle: toggleSaveViewModal }] = useDisclosure(false);
    const [filterClient, setFilterClient] = useState(searchParams.get('filter') || '');
    const [filterStatus, setFilterStatus] = useState('');

    const handleDownloadData = () => {
        const itemsToDownload = allData.filter(item => selectedRows.includes(item.id));
        exportFromJSON({ data: itemsToDownload, fileName: "commissions", exportType: exportFromJSON.types.csv })
    }

    useEffect(() => {
        async function fetchData() {
            try {
                const { data, error } = await supabaseClient.from('panel_commissions')
                    .select('id, title, client ( id, username, avatar_url ), total_value, total_paid, start_date, deadline, status, tracking_id, pinned, notes, product ( description, id )')
                    .order(sort, { ascending: sortOrder !== 'descending' });

                if (error) throw error;

                setAllData(data);
            } catch (error) {
                console.log(error)
            }
        }

        fetchData();
    }, []);

    const compareFunction = (a, b) => {
        let comparison = 0;

        switch (sort) {
            case 'deadline':
                comparison = new Date(a.deadline) - new Date(b.deadline);
                break;
            case 'client':
                comparison = a.client.username.localeCompare(b.client.username);
                break;
            case 'total_value':
                comparison = parseInt(b.total_value) - parseInt(a.total_value);
                break;
            case 'total_paid':
                comparison = parseInt(b.total_paid) - parseInt(a.total_paid);
                break;
            case 'status':
                comparison = a.status.localeCompare(b.status);
                break;
            default:
                break;
        }
        return sortOrder === 'ascending' ? comparison : -comparison;
    };


    const filterAndSortData = (data) => {
        const pinnedItems = data.filter(item => item.pinned);
        const unpinnedItems = data.filter(item => !item.pinned);

        const filteredAndSortedUnpinnedItems = unpinnedItems
            .filter(item => {
                return ((item.id.toLowerCase().includes((debouncedSearch || '').toLowerCase()) || item.title.toLowerCase().includes((debouncedSearch || '').toLowerCase()) || item.tracking_id.toLowerCase().includes((debouncedSearch || '').toLowerCase())) && (filterClient === '' || item.client.id === filterClient) && (filterStatus === '' || item.status === filterStatus));
            })
            .sort(compareFunction);

        return [...pinnedItems, ...filteredAndSortedUnpinnedItems];
    };

    useEffect(() => {
        setPage(parseInt(searchParams.get('page') || 1));
        setFilterClient(searchParams.get('filter') || '');
        setFilterStatus(searchParams.get('status') || '');
        setSearchValue(searchParams.get('search') || '')
        setSort(searchParams.get('sort') || 'deadline');
        setSortOrder(searchParams.get('descending') === 'true' ? 'descending' : 'ascending');
    }, [router.query]);


    useEffect(() => {
        const query = { ...router.query };
        if (page) query.page = page;
        if (filterClient) query.filter = filterClient;
        if (filterStatus) query.status = filterStatus;
        if (sort) query.sort = sort;
        query.descending = sortOrder === 'descending';
        if (debouncedSearch) query.search = debouncedSearch;

        if (typeof window !== 'undefined') {
            const queryParams = new URLSearchParams(window.location.search);
            queryParams.set('page', page);
            queryParams.set('filter', filterClient);
            queryParams.set('status', filterStatus);
            queryParams.set('sort', sort);
            queryParams.set('descending', query.descending);
            if (debouncedSearch) queryParams.set('search', debouncedSearch);

            const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
            if (window.location.search !== `?{queryParams.toString()}`) {
                window.history.replaceState(null, '', newUrl);
            }
        }
    }, [page, filterClient, filterStatus, sort, sortOrder, debouncedSearch]);

    useEffect(() => {
        const filteredAndSortedData = filterAndSortData(allData);
        setFilteredData(filteredAndSortedData.slice((page - 1) * itemsPerPage, page * itemsPerPage));
        setTotalPages(Math.ceil(filteredAndSortedData.length / itemsPerPage));
    }, [allData, page, itemsPerPage, debouncedSearch, sort, sortOrder, filterClient, filterStatus]);

    const toggleSortOrder = () => {
        setSortOrder(sortOrder === 'ascending' ? 'descending' : 'ascending');
    };

    const handleFilterChange = (type, value) => {
        if (type === 'client') {
            setFilterClient(value);
        } else if (type === 'status') {
            setFilterStatus(value);
        }
    };

    const handleCopyCommissionId = (id) => {
        navigator.clipboard.writeText(id);
        notifications.show({
            title: 'Done!', message: 'Commission ID copied to clipboard', color: 'green',
        })
    }

    const handleClearFilters = () => {
        setSearchValue('');
        setFilterClient('');
        setFilterStatus('');
        if (typeof window !== 'undefined') {
            const queryParams = new URLSearchParams(window.location.search);
            queryParams.delete('search');
            queryParams.delete('filter');
            queryParams.delete('status');
            queryParams.set('sort', 'deadline');
            queryParams.set('descending', 'false');

            const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
            window.history.replaceState(null, '', newUrl);
        }
    }

    const handleUpdate = (payload) => {
        const newData = [payload, ...filteredData];
        setAllData(newData);
    };

    const handleStatusRefresh = (id, status) => {
        const index = filteredData.findIndex(item => item.id === id);
        if (index !== -1) {
            const newData = [...filteredData];
            newData[index].status = status;
            setAllData(newData);
        }
    };

    const handlePinRefresh = (id, pinned) => {
        handleEditRefresh(id, { pinned: pinned });
    };

    const handlePaidRefresh = async (id, total_paid_percentage) => {
        const index = filteredData.findIndex(item => item.id === id);
        if (index !== -1) {
            const newData = [...filteredData];
            const item = newData[index];
            newData[index].total_paid = (item.total_value * total_paid_percentage) / 100;
            setAllData(newData);

            const { error } = await supabaseClient.from('panel_commissions').update({
                total_paid: newData[index].total_paid
            }).eq('id', id);
            if (error) {
                notifications.show({
                    title: 'Error!', message: 'Error when updating row in database', color: 'red',
                });
            }
        }
    };

    const handleDeleteRefresh = (id) => {
        const newData = filteredData.filter(item => item.id !== id);
        setFilteredData(newData);
    };

    const handleEditRefresh = (id, payload) => {
        setAllData(currentData => {
            const index = currentData.findIndex(item => item.id === id);
            if (index !== -1) {
                const updatedData = [...currentData];
                updatedData[index] = { ...updatedData[index], ...payload };
                return updatedData;
            }
            return currentData;
        });
    };

    const rows = filteredData.map((row) => (<Table.Tr bg={row.pinned ? "dark.7" : "transparent"} key={row.id}>
        <Table.Td maw="8rem" fz="xs" c="white">
            <Group gap="0.4rem" wrap="nowrap">
                <Checkbox
                    checked={selectedRows.includes(row.id)}
                    onChange={(event) => {
                        if (event.currentTarget.checked) {
                            setSelectedRows([...selectedRows, row.id]);
                        } else {
                            setSelectedRows(selectedRows.filter(item => item !== row.id));
                        }
                    }}
                />
                <Paper maw="4rem" className="pointer" onClick={() => handleCopyCommissionId(row.id)} p="0.3rem 0.3rem">
                    <Text lh={1.2} size="xs" lineClamp={1}>{row.id}</Text>
                </Paper>
            </Group>
        </Table.Td>
        <Table.Td c={(row.status === "completed" || row.status === "cancelled") ? "dimmed" : "white"}>
            <Flex align="center" gap="0.4rem">
                {row.pinned && <PiPushPinDuotone size="1rem" />}
                <Text size="sm">{row.title}</Text>
            </Flex>
        </Table.Td>
        <Table.Td c="white">
            <Group component={Link} href={"/clients?page=1&sort=username&descending=false&search=" + row.client.id}
                gap="0.6rem">
                <Avatar
                    style={{ filter: (row.status === "completed" || row.status === "cancelled") ? "brightness(50%)" : "none" }}
                    size="1.4rem" src={row.client.avatar_url} />
                <Text size="sm" fw={300}
                    c={(row.status === "completed" || row.status === "cancelled") ? "dimmed" : "white"}>{row.client.username}</Text>
            </Group>
        </Table.Td>
        <Table.Td fw={300}
            c={(row.status === "completed" || row.status === "cancelled") ? "dimmed" : "white"}><NumberFormatter
                prefix={settings?.currency_prefix} value={row.total_value}/></Table.Td>
        <Table.Td fw={300}
            c={(row.status === "completed" || row.status === "cancelled") ? "dimmed" : "white"}><NumberFormatter
                prefix={settings?.currency_prefix} value={row.total_paid} /></Table.Td>
        <Table.Td fw={300}
            c={(row.status === "completed" || row.status === "cancelled") ? "dimmed" : "white"}>{formatDateToUKTime(row.start_date)}</Table.Td>
        <Table.Td fw={300}
            c={getColorBasedOnTime(new Date(row.deadline))}>{timeUntil(new Date(row.deadline))}</Table.Td>
        <Table.Td fw={300}
            c={(row.status === "completed" || row.status === "cancelled") ? "dimmed" : "white"}>{row.product?.description}</Table.Td>
        <Table.Td fw={300} c="white"><StatusBadge status={row.status} /></Table.Td>
        <Table.Td fw={300} ta="center"><ManageButton currencyPrefix={settings?.currency_prefix} key={JSON.stringify(row)}
            handleSetClientFilter={(client_id => setFilterClient(client_id))}
            commission={row} handleStatusRefresh={handleStatusRefresh}
            handlePaidRefresh={handlePaidRefresh}
            handleDeleteRefresh={handleDeleteRefresh}
            handleEditRefresh={handleEditRefresh}
            handlePinRefresh={handlePinRefresh}
        /> </Table.Td>

    </Table.Tr>));

    return (<>
        <Head>
            <title>Commissions | Ember</title>
        </Head>

        <SaveViewModal opened={saveViewModal} data={
            {
                page: "commissions",
                sort: sort,
                sortOrder: sortOrder,
                search: debouncedSearch,
                filterClient,
                filterStatus
            }
        } onClose={toggleSaveViewModal} />

        <CreateModal currencyPrefix={settings?.currency_prefix} open={createModalOpened} toggleCreateModal={toggleCreateModal} handleUpdate={handleUpdate} />

        <Paper radius={6} p="0.4rem 0.8rem" mb="0.6rem">
            <Group justify="space-between">
                <Flex align="center" gap="1rem">
                    <Menu closeOnItemClick={false} width={200} withArrow shadow="md">
                        <Menu.Target>
                            <ActionIcon size="sm" bg="none">
                                <PiArrowsDownUpBold size="1.4rem" />
                            </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                            <Flex className="pointer" align="center" justify="space-between">
                                <Menu.Label>Sort by</Menu.Label>
                                <Text c="red" size="xs" onClick={() => {
                                    setSort("deadline");
                                    setSortOrder("ascending");
                                }}>Clear sorting</Text>
                            </Flex>
                            <Menu.Item mb="0.4rem">
                                <Switch color="primary.3" size="sm" label="Descending" onChange={toggleSortOrder}
                                    checked={sortOrder === 'descending'} />
                            </Menu.Item>
                            <Menu.Item onClick={() => setSort("deadline")}
                                c={sort === "deadline" ? "primary.9" : "dimmed"}>
                                <Group gap="0.6rem">
                                    <PiArrowsDownUpBold size="1rem" />
                                    <Text size="sm">Deadline</Text>
                                </Group>
                            </Menu.Item>
                            <Menu.Item onClick={() => setSort("client")} c={sort === "client" ? "primary.9" : "dimmed"}>
                                <Group gap="0.6rem">
                                    <PiArrowsDownUpBold size="1rem" />
                                    <Text size="sm">Client</Text>
                                </Group>
                            </Menu.Item>
                            <Menu.Item onClick={() => setSort("total_value")}
                                c={sort === "total_value" ? "primary.9" : "dimmed"}>
                                <Group gap="0.6rem">
                                    <PiArrowsDownUpBold size="1rem" />
                                    <Text size="sm">Total value</Text>
                                </Group>
                            </Menu.Item>
                            <Menu.Item onClick={() => setSort("total_paid")}
                                c={sort === "total_paid" ? "primary.9" : "dimmed"}>
                                <Group gap="0.6rem">
                                    <PiArrowsDownUpBold size="1rem" />
                                    <Text size="sm">Total paid</Text>
                                </Group>
                            </Menu.Item>
                            <Menu.Item onClick={() => setSort("status")} c={sort === "status" ? "primary.9" : "dimmed"}>
                                <Group gap="0.6rem">
                                    <PiArrowsDownUpBold size="1rem" />
                                    <Text size="sm">Status</Text>
                                </Group>
                            </Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                    <Menu shadow="md" width={200}>
                        <Menu.Target>
                            <ActionIcon bg="none"><TbFilter size="1.2rem" />
                            </ActionIcon>
                        </Menu.Target>

                        <Menu.Dropdown>
                            <Flex className="pointer" align="center" justify="space-between">
                                <Menu.Label>Filter by</Menu.Label>
                                <Text c="red" size="xs" onClick={() => {
                                    setFilterClient('');
                                    setFilterStatus('');
                                }}>Clear filter</Text>
                            </Flex>
                            <Menu.Item p={0}>
                                <Menu position="right" trigger="hover" shadow="md" width={200}>
                                    <Menu.Target p="0.3rem 0.8rem">
                                        <Group justify="space-between">
                                            <Group gap="0.6rem">
                                                <PiUserBold />
                                                <Text size="sm">Client</Text>
                                            </Group>
                                            <PiCaretRightBold size={14} />
                                        </Group>
                                    </Menu.Target>
                                    <Menu.Dropdown>
                                        <Menu.Item onClick={() => setFilterClient('')}>
                                            <Group gap="0.6rem">
                                                <PiListFill size="1.4rem" />
                                                <Text size="sm" fw={300}>All</Text>
                                            </Group>
                                        </Menu.Item>
                                        {Array.from(new Set(allData.map(item => item.client.id)))
                                            .map((clientId) => {
                                                const client = allData.find(item => item.client.id === clientId).client;
                                                return (<Menu.Item key={client.id}
                                                    onClick={() => handleFilterChange("client", client.id)}>
                                                    <Group gap="0.6rem">
                                                        <Avatar size="1.4rem" src={client.avatar_url} />
                                                        <Text size="sm" fw={300}>{client.username}</Text>
                                                    </Group>
                                                </Menu.Item>);
                                            })}
                                    </Menu.Dropdown>
                                </Menu>
                            </Menu.Item>
                            <Menu.Item p={0}>
                                <Menu position="right" trigger="hover" shadow="md" width={200}>
                                    <Menu.Target p="0.3rem 0.8rem">
                                        <Group justify="space-between">
                                            <Group gap="0.6rem">
                                                <PiLightningBold />
                                                <Text size="sm">Status</Text>
                                            </Group>
                                            <PiCaretRightBold size={14} />
                                        </Group>
                                    </Menu.Target>
                                    <Menu.Dropdown w="14rem">
                                        <Menu.Item onClick={() => handleFilterChange("status", '')}>
                                            <Group gap="0.6rem">
                                                <PiListFill size="1.4rem" />
                                                <Text size="sm" fw={300}>All</Text>
                                            </Group>
                                        </Menu.Item>
                                        <Menu.Item onClick={() => handleFilterChange("status", 'not_started')}>
                                            <StatusBadge status="not_started" />
                                        </Menu.Item>
                                        <Menu.Item onClick={() => handleFilterChange("status", 'in_progress')}>
                                            <StatusBadge status="in_progress" />
                                        </Menu.Item>
                                        <Menu.Item onClick={() => handleFilterChange("status", 'completed')}>
                                            <StatusBadge status="completed" />
                                        </Menu.Item>
                                        <Menu.Item onClick={() => handleFilterChange("status", 'cancelled')}>
                                            <StatusBadge status="cancelled" />
                                        </Menu.Item>
                                        <Menu.Item onClick={() => handleFilterChange("status", 'paused')}>
                                            <StatusBadge status="paused" />
                                        </Menu.Item>
                                    </Menu.Dropdown>
                                </Menu>
                            </Menu.Item>
                        </Menu.Dropdown>
                    </Menu>

                    <TextInput
                        w="100%"
                        maw="12rem"
                        size="xs"
                        value={searchValue}
                        placeholder="Search rows..."
                        rightSectionWidth={42}
                        onChange={(e) => {
                            const value = e.target.value;
                            setSearchValue(value);
                            if (value === '') {
                                const queryParams = new URLSearchParams(window.location.search);
                                queryParams.delete('search');
                                const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
                                window.history.replaceState(null, '', newUrl);
                            }
                        }}
                        leftSection={<IconSearch style={{ width: rem(18), height: rem(18) }} stroke={1.5} />}
                    />
                    <Tooltip label="Save this view">
                        <ActionIcon onClick={toggleSaveViewModal} bg="none">
                            <TbEyePlus size="1.2rem" />
                        </ActionIcon>
                    </Tooltip>
                    {(filterClient !== '' || filterStatus !== '' || debouncedSearch !== '') && <Flex w="100%">
                        <Text size="sm">You have filters applied</Text>
                        <Text className="pointer" onClick={handleClearFilters} ml="0.6rem" size="sm" td="underline">Clear
                            filters</Text>
                    </Flex>}
                </Flex>
                <Group gap="0.8rem">
                    {selectedRows.length > 0 && <>
                        <Tooltip openDelay={500} label="Download selected rows to .csv">
                            <ActionIcon size="md" bg="dark.7" onClick={handleDownloadData}>
                                <PiDownloadSimple size="1rem" />
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip openDelay={500} label="Clear selected rows">
                            <ActionIcon size="md" bg="dark.7" onClick={() => setSelectedRows([])}>
                                <PiXBold size="1rem" />
                            </ActionIcon>
                        </Tooltip>
                        <Text c="dimmed" size="sm"
                            fw={400}>{selectedRows.length} {selectedRows.length === 1 ? "row" : "rows"} selected</Text>
                        <Text className="pointer" onClick={
                            () => {
                                setSelectedRows(filteredData.map(item => item.id));
                            }} size="sm" c="primary.9" td="underline">Select all rows</Text>
                    </>}

                    <Button ml="0.6rem" onClick={toggleCreateModal} size="xs">+ New</Button>
                </Group>
            </Group>
        </Paper>


        <ScrollArea mb="1rem" scrollbars="xy" offsetScrollbars mah={500}
            onScrollPositionChange={({ y }) => setScrolled(y !== 0)}>
            <Table borderColor="dark.6" miw={1200}>
                <Table.Thead className={cx(classes.header, { [classes.scrolled]: scrolled })}>
                    <Table.Tr>
                        <Table.Th miw="4rem" c="dimmed" fw={400}>
                            <Group gap="0.8rem" wrap="nowrap">
                                <Checkbox
                                    checked={filteredData.length === 0 ? false : (selectedRows.length === filteredData.length)}
                                    onChange={(event) => {
                                        if (event.currentTarget.checked) {
                                            setSelectedRows(filteredData.map(item => item.id));
                                        } else {
                                            setSelectedRows([]);
                                        }
                                    }}
                                />
                                <Text size="sm" fw={400}># ID</Text>
                            </Group>
                        </Table.Th>
                        <Table.Th miw="17rem" c="dimmed" fw={400}>Title</Table.Th>
                        <Table.Th miw="9rem" c="dimmed" fw={400}>Client</Table.Th>
                        <Table.Th miw="6.3rem" c="dimmed" fw={400}>Total Value</Table.Th>
                        <Table.Th miw="6.3rem" c="dimmed" fw={400}>Total Paid</Table.Th>
                        <Table.Th miw="6.3rem" c="dimmed" fw={400}>Start Date</Table.Th>
                        <Table.Th miw="6.3rem" c="dimmed" fw={400}>Deadline</Table.Th>
                        <Table.Th miw="6.3rem" c="dimmed" fw={400}>Product</Table.Th>
                        <Table.Th miw="7rem" c="dimmed" fw={400}>Status</Table.Th>

                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
            </Table>
            {filteredData.length === 0 && <Stack align="center" gap="0.6rem">
                <Text mt="2rem" ta="center" c="dimmed" fw={400}>No commissions found!</Text>
                <Button mb="1rem" onClick={handleClearFilters}
                    maw="8rem" c="white" variant="subtle" ta="center">Clear filters</Button>
            </Stack>}
        </ScrollArea>
        <Pagination color="primary.2" value={page} onChange={setPage} total={totalPages} />
    </>);
}
