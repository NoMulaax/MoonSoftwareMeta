'use client'

import {
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
    PiCheckBold,
    PiClockCountdownBold,
    PiCoinsBold,
    PiLightningBold,
    PiNotePencilBold,
    PiSubtitlesBold,
    PiTrashBold
} from "react-icons/pi";
import handleDeleteEntry from "../../utils/handleDeleteEntry";
import handleStatusChange from "../../utils/handleStatusChange";
import { supabaseClient } from "../../utils/supabaseClient";
import StatusBadge from "../StatusBadge/StatusBadge";

export default function ManageButton({
    currencyPrefix,
    request,
    handleStatusRefresh,
    handleDeleteRefresh,
    handleEditRefresh,
    handleMarkAsPaidRefresh,
}) {
    const [editModalOpened, setEditModalOpened] = useState(false);
    const [confirmDeleteModalOpened, { toggle: toggleDeleteConfirmModal }] = useDisclosure(false);
    const combobox = useCombobox({
        onDropdownClose: () => combobox.resetSelectedOption(),
    });
    const commissionCombobox = useCombobox({
        onDropdownClose: () => commissionCombobox.resetSelectedOption(),
    });

    const form = useForm({
        initialValues: {
            description: request.description,
            offered_amount: request.offered_amount,
            deadline: new Date(request.deadline),
            paid: request.paid,
            status: request.status,
        }, validate: {
            offered_amount: matches(/^[0-9]{1,8}$/, 'Total paid must be between 1 and 8 digits'),
        }
    });

    const handleEditSave = async () => {
        setEditModalOpened(false);
        notifications.show({
            title: 'Done!', message: 'Request ' + request.id + ' has been edited!', color: 'green',
        })

        const { error } = await supabaseClient.from('panel_requests').update({
            description: form.values.description,
            offered_amount: form.values.offered_amount,
            deadline: form.values.deadline,
            paid: form.values.paid,
            status: form.values.status,
        }).eq('id', request.id);
        if (error) {
            notifications.show({
                title: 'Error!', message: 'Something went wrong', color: 'red',
            })
        } else {
            handleEditRefresh(request.id, form.values)
        }
    }

    const handleDelete = () => {
        toggleDeleteConfirmModal();
        handleDeleteEntry('panel_requests', request.id)
        handleDeleteRefresh(request.id);
    }

    const handleMarkAsPaid = async () => {
        const { error } = await supabaseClient
            .from('panel_requests')
            .update({ paid: true })
            .eq('id', request.id);
        if (error) {
            notifications.show({
                title: 'Error!', message: 'Something went wrong', color: 'red',
            })
        } else {
            notifications.show({
                title: 'Done!', message: 'Request marked as paid!', color: 'green',
            })
        }
        handleMarkAsPaidRefresh(request.id)
    }

    return (<>
        <Modal size="48rem" opened={editModalOpened}
            onClose={() => setEditModalOpened(false)} title={"Edit request " + request.id}>
            <TextInput leftSection={<PiSubtitlesBold size="1.1rem" />} {...form.getInputProps('description')} mb="1rem"
                description="The description of the request"
                label="Description" placeholder="Description" required />
            <Group mb="1rem" grow>
                <NumberInput min={0} leftSection={currencyPrefix} {...form.getInputProps('offered_amount')}
                    description="Offered amount for the request"
                    label="Offered amount"
                    placeholder="Offered amount"
                    required />
                <DateTimePicker leftSection={<PiClockCountdownBold size="1.1rem" />}
                    valueFormat="DD MMM YYYY hh:mm A" {...form.getInputProps('deadline')}
                    description="Deadline for the change"
                    label="Deadline"
                    required />
            </Group>
            <Group grow>
                <Select
                    label="Paid"
                    placeholder="Pick value"
                    description="Whether the request has been paid or not"
                    {...form.getInputProps('paid')}
                    data={[
                        { value: "true", label: "Yes" },
                        { value: "false", label: "No" },
                    ]}
                />
                <Combobox
                    label="Status"
                    store={combobox}
                    onOptionSubmit={(val) => {
                        form.setFieldValue("status", val);
                        combobox.closeDropdown();
                    }}
                >
                    <Combobox.Target>
                        <InputBase
                            component="button"
                            type="button"
                            description="The current status of this change"
                            pointer
                            rightSection={<Combobox.Chevron />}
                            onClick={() => combobox.toggleDropdown()}
                            rightSectionPointerEvents="none"
                        >
                            {form.values.status ? (<StatusBadge status={form.values.status} />) : (
                                <Input.Placeholder>Pick value</Input.Placeholder>)}
                        </InputBase>
                    </Combobox.Target>

                    <Combobox.Dropdown>
                        <Combobox.Options>{[{ value: 'not_started' }, { value: 'in_progress' }, { value: 'paused' }, { value: 'completed' }, { value: 'cancelled' }, { value: 'requested' }, { value: 'rejected' }].map((item) => (
                            <Combobox.Option value={item.value} key={item.value}>
                                <StatusBadge status={item.value} />
                            </Combobox.Option>))}</Combobox.Options>
                    </Combobox.Dropdown>
                </Combobox>
            </Group>
            <Group mt="1.4rem" justify="space-between">
                <Button c="white" onClick={() => setEditModalOpened(false)} size="xs"
                    variant="light">Cancel</Button>
                <Button onClick={handleEditSave} size="xs">Save</Button>
            </Group>
        </Modal>

        <Modal opened={confirmDeleteModalOpened} onClose={toggleDeleteConfirmModal} title="Delete commission">
            <Text c="dimmed" fw={400} mb="1rem">Are you sure you want to delete this commission?</Text>
            <Group mt="1.4rem" justify="space-between">
                <Button c="white" onClick={toggleDeleteConfirmModal} size="xs" variant="light">Cancel</Button>
                <Button c="white" size="xs" onClick={handleDelete} color="red" ml="0.5rem">Delete</Button>
            </Group>
        </Modal>

        <Menu shadow="md" width={200}>
            <Menu.Target>
                <IconDots className="pointer" />
            </Menu.Target>

            <Menu.Dropdown>
                <Menu.Label>Manage</Menu.Label>
                <Menu.Item onClick={() => setEditModalOpened(true)} leftSection={<PiNotePencilBold />}>
                    Edit
                </Menu.Item>
                <Menu.Item p={0}>
                    <Menu withinPortal={false} position="right" trigger="hover" shadow="md" width={200}>
                        <Menu.Target p="0.3rem 0.8rem">
                            <Group justify="space-between">
                                <Group gap="0.6rem">
                                    <PiBellSimpleRingingBold />
                                    <Text size="sm">Set status</Text>
                                </Group>
                                <PiCaretRightBold size={14} />
                            </Group>
                        </Menu.Target>

                        <Menu.Dropdown>
                            <Menu.Item onClick={() => handleStatusChange('panel_requests', request.id, "not_started", handleStatusRefresh)}>
                                <StatusBadge status="not_started" />
                            </Menu.Item>
                            <Menu.Item onClick={() => handleStatusChange('panel_requests', request.id, "in_progress", handleStatusRefresh)}>
                                <StatusBadge status="in_progress" />
                            </Menu.Item>
                            <Menu.Item onClick={() => handleStatusChange('panel_requests', request.id, "paused", handleStatusRefresh)}>
                                <StatusBadge status="paused" />
                            </Menu.Item>
                            <Menu.Item onClick={() => handleStatusChange('panel_requests', request.id, "completed", handleStatusRefresh)}>
                                <StatusBadge status="completed" />
                            </Menu.Item>
                            <Menu.Item onClick={() => handleStatusChange('panel_requests', request.id, "cancelled", handleStatusRefresh)}>
                                <StatusBadge status="cancelled" />
                            </Menu.Item>
                            <Menu.Item onClick={() => handleStatusChange('panel_requests', request.id, "requested", handleStatusRefresh)}>
                                <StatusBadge status="requested" />
                            </Menu.Item>
                            <Menu.Item onClick={() => handleStatusChange('panel_requests', request.id, "rejected", handleStatusRefresh)}>
                                <StatusBadge status="rejected" />
                            </Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                </Menu.Item>
                <Menu.Item p={0}>
                    <Menu withinPortal={false} position="right" trigger="hover" shadow="md" width={200}>
                        <Menu.Target p="0.3rem 0.8rem">
                            <Group justify="space-between">
                                <Group gap="0.6rem">
                                    <PiLightningBold />
                                    <Text size="sm">Quick actions</Text>
                                </Group>
                                <PiCaretRightBold size={14} />
                            </Group>
                        </Menu.Target>

                        <Menu.Dropdown w="16rem">
                            <Menu.Label>Mark as</Menu.Label>
                            <Menu.Item onClick={() => handleStatusChange('panel_requests', request.id, "completed", handleStatusRefresh)} c="green"
                                leftSection={<PiCheckBold />}>
                                Mark as complete
                            </Menu.Item>
                            <Menu.Item onClick={() => {
                                handleMarkAsPaid(request.id);
                            }} leftSection={<PiCoinsBold />}>
                                Mark as paid
                            </Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item onClick={toggleDeleteConfirmModal} color="red" leftSection={<PiTrashBold size={16} />}>
                    Delete
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    </>)
}