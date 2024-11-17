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
    PiUserBold,
    PiXBold
} from "react-icons/pi";
import { TbEyePlus, TbFilter } from "react-icons/tb";
import CreateModal from "./CreateModal/Quotes";
import ManageButton from "./ManageButton/Quotes";
import PayTermsBadge from "./PayTermsBadge/PayTermsBadge";
import SaveViewModal from "./reusable/SaveViewModal";
import StatusBadge from "./StatusBadge/StatusBadge";
import { formatDateToUKTime } from "../utils/formatDate";
import { getColorBasedOnTime } from "../utils/getColorBasedOnTime";
import { supabaseClient } from "../utils/supabaseClient";
import { timeUntil } from "../utils/timeUntil";
import classes from '../styles/pages/Commissions.module.css';

const itemsPerPage = 10;

export default function QuotesPage({ settings }) {
    return <Suspense fallback={<div>Loading...</div>}>
        <Quotes settings={settings} />
    </Suspense>
}

function Quotes({ settings }) {
    const [selectedRows, setSelectedRows] = useState([]);
    const router = useRouter();
    const searchParams = useSearchParams();
    const [page, setPage] = useState(parseInt(searchParams.get('page') || 1));
    const [allData, setAllData] = useState([]);
    const [totalPages, setTotalPages] = useState(Math.ceil(allData.length / itemsPerPage));
    const [filteredData, setFilteredData] = useState(allData);
    const [scrolled, setScrolled] = useState(false);
    const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');
    const [debouncedSearch] = useDebouncedValue(searchValue, 200);
    const [sort, setSort] = useState(searchParams.get('sort') || "start_date");
    const [sortOrder, setSortOrder] = useState(searchParams.get('descending') === 'true' ? 'descending' : 'ascending');
    const [createModalOpened, { toggle: toggleCreateModal }] = useDisclosure(false);
    const [saveViewModal, { toggle: toggleSaveViewModal }] = useDisclosure(false);
    const [filterClient, setFilterClient] = useState(searchParams.get('client') || '');
    const [filterStatus, setFilterStatus] = useState('');

    const handleDownloadData = () => {
        const itemsToDownload = allData.filter(item => selectedRows.includes(item.id));
        exportFromJSON({ data: itemsToDownload, fileName: "quotes", exportType: exportFromJSON.types.csv })
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data, error } = await supabaseClient
                    .from('panel_quotes')
                    .select('id, title, client ( id, username, avatar_url), proposed_amount, start_date, deadline, status, payment_terms, created_at')
                    .order(sort, { ascending: sortOrder !== 'descending' });

                if (error) {
                    throw new Error('Failed to fetch quotes');
                }

                setAllData(data);
            } catch (error) {
                console.log(error)
            }
        };

        fetchData();
    }, []);

    const filterAndSortData = (data) => {
        return data
            .filter(item => {
                return ((item.id.toLowerCase().includes((debouncedSearch || '').toLowerCase())
                    || item.title.toLowerCase().includes((debouncedSearch || '').toLowerCase())
                    || item.client.username.toLowerCase().includes((debouncedSearch || '').toLowerCase()))
                    && (filterClient === '' || item.client.id === filterClient)
                    && (filterStatus === '' || item.status === filterStatus));
            })
            .sort(compareFunction);
    };

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        queryParams.set('page', page);
        queryParams.set('client', filterClient);
        queryParams.set('status', filterStatus);
        queryParams.set('sort', sort);
        queryParams.set('descending', sortOrder === 'descending');
        if (debouncedSearch) queryParams.set('search', debouncedSearch);

        const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
        if (window.location.search !== `?${queryParams.toString()}`) {
            window.history.replaceState(null, '', newUrl);
        }

        const filteredAndSortedData = filterAndSortData(allData);
        setFilteredData(filteredAndSortedData.slice((page - 1) * itemsPerPage, page * itemsPerPage));
        setTotalPages(Math.ceil(filteredAndSortedData.length / itemsPerPage));
    }, [allData, page, filterClient, filterStatus, debouncedSearch, sort, sortOrder]);

    const toggleSortOrder = () => {
        setSortOrder(sortOrder === 'ascending' ? 'descending' : 'ascending');
    };

    const compareFunction = (a, b) => {
        let comparison = 0;

        switch (sort) {
            case 'start_date':
                comparison = new Date(a.start_date) - new Date(b.start_date);
                break;
            case 'deadline':
                comparison = new Date(a.deadline) - new Date(b.deadline);
                break;
            case 'client':
                comparison = a.client.username.localeCompare(b.client.username);
                break;
            case 'proposed_amount':
                comparison = parseInt(b.proposed_amount) - parseInt(a.proposed_amount);
                break;
            case 'status':
                comparison = a.status.localeCompare(b.status);
                break;
            default:
                break;
        }
        return sortOrder === 'ascending' ? comparison : -comparison;
    };

    const handleFilterByClient = (commissionTitle) => {
        setFilterClient(commissionTitle);
    };

    const handleFilterByStatus = (status) => {
        setFilterStatus(status);
    };

    const handleCopyQuoteId = (id) => {
        navigator.clipboard.writeText(id);
        notifications.show({
            title: 'Done!', message: 'Quote ID copied to clipboard', color: 'green',
        })
    }

    const handleClearFilters = () => {
        setSearchValue('');
        setFilterClient('');
        setFilterStatus('');
        setSort('start_date');
        setSortOrder('ascending');

        const queryParams = new URLSearchParams(window.location.search);
        queryParams.delete('search');
        queryParams.delete('client');
        queryParams.delete('status');
        queryParams.delete('sort');
        queryParams.delete('descending');

        const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
        window.history.replaceState(null, '', newUrl);
    };

    const handleUpdate = (payload) => {
        const newData = [payload, ...filteredData];
        setFilteredData(filterAndSortData(newData));
    };

    const handleStatusRefresh = (id, status) => {
        const index = filteredData.findIndex(item => item.id === id);
        if (index !== -1) {
            const newData = [...filteredData];
            newData[index].status = status;
            setFilteredData(filterAndSortData(newData));
        }
    };

    const handleDeleteRefresh = (id) => {
        const newData = filteredData.filter(item => item.id !== id);
        setFilteredData(newData);
    };

    const handleEditRefresh = useCallback((id, payload) => {
        setAllData(currentData => {
            const index = currentData.findIndex(item => item.id === id);
            if (index !== -1) {
                return [...currentData.slice(0, index), { ...currentData[index], ...payload }, ...currentData.slice(index + 1)];
            }
            return currentData;
        });
    }, []);

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
                <Paper maw="4rem" className="pointer" onClick={() => handleCopyQuoteId(row.id)} p="0.3rem 0.3rem">
                    <Text lh={1.2} size="xs" lineClamp={1}>{row.id}</Text>
                </Paper>
            </Group>
        </Table.Td>
        <Table.Td c="white">{row.title}</Table.Td>
        <Table.Td c="white">
            <Group component={Link} href={"/clients?id=" + row.client.id} gap="0.6rem">
                <Avatar size="1.4rem" src={row.client.avatar_url} />
                <Text size="sm" fw={300}>{row.client.username}</Text>
            </Group>
        </Table.Td>
        <Table.Td fw={300} c="white"><NumberFormatter prefix={settings?.currency_prefix} value={row.proposed_amount} /></Table.Td>
        <Table.Td fw={300} c="white">{formatDateToUKTime(row.start_date)}</Table.Td>
        <Table.Td fw={300}
            c={getColorBasedOnTime(new Date(row.deadline))}>{timeUntil(new Date(row.deadline))}</Table.Td>
        <Table.Td fw={300} c="white"><PayTermsBadge payment_terms={row.payment_terms} /></Table.Td>
        <Table.Td fw={300} c="white"><StatusBadge status={row.status} /></Table.Td>
        <Table.Td fw={300} ta="center"><ManageButton currencyPrefix={settings?.currency_prefix} key={JSON.stringify(row)} handleDeleteRefresh={handleDeleteRefresh}
            handleEditRefresh={handleEditRefresh}
            handleStatusRefresh={handleStatusRefresh}
            handleSetClientFilter={(client_id => setFilterClient(client_id))}
            quote={row} /> </Table.Td>

    </Table.Tr>));

    return (<Suspense fallback={<div></div>}>
        <Head>
            <title>Quotes | Ember</title>
        </Head>

        <SaveViewModal opened={saveViewModal} data={
            {
                page: "quotes",
                sort: sort,
                sortOrder: sortOrder,
                search: debouncedSearch,
                filterClient: filterClient,
                filterStatus: filterStatus
            }
        } onClose={toggleSaveViewModal} />

        <CreateModal currencyPrefix={settings?.currency_prefix} handleUpdate={handleUpdate} open={createModalOpened} toggleCreateModal={toggleCreateModal} />

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
                            <Menu.Item onClick={() => setSort("start_date")}
                                c={sort === "start_date" ? "primary.9" : "dimmed"}>
                                <Group gap="0.6rem">
                                    <PiArrowsDownUpBold size="1rem" />
                                    <Text size="sm">Start date</Text>
                                </Group>
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
                            <Menu.Item onClick={() => setSort("proposed_amount")}
                                c={sort === "proposed_amount" ? "primary.9" : "dimmed"}>
                                <Group gap="0.6rem">
                                    <PiArrowsDownUpBold size="1rem" />
                                    <Text size="sm">Proposed price</Text>
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
                                        <Menu.Item onClick={() => handleFilterByClient('')}>
                                            <Group gap="0.6rem">
                                                <PiListFill size="1.4rem" />
                                                <Text size="sm" fw={300}>All</Text>
                                            </Group>
                                        </Menu.Item>
                                        {Array.from(new Set(allData.map(item => item.client.id)))
                                            .map((clientId) => {
                                                const client = allData.find(item => item.client.id === clientId).client;
                                                return (<Menu.Item key={client.id}
                                                    onClick={() => handleFilterByClient(client.id)}>
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
                                        <Menu.Item onClick={() => handleFilterByStatus('')}>
                                            <Group gap="0.6rem">
                                                <PiListFill size="1.4rem" />
                                                <Text size="sm" fw={300}>All</Text>
                                            </Group>
                                        </Menu.Item>
                                        <Menu.Item onClick={() => handleFilterByStatus("pending")}>
                                            <StatusBadge status="pending" />
                                        </Menu.Item>
                                        <Menu.Item onClick={() => handleFilterByStatus("accepted")}>
                                            <StatusBadge status="accepted" />
                                        </Menu.Item>
                                        <Menu.Item onClick={() => handleFilterByStatus("rejected")}>
                                            <StatusBadge status="rejected" />
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
                        <Table.Th miw="9rem" c="dimmed" fw={400}>For client</Table.Th>
                        <Table.Th miw="9rem" c="dimmed" fw={400}>Proposed price</Table.Th>
                        <Table.Th miw="6.3rem" c="dimmed" fw={400}>Start date</Table.Th>
                        <Table.Th miw="6.3rem" c="dimmed" fw={400}>Deadline</Table.Th>
                        <Table.Th miw="6.3rem" c="dimmed" fw={400}>Payment terms</Table.Th>
                        <Table.Th miw="7rem" c="dimmed" fw={400}>Status</Table.Th>

                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
            </Table>
            {filteredData.length === 0 && <Stack align="center" gap="0.6rem">
                <Text mt="2rem" ta="center" c="dimmed" fw={400}>No quotes found!</Text>
                <Button mb="1rem" onClick={handleClearFilters}
                    maw="8rem" c="white" variant="subtle" ta="center">Clear filters</Button>
            </Stack>}
        </ScrollArea>
        <Pagination color="primary.2" value={page} onChange={setPage} total={totalPages} />
    </Suspense>);
}
