'use client'

import {
    ActionIcon,
    Avatar,
    Button, Checkbox,
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
    TextInput, Tooltip
} from '@mantine/core';
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconSearch } from "@tabler/icons-react";
import cx from 'clsx';
import exportFromJSON from "export-from-json";
import Head from "next/head";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useCallback, useEffect, useState } from 'react';
import {
    PiArrowsDownUpBold,
    PiCaretRightBold,
    PiDownloadSimple,
    PiLightningBold,
    PiListFill,
    PiUserBold, PiXBold
} from "react-icons/pi";
import { TbEyePlus, TbFilter } from "react-icons/tb";
import CreateModal from "./CreateModal/Requests";
import ManageButton from "./ManageButton/Requests";
import SaveViewModal from "./reusable/SaveViewModal";
import StatusBadge from "./StatusBadge/StatusBadge";
import { getColorBasedOnTime } from "../utils/getColorBasedOnTime";
import { supabaseClient } from "../utils/supabaseClient";
import { timeUntil } from "../utils/timeUntil";
import classes from '../styles/pages/Commissions.module.css';

const itemsPerPage = 10;

export default function RequestsPage({ settings }) {
    return <Suspense fallback={<div>Loading...</div>}>
        <Requests settings={settings} />
    </Suspense>
}

