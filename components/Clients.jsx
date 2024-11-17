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
    TextInput,
    Tooltip
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
import { PiArrowsDownUpBold, PiDownloadSimple, PiXBold } from "react-icons/pi";
import { TbEyePlus, TbFilterCancel } from "react-icons/tb";
import CreateModal from "./CreateModal/Clients";
import ManageButton from "./ManageButton/Clients";
import SaveViewModal from "./reusable/SaveViewModal";
import classes from '../styles/pages/Commissions.module.css';
import { formatDateToUKTime } from "../utils/formatDate";
import { supabaseClient } from "../utils/supabaseClient";

const itemsPerPage = 10;

export default function ClientsPage({ currencyPrefix }) {
    return <Suspense fallback={<div>Loading...</div>}>
        <Clients currencyPrefix={currencyPrefix} />
    </Suspense>
}

function Clients({ currencyPrefix }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [selectedRows, setSelectedRows] = useState([]);
    const [page, setPage] = useState(1);
    const [allData, setAllData] = useState([]);
    const [totalPages, setTotalPages] = useState(Math.ceil(allData.length / itemsPerPage));
    const [filteredData, setFilteredData] = useState(allData);
    const [scrolled, setScrolled] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [debouncedSearch] = useDebouncedValue(searchValue, 200);
    const [sort, setSort] = useState(searchParams.get('sort') || "username");
    const [sortOrder, setSortOrder] = useState(searchParams.get('descending') === 'true' ? 'descending' : 'ascending');
    const [saveViewModal, { toggle: toggleSaveViewModal }] = useDisclosure(false);
    const [createModalOpened, { toggle: toggleCreateModal }] = useDisclosure(false);

    const handleDownloadData = () => {
        const itemsToDownload = allData.filter(item => selectedRows.includes(item.id));
        exportFromJSON({ data: itemsToDownload, fileName: "clients", exportType: exportFromJSON.types.csv })
    }

    useEffect(() => {
        async function fetchClients() {
            const { data, error } = await supabaseClient
                .from('panel_clients')
                .select(`
                    id, 
                    discord, 
                    email, 
                    avatar_url, 
                    username,
                    created_at,
                    panel_commissions ( total_paid, status )
                `);

            if (error) {
                console.error("Error fetching clients:", error);
                return;
            }

            const enhancedData = data.map(client => ({
                ...client,
                total_commissions: client.panel_commissions.length,
                total_revenue: client.panel_commissions.reduce((acc, curr) => acc + curr.total_paid, 0),
            }));

            setAllData(enhancedData);
        }

        fetchClients();
    }, []);

    useEffect(() => {
        const currentPage = parseInt(searchParams.get('page')) || 1;
        const currentSort = searchParams.get('sort') || 'username';
        const currentSortOrder = searchParams.get('descending') === 'true' ? 'descending' : 'ascending';
        const currentSearchValue = searchParams.get('search') || '';

        setPage(currentPage);
        setSort(currentSort);
        setSortOrder(currentSortOrder);
        setSearchValue(currentSearchValue);
    }, [searchParams]);


    useEffect(() => {
        const query = { ...router.query };
        if (page) query.page = page;
        if (sort) query.sort = sort;
        query.descending = sortOrder === 'descending';
        if (debouncedSearch) query.search = debouncedSearch;

        if (typeof window !== 'undefined') {
            const queryParams = new URLSearchParams(window.location.search);
            Object.entries(query).forEach(([key, value]) => {
                queryParams.set(key, value);
            });
            const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
            if (window.location.search !== `?${queryParams.toString()}`) {
                window.history.replaceState(null, '', newUrl);
            }
        }
    }, [page, sort, sortOrder, debouncedSearch]);

    useEffect(() => {
        const lowercasedFilter = (debouncedSearch || '').toLowerCase();
        const filteredAndSortedData = allData
            .filter(item => {
                return ((item.id.toLowerCase().includes(lowercasedFilter)
                    || item.username.toLowerCase().includes(lowercasedFilter)
                    || item.email.toLowerCase().includes(lowercasedFilter)
                    || item.discord.toLowerCase().includes(lowercasedFilter)));
            })
            .sort(compareFunction);

        setFilteredData(filteredAndSortedData.slice((page - 1) * itemsPerPage, page * itemsPerPage));
        setTotalPages(Math.ceil(filteredAndSortedData.length / itemsPerPage));
    }, [debouncedSearch, allData, sort, sortOrder, page]);


    const toggleSortOrder = () => {
        const newSortOrder = sortOrder === 'ascending' ? 'descending' : 'ascending';
        setSortOrder(newSortOrder);
        const queryParams = new URLSearchParams(window.location.search);
        queryParams.set('descending', newSortOrder === 'descending');
        const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
        window.history.replaceState(null, '', newUrl);
    };

    const compareFunction = (a, b) => {
        let comparison = 0;

        switch (sort) {
            case 'username':
                comparison = a.username.localeCompare(b.username);
                break;
            case 'discord':
                comparison = a.discord.localeCompare(b.discord);
                break;
            case 'total_commissions':
                comparison = b.total_commissions - a.total_commissions;
                break;
            case 'total_revenue':
                comparison = b.total_revenue - a.total_revenue;
                break;
            case 'created_at':
                comparison = new Date(a.created_at) - new Date(b.created_at);
                break;
            default:
                break;
        }
        return sortOrder === 'ascending' ? comparison : -comparison;
    };

    const handleCopyClientId = (id) => {
        navigator.clipboard.writeText(id);
        notifications.show({
            title: 'Done!', message: 'Client ID copied to clipboard', color: 'green',
        })
    }

    const handleClearFilters = () => {
        setSearchValue('');
        setSort('username');
        setSortOrder('ascending');
        setSelectedRows([]);
        if (typeof window !== 'undefined') {
            const queryParams = new URLSearchParams(window.location.search);
            queryParams.delete('search');
            queryParams.set('sort', 'username');
            queryParams.set('descending', 'false');
            const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
            window.history.replaceState(null, '', newUrl);
        }
    }

    const handleUpdate = (data) => {
        setFilteredData([data, ...filteredData]);
    }

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

    const rows = filteredData.map((row) => (
        <Table.Tr key={row.id}>
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
                    <Paper maw="4rem" className="pointer" onClick={() => handleCopyClientId(row.id)} p="0.3rem 0.3rem">
                        <Text lh={1.2} size="xs" lineClamp={1}>{row.id}</Text>
                    </Paper>
                </Group>
            </Table.Td>
            <Table.Td miw="10rem" c="white">
                <Group gap="0.6rem">
                    <Avatar size="1.4rem" src={row.avatar_url} />
                    <Text size="sm" fw={300}>{row.username}</Text>
                </Group>
            </Table.Td>
            <Table.Td miw="13rem" c="white"><Text size="sm" component={Link}
                href={"mailto:" + row.email}>{row.email}</Text></Table.Td>
            <Table.Td fw={300} c="white">{row.discord}</Table.Td>
            <Table.Td fw={300} c="white"><Text td="underline" size="sm" component={Link}
                href={"/commissions?page=1&filter=" + row.id + "&sort=deadline&descending=false"}>{row.panel_commissions?.length || 0}
            </Text>
            </Table.Td>
            <Table.Td fw={300}
                c="white"><NumberFormatter prefix={currencyPrefix} value={row.panel_commissions?.reduce((acc, curr) => acc + curr.total_paid, 0) || 0} /></Table.Td>
            <Table.Td fw={300} c="white">{formatDateToUKTime(row.created_at)}</Table.Td>
            <Table.Td fw={300} c="white"><ManageButton key={JSON.stringify(row)} client={row}
                handleDeleteRefresh={handleDeleteRefresh}
                handleEditRefresh={handleEditRefresh} /></Table.Td>
        </Table.Tr>
    ));

    return (<>
        <Head>
            <title>Clients | Ember</title>
        </Head>

        <SaveViewModal opened={saveViewModal} data={
            {
                page: "clients",
                sort: sort,
                sortOrder: sortOrder,
                search: debouncedSearch
            }
        } onClose={toggleSaveViewModal} />

        <CreateModal currencyPrefix={currencyPrefix} open={createModalOpened} toggleCreateModal={toggleCreateModal} handleUpdate={handleUpdate} />

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
                                    setSort("username");
                                    setSortOrder("ascending");
                                }}>Clear sorting</Text>
                            </Flex>
                            <Menu.Item mb="0.4rem">
                                <Switch color="primary.3" size="sm" label="Descending" onChange={toggleSortOrder}
                                    checked={sortOrder === 'descending'} />
                            </Menu.Item>
                            <Menu.Item onClick={() => setSort("username")}
                                color={sort === "username" ? "primary.9" : "dimmed"}>
                                <Group gap="0.6rem">
                                    <PiArrowsDownUpBold size="1rem" />
                                    <Text size="sm">Username</Text>
                                </Group>
                            </Menu.Item>
                            <Menu.Item onClick={() => setSort("discord")}
                                color={sort === "discord" ? "primary.9" : "dimmed"}>
                                <Group gap="0.6rem">
                                    <PiArrowsDownUpBold size="1rem" />
                                    <Text size="sm">Discord</Text>
                                </Group>
                            </Menu.Item>
                            <Menu.Item onClick={() => setSort("total_commissions")}
                                color={sort === "total_commissions" ? "primary.9" : "dimmed"}>
                                <Group gap="0.6rem">
                                    <PiArrowsDownUpBold size="1rem" />
                                    <Text size="sm">Total commissions</Text>
                                </Group>
                            </Menu.Item>
                            <Menu.Item onClick={() => setSort("total_revenue")}
                                color={sort === "total_revenue" ? "primary.9" : "dimmed"}>
                                <Group gap="0.6rem">
                                    <PiArrowsDownUpBold size="1rem" />
                                    <Text size="sm">Total Revenue</Text>
                                </Group>
                            </Menu.Item>
                            <Menu.Item onClick={() => setSort("created_at")}
                                color={sort === "created_at" ? "primary.9" : "dimmed"}>
                                <Group gap="0.6rem">
                                    <PiArrowsDownUpBold size="1rem" />
                                    <Text size="sm">Date Created</Text>
                                </Group>
                            </Menu.Item>

                        </Menu.Dropdown>
                    </Menu>
                    <ActionIcon bg="none" disabled>
                        <TbFilterCancel color="gray" size="1.2rem" />
                    </ActionIcon>

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
                        <ActionIcon onClick={toggleSaveViewModal} bg="dark.7">
                            <TbEyePlus size="1.2rem" />
                        </ActionIcon>
                    </Tooltip>
                    {debouncedSearch !== '' && <Flex w="100%">
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
                        <Table.Th miw="9rem" c="dimmed" fw={400}>Name</Table.Th>
                        <Table.Th miw="6.3rem" c="dimmed" fw={400}>Email</Table.Th>
                        <Table.Th miw="6.3rem" c="dimmed" fw={400}>Discord</Table.Th>
                        <Table.Th miw="6.3rem" c="dimmed" fw={400}>Total commissions</Table.Th>
                        <Table.Th miw="6.3rem" c="dimmed" fw={400}>Total revenue</Table.Th>
                        <Table.Th miw="6.3rem" c="dimmed" fw={400}>Client since</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
            </Table>
            {filteredData.length === 0 && <Stack align="center" gap="0.6rem">
                <Text mt="2rem" ta="center" c="dimmed" fw={400}>No clients found!</Text>
                <Button mb="1rem" onClick={handleClearFilters}
                    maw="8rem" c="white" variant="subtle" ta="center">Clear filters</Button>
            </Stack>}
        </ScrollArea>
        <Pagination color="primary.2" value={page} onChange={setPage} total={totalPages} />
    </>);
}
