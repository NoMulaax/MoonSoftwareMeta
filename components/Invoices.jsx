'use client'

import {
    ActionIcon,
    Anchor,
    Avatar,
    Button,
    Checkbox,
    Group,
    Menu,
    NumberFormatter,
    Pagination,
    Paper,
    Popover,
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
import { IconExternalLink, IconSearch } from "@tabler/icons-react";
import cx from 'clsx';
import exportFromJSON from 'export-from-json';
import parse from 'html-react-parser';
import Head from "next/head";
import Link from 'next/link';
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useState } from 'react';
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
import CreateModal from "./CreateModal/Invoices";
import ManageButton from './ManageButton/Invoice';
import SaveViewModal from "./reusable/SaveViewModal";
import StatusBadge from './StatusBadge/StatusBadge';
import classes from '../styles/pages/Commissions.module.css';
import { formatDateToUKTime } from "../utils/formatDate";
import { supabaseClient } from "../utils/supabaseClient";
import { timeUntil } from "../utils/timeUntil";

const itemsPerPage = 10;

export default function InvoicesPage({ settings }) {
    return <Suspense fallback={<div>Loading...</div>}>
        <Invoices settings={settings} />
    </Suspense>
}

function Invoices({ settings }) {
    const [selectedRows, setSelectedRows] = useState([]);
    const router = useRouter();
    const searchParams = useSearchParams();
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [filteredData, setFilteredData] = useState([]);
    const [allData, setAllData] = useState([]);
    const [scrolled, setScrolled] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [debouncedSearch] = useDebouncedValue(searchValue, 200);
    const [sort, setSort] = useState(searchParams.get('sort') || "created_at");
    const [sortOrder, setSortOrder] = useState(searchParams.get('descending') === 'true' ? 'descending' : 'ascending');
    const [createModalOpened, { toggle: toggleCreateModal }] = useDisclosure(false);
    const [saveViewModal, { toggle: toggleSaveViewModal }] = useDisclosure(false);
    const [filterClient, setFilterClient] = useState(searchParams.get('filter') || '');
    const [filterStatus, setFilterStatus] = useState('');
    const [clients, setClients] = useState([]);

    const handleDownloadData = () => {
        const itemsToDownload = allData.filter(item => selectedRows.includes(item.id));
        exportFromJSON({ data: itemsToDownload, fileName: "invoices", exportType: exportFromJSON.types.csv })
    }

    useEffect(() => {
        async function fetchData() {
            try {
                const { data } = await supabaseClient.from('panel_invoices')
                    .select('*, client ( id, email, username, avatar_url )')
                    .order(sort, { ascending: sortOrder !== 'descending' });

                const { data: clients } = await supabaseClient.from('panel_clients').select('id, email, username, avatar_url');

                setAllData(data || []);
                setClients(clients || []);
            } catch (error) {
                console.log(error)
            }
        }

        fetchData();
    }, []);

    const handleFilterChange = (type, value) => {
        if (type === 'client') {
            setFilterClient(value);
        } else if (type === 'status') {
            setFilterStatus(value);
        }
    };

    const compareFunction = (a, b) => {
        let comparison = 0;

        switch (sort) {
            case 'created_at':
                comparison = new Date(a.created_at) - new Date(b.created_at);
                break;
            case 'amount':
                comparison = new Date(a.amount) - new Date(b.amount);
                break;
            case 'client':
                comparison = a.client.id.localeCompare(b.client.id);
                break;
            case 'due_date':
                comparison = new Date(a.due_date) - new Date(b.due_date);
                break;
            case 'paid_at':
                comparison = new Date(a.due_date) - new Date(b.due_date);
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
                return ((item.id.toLowerCase().includes((debouncedSearch || '').toLowerCase()) || item.title.toLowerCase().includes((debouncedSearch || '').toLowerCase()) || item.client.username.toLowerCase().includes((debouncedSearch || '').toLowerCase())) && (filterClient === '' || item.client.id === filterClient) && (filterStatus === '' || item.status === filterStatus));
            })
            .sort(compareFunction);

        return [...pinnedItems, ...filteredAndSortedUnpinnedItems];
    };

    useEffect(() => {
        setPage(parseInt(searchParams.get('page') || 1));
        setFilterClient(searchParams.get('filter') || '');
        setFilterStatus(searchParams.get('status') || '');
        setSearchValue(searchParams.get('search') || '')
        setSort(searchParams.get('sort') || 'created_at');
        setSortOrder(searchParams.get('descending') === 'true' ? 'descending' : 'ascending');
    }, [router.query]);


    useEffect(() => {
        if (typeof window !== 'undefined') {
            const queryParams = new URLSearchParams(window.location.search);
            queryParams.set('page', page);
            queryParams.set('filter', filterClient);
            queryParams.set('status', filterStatus);
            queryParams.set('sort', sort);
            queryParams.set('descending', sortOrder === 'descending');
            queryParams.set('search', debouncedSearch);
            const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
            if (window.location.search !== `?${queryParams.toString()}`) {
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

    const handleCopyInvoiceId = (id) => {
        navigator.clipboard.writeText(id);
        notifications.show({
            title: 'Done!', message: 'Invoice ID copied to clipboard', color: 'green',
        })
    }

    const handleClearFilters = () => {
        setSearchValue('');
        if (typeof window !== 'undefined') {
            const queryParams = new URLSearchParams(window.location.search);
            queryParams.set('sort', 'created_at');
            queryParams.set('descending', 'false');
            queryParams.delete('filter');
            queryParams.delete('status');
            const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
            window.history.replaceState(null, '', newUrl);
        }
        setFilterClient('');
        setFilterStatus('');
    };

    const handleUpdate = (payload) => {
        const newData = [payload, ...filteredData];
        setAllData(newData);
    };

    const handlePinRefresh = (id, pinned) => {
        handleEditRefresh(id, { pinned: pinned });
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
                {console.log(row)}
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
                <Paper maw="4rem" className="pointer" onClick={() => handleCopyInvoiceId(row.id)} p="0.3rem 0.3rem">
                    <Text lh={1.2} size="xs" lineClamp={1}>{row.id}</Text>
                </Paper>
            </Group>
        </Table.Td>
        <Table.Td>{formatDateToUKTime(row.created_at)}</Table.Td>
        <Table.Td><NumberFormatter prefix={settings?.currency_prefix} value={row.amount} /> </Table.Td>
        <Table.Td><StatusBadge status={row.status} /></Table.Td>
        <Table.Td maw="6rem">
            {row.stripe_invoice_id ? <Paper className="pointer" onClick={() => handleCopyInvoiceId(row.stripe_invoice_id)} p="0.3rem 0.3rem">
                <Text lh={1.2} size="xs" lineClamp={1}>{row.stripe_invoice_id.slice(0, 13)}...</Text>
            </Paper> : "N/A"}
        </Table.Td>
        <Table.Td>{row.link ? <Anchor c="bright" size="sm" fw={600} href={row.link} target="_blank" rel="noopener noreferrer">
            <Group gap="0.4rem">
                <Text size="sm">View invoice</Text>
                <IconExternalLink size="1rem" />
            </Group>
        </Anchor> : "N/A"}</Table.Td>
        <Table.Td>{row.stripe_invoice_id ? <Anchor c="bright" size="sm" fw={600} href={row.type === 'stripe' ? `https://dashboard.stripe.com/invoices/${row.stripe_invoice_id}` : `https://www.paypal.com/invoice/p/#${row.stripe_invoice_id.replaceAll("-", "")}`} target="_blank" rel="noopener noreferrer">
            <Group gap="0.4rem">
                <Text size="sm">Open in {row.type === 'stripe' ? "Stripe" : "PayPal"}</Text>
                <IconExternalLink size="1rem" />
            </Group>
        </Anchor> : "N/A"}</Table.Td>
        <Table.Td>{row.paid_at ? timeUntil(new Date(row.paid_at)) : "Not paid"}</Table.Td>
        <Table.Td>{row.due_date ? timeUntil(new Date(row.due_date)) : "Not due"}</Table.Td>
        <Table.Td>
            {row.client?.username ?
                <Group component={Link}
                    href={"/clients?page=1&sort=username&descending=false&search=" + row.client.username}
                    gap="0.6rem">
                    <Avatar size="1.4rem"
                        style={{ filter: row.paid ? "brightness(50%)" : "none" }}
                        src={row.client.avatar_url} />
                    <Text size="sm" fw={300}>{row.client.username}</Text>
                </Group> : <Text c="dimmed">None</Text>}
        </Table.Td>
        <Table.Td><Popover>
            <Popover.Target>
                <Text className="pointer" c="bright" size="sm">View</Text>
            </Popover.Target>
            <Popover.Dropdown maw="30rem">
                <Text>{parse(row.title || "No title")}</Text>
            </Popover.Dropdown>
        </Popover></Table.Td>
        <Table.Td><Popover>
            <Popover.Target>
                <Text className="pointer" c="bright" size="sm">View</Text>
            </Popover.Target>
            <Popover.Dropdown maw="30rem">
                <Text>{parse(row.memo || "No memo")}</Text>
            </Popover.Dropdown>
        </Popover></Table.Td>
        <Table.Td fw={300} c="white"><ManageButton key={JSON.stringify(row)} invoice={row}
            handleDeleteRefresh={handleDeleteRefresh}
            handlePinRefresh={handlePinRefresh}
            handleEditRefresh={handleEditRefresh} /></Table.Td>

    </Table.Tr>));

    return (<>
        <Head>
            <title>Invoices | Ember</title>
        </Head>

        <SaveViewModal opened={saveViewModal} data={
            {
                page: "invoices",
                sort: sort,
                sortOrder: sortOrder,
                search: debouncedSearch,
                filterClient,
                filterStatus
            }
        } onClose={toggleSaveViewModal} />

        <CreateModal currencyPrefix={settings?.currency_prefix} clients={clients} open={createModalOpened} toggleCreateModal={toggleCreateModal} handleUpdate={handleUpdate} />

        <Paper radius={6} p="0.4rem 0.8rem" mb="0.6rem">
            <Group justify="space-between">
                <Group>
                    <Menu closeOnItemClick={false} width={200} withArrow shadow="md">
                        <Menu.Target>
                            <ActionIcon size="sm" bg="none">
                                <PiArrowsDownUpBold size="1.4rem" />
                            </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                            <Group className="pointer" justify="space-between">
                                <Menu.Label>Sort by</Menu.Label>
                                <Text c="red" size="xs" onClick={() => {
                                    setSort("created_at");
                                    setSortOrder("ascending");
                                }}>Clear sorting</Text>
                            </Group>
                            <Menu.Item mb="0.4rem">
                                <Switch color="primary.3" size="sm" label="Descending" onChange={toggleSortOrder}
                                    checked={sortOrder === 'descending'} />
                            </Menu.Item>
                            <Menu.Item onClick={() => setSort("created_at")}
                                c={sort === "created_at" ? "primary.9" : "dimmed"}>
                                <Group gap="0.6rem">
                                    <PiArrowsDownUpBold size="1rem" />
                                    <Text size="sm">Created at</Text>
                                </Group>
                            </Menu.Item>
                            <Menu.Item onClick={() => setSort("amount")}
                                c={sort === "amount" ? "primary.9" : "dimmed"}>
                                <Group gap="0.6rem">
                                    <PiArrowsDownUpBold size="1rem" />
                                    <Text size="sm">Amount</Text>
                                </Group>
                            </Menu.Item>
                            <Menu.Item onClick={() => setSort("client")} c={sort === "client" ? "primary.9" : "dimmed"}>
                                <Group gap="0.6rem">
                                    <PiArrowsDownUpBold size="1rem" />
                                    <Text size="sm">Client</Text>
                                </Group>
                            </Menu.Item>
                            <Menu.Item onClick={() => setSort("due_date")}
                                c={sort === "due_date" ? "primary.9" : "dimmed"}>
                                <Group gap="0.6rem">
                                    <PiArrowsDownUpBold size="1rem" />
                                    <Text size="sm">Due date</Text>
                                </Group>
                            </Menu.Item>
                            <Menu.Item onClick={() => setSort("paid_at")}
                                c={sort === "paid_at" ? "primary.9" : "dimmed"}>
                                <Group gap="0.6rem">
                                    <PiArrowsDownUpBold size="1rem" />
                                    <Text size="sm">Paid at</Text>
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
                            <Group className="pointer" justify="space-between">
                                <Menu.Label>Filter by</Menu.Label>
                                <Text c="red" size="xs" onClick={() => {
                                    setFilterClient('');
                                    setFilterStatus('');
                                }}>Clear filter</Text>
                            </Group>
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
                                        <Menu.Item onClick={() => handleFilterChange("status", 'paid')}>
                                            <StatusBadge status="paid" />
                                        </Menu.Item>
                                        <Menu.Item onClick={() => handleFilterChange("status", 'unpaid')}>
                                            <StatusBadge status="unpaid" />
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
                                const newQuery = { ...router.query, search: '' };
                                const queryParams = new URLSearchParams(newQuery);
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
                    {(filterClient !== '' || filterStatus !== '' || debouncedSearch !== '') && <Group w="100%">
                        <Text size="sm">You have filters applied</Text>
                        <Text className="pointer" onClick={handleClearFilters} ml="0.6rem" size="sm" td="underline">Clear
                            filters</Text>
                    </Group>}
                </Group>
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
                        <Table.Th c="dimmed" fw={400}>Created at</Table.Th>
                        <Table.Th c="dimmed" fw={400}>Amount</Table.Th>
                        <Table.Th miw="6rem" c="dimmed" fw={400}>Status</Table.Th>
                        <Table.Th c="dimmed" fw={400}>Invoice ID</Table.Th>
                        <Table.Th c="dimmed" fw={400}>Payment Link</Table.Th>
                        <Table.Th c="dimmed" fw={400}>Open in account</Table.Th>
                        <Table.Th c="dimmed" fw={400}>Paid at</Table.Th>
                        <Table.Th c="dimmed" fw={400}>Due at</Table.Th>
                        <Table.Th c="dimmed" fw={400}>Client</Table.Th>
                        <Table.Th c="dimmed" fw={400}>Title</Table.Th>
                        <Table.Th c="dimmed" fw={400}>Memo</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
            </Table>
            {filteredData.length === 0 && <Stack align="center" gap="0.6rem">
                <Text mt="2rem" ta="center" c="dimmed" fw={400}>No invoices found!</Text>
                <Button mb="1rem" onClick={handleClearFilters}
                    maw="8rem" c="white" variant="subtle" ta="center">Clear filters</Button>
            </Stack>}
        </ScrollArea>
        <Pagination color="primary.2" value={page} onChange={setPage} total={totalPages} />
    </>);
}