function Requests({ settings }) {
    const [selectedRows, setSelectedRows] = useState([]);
    const [commissions, setCommissions] = useState([]);
    const searchParams = useSearchParams();
    const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
    const [allData, setAllData] = useState([]);
    const [totalPages, setTotalPages] = useState(Math.ceil(allData.length / itemsPerPage));
    const [filteredData, setFilteredData] = useState(allData);
    const [scrolled, setScrolled] = useState(false);
    const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');
    const [debouncedSearch] = useDebouncedValue(searchValue, 200);
    const [sort, setSort] = useState(searchParams.get('sort') || "deadline");
    const [sortOrder, setSortOrder] = useState(searchParams.get('descending') === 'true' ? 'descending' : 'ascending');
    const [createModalOpened, { toggle: toggleCreateModal }] = useDisclosure(false);
    const [saveViewModal, { toggle: toggleSaveViewModal }] = useDisclosure(false);
    const [filterCommission, setCommissionFilter] = useState(searchParams.get('filter') || '');
    const [filterStatus, setFilterStatus] = useState('');

    const handleDownloadData = () => {
        const itemsToDownload = allData.filter(item => selectedRows.includes(item.id));
        exportFromJSON({ data: itemsToDownload, fileName: "requests", exportType: exportFromJSON.types.csv })
    }

    useEffect(() => {
        async function fetchData() {
            try {
                const { data: requestsData, error: requestsError } = await supabaseClient
                    .from('panel_requests')
                    .select('id, created_at, description, paid, status, deadline, offered_amount, commission ( id, title, client ( id, avatar_url) )')
                    .order(sort, { ascending: sortOrder !== 'descending' });

                const { data: commissionsData, error: commissionsError } = await supabaseClient
                    .from('panel_commissions')
                    .select('id, title, client ( avatar_url )')

                if (requestsError || commissionsError) {
                    console.error("Error fetching data:", requestsError || commissionsError);
                    notifications.show({ title: 'Error', message: 'Failed to fetch data', color: 'red' });
                    return;
                }

                setAllData(requestsData);
                setCommissions(commissionsData);
            } catch (error) {
                console.error('Fetching data failed:', error);
            }
        }

        fetchData();
    }, []);

    const filterAndSortData = (data) => {
        return data
            .filter(item => {
                return ((item.id.toLowerCase().includes((debouncedSearch || '').toLowerCase())
                    || item.description.toLowerCase().includes((debouncedSearch || '').toLowerCase())
                    || item.commission.title.toLowerCase().includes((debouncedSearch || '').toLowerCase())));
            })
            .sort(compareFunction);
    };

    useEffect(() => {
        setPage(parseInt(searchParams.get('page') || 1));
        setCommissionFilter(searchParams.get('filter') || '');
        setFilterStatus(searchParams.get('status') || '');
        setSort(searchParams.get('sort') || 'deadline');
        setSortOrder(searchParams.get('descending') === 'true' ? 'descending' : 'ascending');
        setSearchValue(searchParams.get('search') || '');
    }, [searchParams]);

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        queryParams.set('page', page);
        queryParams.set('filter', filterCommission);
        queryParams.set('status', filterStatus);
        queryParams.set('sort', sort);
        queryParams.set('descending', sortOrder === 'descending');
        queryParams.set('search', debouncedSearch);

        const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
        if (window.location.search !== `?${queryParams.toString()}`) {
            window.history.replaceState(null, '', newUrl);
        }
    }, [page, filterCommission, filterStatus, sort, sortOrder, debouncedSearch]);

    useEffect(() => {
        const lowercasedFilter = (debouncedSearch || '').toLowerCase();
        const filteredAndSortedData = allData
            .filter(item => {
                const matchesFilterCommission = filterCommission === '' || item.commission.title.toLowerCase() === filterCommission.toLowerCase();
                const matchesFilterStatus = filterStatus === '' || item.status === filterStatus;
                const matchesSearch = item.id.toLowerCase().includes(lowercasedFilter) || item.description.toLowerCase().includes(lowercasedFilter) ||
                    item.commission.title.toLowerCase().includes(lowercasedFilter);
                return matchesFilterCommission && matchesFilterStatus && matchesSearch;
            })
            .sort(compareFunction);

        setFilteredData(filteredAndSortedData.slice((page - 1) * itemsPerPage, page * itemsPerPage));
        setTotalPages(Math.ceil(filteredAndSortedData.length / itemsPerPage));
    }, [debouncedSearch, allData, sort, sortOrder, filterCommission, filterStatus, page]);


    const toggleSortOrder = () => {
        setSortOrder(sortOrder === 'ascending' ? 'descending' : 'ascending');
    };


    const compareFunction = (a, b) => {
        let comparison = 0;

        switch (sort) {
            case 'deadline':
                comparison = new Date(a.deadline) - new Date(b.deadline);
                break;
            case 'commission':
                comparison = a.commission.client.id.localeCompare(b.commission.client.id);
                break;
            case 'offered_amount':
                comparison = parseInt(b.offered_amount) - parseInt(a.offered_amount);
                break;
            case 'status':
                comparison = a.status.localeCompare(b.status);
                break;
            default:
                break;
        }
        return sortOrder === 'ascending' ? comparison : -comparison;
    };

    const handleFilterByCommission = (commissionTitle) => {
        setCommissionFilter(commissionTitle);
    };

    const handleFilterByStatus = (status) => {
        setFilterStatus(status);
    };

    const handleCopyRequestId = (id) => {
        navigator.clipboard.writeText(id);
        notifications.show({
            title: 'Done!', message: 'Request ID copied to clipboard', color: 'green',
        })
    }

    const handleStatusRefresh = (id, status) => {
        const index = filteredData.findIndex(item => item.id === id);
        if (index !== -1) {
            const newData = [...filteredData];
            newData[index].status = status;
            setFilteredData(filterAndSortData(newData));
        }
    };

    const handleClearFilters = () => {
        setSearchValue('');
        setCommissionFilter('');
        setFilterStatus('');
        const queryParams = new URLSearchParams(window.location.search);
        queryParams.delete('search');
        queryParams.delete('filter');
        queryParams.delete('status');
        const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
        window.history.replaceState(null, '', newUrl);
    };

    const handleDeleteRefresh = (id) => {
        const updateData = (data) => data.filter(item => item.id !== id);
        setAllData(currentData => updateData(currentData));
        setFilteredData(currentData => updateData(currentData));
    };

    const handleEditRefresh = useCallback((id, payload) => {
        setFilteredData(currentData => {
            const index = currentData.findIndex(item => item.id === id);
            if (index !== -1) {
                return [...currentData.slice(0, index), { ...currentData[index], ...payload }, ...currentData.slice(index + 1)];
            }
            return currentData;
        });
    }, []);

    const handleMarkAsPaidRefresh = useCallback((id) => {
        setAllData(currentData => {
            const index = currentData.findIndex(item => item.id === id);
            if (index !== -1) {
                return [...currentData.slice(0, index), {
                    ...currentData[index],
                    paid: true
                }, ...currentData.slice(index + 1)];
            }
            return currentData;
        });
    }, []);

    const handleUpdate = (payload) => {
        const newData = [payload, ...filteredData];
        setFilteredData(filterAndSortData(newData));
    };

    const rows = filteredData.map((row) => (<Table.Tr key={row.id}>
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
                <Paper maw="4rem" className="pointer" onClick={() => handleCopyRequestId(row.id)} p="0.3rem 0.3rem">
                    <Text lh={1.2} size="xs" lineClamp={1}>{row.id}</Text>
                </Paper>
            </Group>
        </Table.Td>
        <Table.Td
            c={(row.status === "rejected" || row.status === "completed" || row.status === "cancelled") ? "dimmed" : "white"}>{row.description}</Table.Td>
        <Table.Td c="white">
            <Group component={Link}
                href={"/commissions?page=1&sort=deadline&descending=false&search=" + row.commission.title}
                gap="0.6rem">
                <Avatar size="1.4rem"
                    style={{ filter: (row.status === "rejected" || row.status === "completed" || row.status === "cancelled") ? "brightness(50%)" : "none" }}
                    src={row.commission.client.avatar_url} />
                <Text size="sm" fw={300}
                    c={(row.status === "rejected" || row.status === "completed" || row.status === "cancelled") ? "dimmed" : "white"}>{row.commission.title}</Text>
            </Group>
        </Table.Td>
        <Table.Td fw={300}
            c={(row.status === "rejected" || row.status === "completed" || row.status === "cancelled") ? "dimmed" : "white"}><NumberFormatter prefix={settings?.currency_prefix} value={row.offered_amount} /></Table.Td>
        <Table.Td fw={300}
            c={(row.status === "rejected" || row.status === "completed" || row.status === "cancelled") ? "dimmed" : "white"}>{row.paid ? "Yes" : "No"}</Table.Td>
        <Table.Td fw={300}
            c={getColorBasedOnTime(new Date(row.deadline))}>{timeUntil(new Date(row.deadline))}</Table.Td>
        <Table.Td fw={300}
            c={(row.status === "completed" || row.status === "cancelled") ? "dimmed" : "white"}>{timeUntil(new Date(row.created_at))}</Table.Td>
        <Table.Td fw={300} c="white"><StatusBadge status={row.status} /></Table.Td>
        <Table.Td fw={300} c="white"><ManageButton currencyPrefix={settings?.currency_prefix} key={JSON.stringify(row)} request={row}
            handleSetCommissionFilter={handleFilterByCommission}
            commission={row} handleStatusRefresh={handleStatusRefresh}
            handleDeleteRefresh={handleDeleteRefresh}
            handleEditRefresh={handleEditRefresh}
            handleMarkAsPaidRefresh={handleMarkAsPaidRefresh} /></Table.Td>
    </Table.Tr>));

    return (<div>
        <Head>
            <title>Requests | Ember</title>
        </Head>

        <SaveViewModal opened={saveViewModal} data={
            {
                page: "requests",
                sort,
                sortOrder,
                search: debouncedSearch,
                filterCommission,
                filterStatus
            }
        } onClose={toggleSaveViewModal} />

        <CreateModal currencyPrefix={settings?.currency_prefix} handleUpdate={handleUpdate} commissions={commissions} open={createModalOpened}
            toggleCreateModal={toggleCreateModal} />

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
                            <Menu.Item onClick={() => setSort("commission")}
                                c={sort === "commission" ? "primary.9" : "dimmed"}>
                                <Group gap="0.6rem">
                                    <PiArrowsDownUpBold size="1rem" />
                                    <Text size="sm">Commission</Text>
                                </Group>
                            </Menu.Item>
                            <Menu.Item onClick={() => setSort("offered_amount")}
                                c={sort === "offered_amount" ? "primary.9" : "dimmed"}>
                                <Group gap="0.6rem">
                                    <PiArrowsDownUpBold size="1rem" />
                                    <Text size="sm">Offered amount</Text>
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
                                    setCommissionFilter('');
                                    setFilterStatus('');
                                }}>Clear filter</Text>
                            </Flex>
                            <Menu.Item p={0}>
                                <Menu position="right" trigger="hover" shadow="md" width={300}>
                                    <Menu.Target p="0.3rem 0.8rem">
                                        <Group justify="space-between">
                                            <Group gap="0.6rem">
                                                <PiUserBold />
                                                <Text size="sm">Commission</Text>
                                            </Group>
                                            <PiCaretRightBold size={14} />
                                        </Group>
                                    </Menu.Target>
                                    <Menu.Dropdown>
                                        <Menu.Item onClick={() => handleFilterByCommission('')}>
                                            <Group gap="0.6rem">
                                                <PiListFill size="1.4rem" />
                                                <Text size="sm" fw={300}>All</Text>
                                            </Group>
                                        </Menu.Item>
                                        {Array.from(new Set(allData.map(item => item.commission.client.id)))
                                            .map((clientId) => {
                                                const request = allData.find(item => item.commission.client.id === clientId);
                                                return (
                                                    <Menu.Item key={request.commission.id}
                                                        onClick={() => handleFilterByCommission(request.commission.title)}>
                                                        <Flex align="center" gap="0.6rem">
                                                            <Avatar size="1.4rem"
                                                                src={request.commission.client.avatar_url} />
                                                            <Text lineClamp={1} size="sm"
                                                                fw={300}>{request.commission.title}</Text>
                                                        </Flex>
                                                    </Menu.Item>
                                                );
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
                                        <Menu.Item onClick={() => handleFilterByStatus('')}>
                                            <Group gap="0.6rem">
                                                <PiListFill size="1.4rem" />
                                                <Text size="sm" fw={300}>All</Text>
                                            </Group>
                                        </Menu.Item>
                                        <Menu.Item onClick={() => handleFilterByStatus('requested')}>
                                            <StatusBadge status="requested" />
                                        </Menu.Item>
                                        <Menu.Item onClick={() => handleFilterByStatus('not_started')}>
                                            <StatusBadge status="not_started" />
                                        </Menu.Item>
                                        <Menu.Item onClick={() => handleFilterByStatus('in_progress')}>
                                            <StatusBadge status="in_progress" />
                                        </Menu.Item>
                                        <Menu.Item onClick={() => handleFilterByStatus('completed')}>
                                            <StatusBadge status="completed" />
                                        </Menu.Item>
                                        <Menu.Item onClick={() => handleFilterByStatus('cancelled')}>
                                            <StatusBadge status="cancelled" />
                                        </Menu.Item>
                                        <Menu.Item onClick={() => handleFilterByStatus('paused')}>
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
                            const queryParams = new URLSearchParams(window.location.search);
                            if (value === '') {
                                queryParams.delete('search');
                            } else {
                                queryParams.set('search', value);
                            }
                            const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
                            window.history.replaceState(null, '', newUrl);
                        }}
                        leftSection={<IconSearch style={{ width: rem(18), height: rem(18) }} stroke={1.5} />}
                    />
                    <Tooltip label="Save this view">
                        <ActionIcon onClick={toggleSaveViewModal} bg="dark.7">
                            <TbEyePlus size="1.2rem" />
                        </ActionIcon>
                    </Tooltip>
                    {(filterCommission !== '' || filterStatus !== '' || debouncedSearch !== '') && <Flex w="100%">
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
                        <Table.Th miw="17rem" c="dimmed" fw={400}>Description</Table.Th>
                        <Table.Th miw="9rem" c="dimmed" fw={400}>Commission</Table.Th>
                        <Table.Th miw="6.3rem" c="dimmed" fw={400}>Offered Amount</Table.Th>
                        <Table.Th miw="6.3rem" c="dimmed" fw={400}>Paid</Table.Th>
                        <Table.Th miw="6.3rem" c="dimmed" fw={400}>Deadline</Table.Th>
                        <Table.Th miw="6.3rem" c="dimmed" fw={400}>Submitted at</Table.Th>
                        <Table.Th miw="6.3rem" c="dimmed" fw={400}>Status</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
            </Table>
            {filteredData.length === 0 && <Stack align="center" gap="0.6rem">
                <Text mt="2rem" ta="center" c="dimmed" fw={400}>No requests found!</Text>
                <Button mb="1rem" onClick={handleClearFilters}
                    maw="8rem" c="white" variant="subtle" ta="center">Clear filters</Button>
            </Stack>}
        </ScrollArea>
        <Pagination color="primary.2" value={page} onChange={setPage} total={totalPages} />
    </div>);
}
