'use client'

import {
    Avatar,
    Button,
    Combobox,
    Group,
    InputBase,
    Modal,
    NumberInput,
    Text,
    TextInput,
    useCombobox
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { matches, useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import React from "react";
import { PiClockCountdownBold, PiSubtitlesBold } from "react-icons/pi";
import { supabaseClient } from "../../utils/supabaseClient";
import StatusBadge from "../StatusBadge/StatusBadge";

export default function CreateModal({currencyPrefix, commissions, open, toggleCreateModal, handleUpdate}) {
    const combobox = useCombobox({
        onDropdownClose: () => combobox.resetSelectedOption(),
    });

    const commissionCombobox = useCombobox({
        onDropdownClose: () => commissionCombobox.resetSelectedOption(),
    });

    const form = useForm({
        initialValues: {
            description: "",
            offered_amount: 0,
            commission: "",
            deadline: new Date(),
            status: "not_started",
        }, validate: {
            description: matches(/^.{3,30}$/, 'Title must be between 3 and 30 characters'),
        }
    });

    const handleCreate = async () => {
        if (form.validate().hasErrors) {
            return;
        }

        const {data, error} = await supabaseClient.from('panel_requests').insert({
            description: form.values.description,
            offered_amount: form.values.offered_amount,
            commission: selectedCommission.id,
            deadline: form.values.deadline,
            status: form.values.status,
        }).select().single();
        if (error) {
            notifications.show({
                title: 'Error!', message: 'New request could not be made!', color: 'red',
            })
        } else {
            handleUpdate({
                ...data,
                commission: {
                    title: selectedCommission.title,
                    client: {avatar_url: selectedCommission.client.avatar_url}
                }
            });
            notifications.show({
                title: 'Done!', message: 'New request has been made!', color: 'green',
            })
        }
        toggleCreateModal();
        form.reset();
    }

    const uniqueCommissions = commissions?.reduce((acc, current) => {
        const x = acc.find(item => item.id === current.id);
        if (!x) {
            return acc.concat([current]);
        } else {
            return acc;
        }
    }, []);

    const selectedCommission = uniqueCommissions.find(item => item.title === form.values.commission);

    return (<Modal size="48rem" opened={open}
                   onClose={toggleCreateModal} title="Create a new request">
        <TextInput leftSection={<PiSubtitlesBold size="1.1rem"/>} {...form.getInputProps('description')} mb="1rem"
                   description="The description of the request"
                   label="Description" placeholder="Description" required/>
        <Group mb="1rem" grow>
            <NumberInput min={0}
                         leftSection={currencyPrefix}  {...form.getInputProps('offered_amount')}
                         description="Offered amount for the request"
                         label="Offered amount"
                         placeholder="Offered amount"
                         required/>
            <Combobox
                label="Commission"
                store={commissionCombobox}
                onOptionSubmit={(val) => {
                    form.setFieldValue("commission", val.title);
                    commissionCombobox.closeDropdown();
                }}
            >
                <Combobox.Target>
                    <InputBase
                        component="button"
                        type="button"
                        description="Select a commission"
                        pointer
                        rightSection={<Combobox.Chevron/>}
                        onClick={() => commissionCombobox.toggleDropdown()}
                        rightSectionPointerEvents="none"
                        placeholder="Pick a commission"
                    >
                        {selectedCommission ? <Group gap="0.6rem">
                            <Avatar size="1.4rem" src={selectedCommission.client.avatar_url}/>
                            <Text size="sm">{selectedCommission.title}</Text>
                        </Group> : "Select a commission"}
                    </InputBase>
                </Combobox.Target>

                <Combobox.Dropdown>
                    <Combobox.Options>
                        {uniqueCommissions.map((item) => (
                            <Combobox.Option value={item} key={item.id}>
                                <Group gap="0.6rem">
                                    <Avatar size="1.4rem" src={item.client.avatar_url}/>
                                    <Text size="sm">{item.title}</Text>
                                </Group>
                            </Combobox.Option>
                        ))}
                    </Combobox.Options>
                </Combobox.Dropdown>
            </Combobox>

        </Group>
        <Group grow>
            <DateTimePicker leftSection={<PiClockCountdownBold size="1.1rem"/>}
                            valueFormat="DD MMM YYYY hh:mm A" {...form.getInputProps('deadline')}
                            description="Deadline for the change"
                            label="Deadline"
                            required/>
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
                        rightSection={<Combobox.Chevron/>}
                        onClick={() => combobox.toggleDropdown()}
                        rightSectionPointerEvents="none"
                    >
                        {form.values.status ? (<StatusBadge status={form.values.status}/>) : (
                            <Input.Placeholder>Pick value</Input.Placeholder>)}
                    </InputBase>
                </Combobox.Target>

                <Combobox.Dropdown>
                    <Combobox.Options>{[{value: 'not_started'}, {value: 'in_progress'}, {value: 'paused'}, {value: 'completed'}, {value: 'cancelled'}, {value: 'requested'}, {value: 'rejected'}].map((item) => (
                        <Combobox.Option value={item.value} key={item.value}>
                            <StatusBadge status={item.value}/>
                        </Combobox.Option>))}</Combobox.Options>
                </Combobox.Dropdown>
            </Combobox>
        </Group>
        <Group mt="1.4rem" justify="space-between">
            <Button c="white" onClick={toggleCreateModal} size="xs" variant="light">Cancel</Button>
            <Button onClick={handleCreate} size="xs">Create</Button>
        </Group>
    </Modal>)
}