'use client'

import {
    Avatar,
    Button,
    Combobox,
    Group,
    InputBase,
    Menu,
    Modal,
    NumberInput,
    Select,
    Text,
    TextInput,
    useCombobox
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { matches, useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconDots } from "@tabler/icons-react";
import React, { useState } from "react";
import {
    PiBellSimpleRingingBold,
    PiCaretRightBold,
    PiClockCountdownBold,
    PiCopyBold,
    PiNotePencilBold,
    PiSubtitlesBold,
    PiTrashBold
} from "react-icons/pi";
import { useAllClients } from "../../hooks/useAllClients";
import handleDeleteEntry from "../../utils/handleDeleteEntry";
import handleStatusChange from "../../utils/handleStatusChange";
import { supabaseClient } from "../../utils/supabaseClient";
import StatusBadge from "../StatusBadge/StatusBadge";

export default function ManageButton({currencyPrefix, quote, handleStatusRefresh, handleEditRefresh, handleDeleteRefresh}) {
    const clients = useAllClients();
    const [editModalOpened, setEditModalOpened] = useState(false);
    const [confirmDeleteModalOpened, {toggle: toggleDeleteConfirmModal}] = useDisclosure(false);
    const clientCombobox = useCombobox({
        onDropdownClose: () => clientCombobox.resetSelectedOption(),
    });
    const form = useForm({
        initialValues: {
            title: quote.title,
            proposed_amount: quote.proposed_amount,
            client: quote.client.id,
            start_date: new Date(quote.start_date),
            deadline: new Date(quote.deadline),
            payment_terms: quote.payment_terms,
            status: quote.status,
        }, validate: {
            title: matches(/^.{3,30}$/, 'Title must be between 3 and 30 characters'),
        }
    });

    const handleCopyQuoteLink = () => {
        navigator.clipboard.writeText("https://" + window.location.hostname + "/quote/" + quote.id);
        notifications.show({
            title: 'Done!',
            message: 'Quote link copied to clipboard. Share with your client to allow them to accept/reject it.',
            color: 'green',
        })
    }

    const handleEditSave = async () => {
        const {error} = await supabaseClient.from('panel_quotes').update({
            title: form.values.title,
            proposed_amount: form.values.proposed_amount,
            client: form.values.client,
            start_date: form.values.start_date,
            deadline: form.values.deadline,
            payment_terms: form.values.payment_terms,
        }).eq('id', quote.id);
        if (error) {
            notifications.show({
                title: 'Error!', message: 'Something went wrong', color: 'red',
            })
        } else {
            handleEditRefresh(quote.id, {...form.values, client: clients.find(item => item.id === form.values.client)})
            notifications.show({
                title: 'Done!', message: 'Quote ' + quote.id + ' has been edited!', color: 'green',
            })
        }
        setEditModalOpened(false);
    }

    const handleDelete = () => {
        toggleDeleteConfirmModal();
        handleDeleteEntry('panel_quotes', quote.id)
        handleDeleteRefresh(quote.id);
    }

    const selectedClient = clients?.find(item => item.id === form.values.client);

    return (<>
        <Modal size="48rem" opened={editModalOpened}
               onClose={() => setEditModalOpened(false)} title={"Edit quote " + quote.id}>
            <TextInput leftSection={<PiSubtitlesBold size="1.1rem"/>} {...form.getInputProps('title')} mb="1rem"
                       description="The title of the quote's commission"
                       label="Title" placeholder="Title" required/>
            <Group mb="1rem" grow>
                <Combobox
                    label="Client"
                    store={clientCombobox}
                    onOptionSubmit={(val) => {
                        form.setFieldValue("client", val.id);
                        clientCombobox.closeDropdown();
                    }}
                >
                    <Combobox.Target>
                        <InputBase
                            component="button"
                            type="button"
                            description="Select a client"
                            pointer
                            rightSection={<Combobox.Chevron/>}
                            onClick={() => clientCombobox.toggleDropdown()}
                            rightSectionPointerEvents="none"
                            placeholder="Select a client"
                        >
                            {selectedClient ? <Group gap="0.6rem">
                                <Avatar size="1.4rem" src={selectedClient.avatar_url}/>
                                <Text size="sm">{selectedClient.username}</Text>
                            </Group> : "Select a client"}
                        </InputBase>
                    </Combobox.Target>

                    <Combobox.Dropdown>
                        <Combobox.Options>
                            {clients?.map((item) => (
                                <Combobox.Option value={item} key={item.id}>
                                    <Group gap="0.6rem">
                                        <Avatar size="1.4rem" src={item.avatar_url}/>
                                        <Text size="sm">{item.username}</Text>
                                    </Group>
                                </Combobox.Option>
                            ))}
                        </Combobox.Options>
                    </Combobox.Dropdown>
                </Combobox>
                <NumberInput startValue={form.values.proposed_amount} min={0} leftSection={currencyPrefix} {...form.getInputProps('proposed_amount')}
                             description="Total value of the quote's commission"
                             label="Proposed price"
                             placeholder="Proposed price"
                             required/>
                <DateTimePicker leftSection={<PiClockCountdownBold size="1.1rem"/>}
                                valueFormat="DD MMM YYYY hh:mm A" {...form.getInputProps('start_date')}
                                description="Start date for the quote's commission"
                                label="Start date"
                                required/>
            </Group>
            <Group grow>

                <DateTimePicker leftSection={<PiClockCountdownBold size="1.1rem"/>}
                                valueFormat="DD MMM YYYY hh:mm A" {...form.getInputProps('deadline')}
                                description="Deadline for the quote's commission"
                                label="Deadline"
                                required/>
                <Select
                    label="Payment terms"
                    description="The commission's payment terms"
                    placeholder="Pick value"
                    {...form.getInputProps('payment_terms')}
                    data={[
                        {value: '100_before', label: 'Full payment before'},
                        {value: '100_after', label: 'Full payment after'},
                        {value: '50_50', label: '50% before, 50% after'},
                        {value: '25_75', label: '25% before, 75% after'},
                        {value: 'custom', label: 'Other'},
                    ]}/>
            </Group>
            <Group mt="1.4rem" justify="space-between">
                <Button c="white" onClick={() => setEditModalOpened(false)} size="xs"
                        variant="light">Cancel</Button>
                <Button onClick={handleEditSave} size="xs">Save</Button>
            </Group>
        </Modal>

        <Modal opened={confirmDeleteModalOpened} onClose={toggleDeleteConfirmModal} title="Delete quote">
            <Text c="dimmed" fw={400} mb="1rem">Are you sure you want to delete this quote?</Text>
            <Group mt="1.4rem" justify="space-between">
                <Button c="white" onClick={toggleDeleteConfirmModal} size="xs" variant="light">Cancel</Button>
                <Button c="white" size="xs" onClick={handleDelete} color="red" ml="0.5rem">Delete</Button>
            </Group>
        </Modal>

        <Menu shadow="md" width={200}>
            <Menu.Target>
                <IconDots className="pointer"/>
            </Menu.Target>

            <Menu.Dropdown>
                <Menu.Label>Manage</Menu.Label>
                <Menu.Item onClick={() => setEditModalOpened(true)} leftSection={<PiNotePencilBold/>}>
                    Edit
                </Menu.Item>
                <Menu.Item onClick={handleCopyQuoteLink} leftSection={<PiCopyBold/>}>
                    Copy quote link
                </Menu.Item>
                <Menu.Item p={0}>
                    <Menu withinPortal={false} position="right" trigger="hover" shadow="md" width={200}>
                        <Menu.Target p="0.3rem 0.8rem">
                            <Group justify="space-between">
                                <Group gap="0.6rem">
                                    <PiBellSimpleRingingBold/>
                                    <Text size="sm">Mark as</Text>
                                </Group>
                                <PiCaretRightBold size={14}/>
                            </Group>
                        </Menu.Target>

                        <Menu.Dropdown>
                            <Menu.Item
                                onClick={() => handleStatusChange('panel_quotes', quote.id, "pending", handleStatusRefresh)}>
                                <StatusBadge status="pending"/>
                            </Menu.Item>
                            <Menu.Item
                                onClick={() => handleStatusChange('panel_quotes', quote.id, "accepted", handleStatusRefresh)}>
                                <StatusBadge status="accepted"/>
                            </Menu.Item>
                            <Menu.Item
                                onClick={() => handleStatusChange('panel_quotes', quote.id, "rejected", handleStatusRefresh)}>
                                <StatusBadge status="rejected"/>
                            </Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                </Menu.Item>
                <Menu.Divider/>
                <Menu.Item onClick={toggleDeleteConfirmModal} color="red" leftSection={<PiTrashBold size={16}/>}>
                    Delete
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    </>)
}