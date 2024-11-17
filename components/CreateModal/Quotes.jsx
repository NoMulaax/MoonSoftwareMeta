'use client'

import {
    Avatar,
    Button,
    Combobox,
    Group,
    InputBase,
    Modal,
    NumberInput,
    Select,
    Text,
    TextInput,
    useCombobox
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { matches, useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import React from "react";
import { PiClockCountdownBold, PiSubtitlesBold } from "react-icons/pi";
import { useAllClients } from "../../hooks/useAllClients";
import { supabaseClient } from "../../utils/supabaseClient";

export default function CreateModal({currencyPrefix, open, toggleCreateModal, handleUpdate}) {
    const clients = useAllClients();
    const clientCombobox = useCombobox({
        onDropdownClose: () => clientCombobox.resetSelectedOption(),
    });

    const form = useForm({
        initialValues: {
            title: "",
            proposed_amount: 0,
            client: null,
            start_date: new Date(),
            deadline: new Date(),
            payment_terms: "100_before",
        }, validate: {
            title: matches(/^.{3,30}$/, 'Title must be between 3 and 30 characters'),
        }
    });

    const handleCreate = async () => {
        if (form.validate().hasErrors || !form.values.client) {
            return;
        }

        const {data, error} = await supabaseClient.from('panel_quotes').insert({
            title: form.values.title,
            proposed_amount: form.values.proposed_amount,
            client: form.values.client,
            start_date: form.values.start_date,
            deadline: form.values.deadline,
            payment_terms: form.values.payment_terms,
        }).select().single();
        if (error) {
            notifications.show({
                title: 'Error!', message: 'New quote could not be made!', color: 'red',
            })
        } else {
            handleUpdate({...data, client: clients?.find(item => item.id === data.client)});
            notifications.show({
                title: 'Done!', message: 'New quote has been made!', color: 'green',
            })
        }
        toggleCreateModal();
        form.reset();
    }

    const selectedClient = clients?.find(item => item.id === form.values.client);

    return (<Modal size="48rem" opened={open}
                   onClose={toggleCreateModal} title="Create a new quote">
        <TextInput leftSection={<PiSubtitlesBold size="1.1rem"/>} {...form.getInputProps('title')} mb="1rem"
                   description="The title of the commission"
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
            <NumberInput startValue={form.values.total_value} min={0} leftSection={currencyPrefix}  {...form.getInputProps('proposed_amount')}
                         description="Total value of the commission"
                         label="Proposed price"
                         placeholder="Proposed price"
                         required/>
            <DateTimePicker leftSection={<PiClockCountdownBold size="1.1rem"/>}
                            valueFormat="DD MMM YYYY hh:mm A" {...form.getInputProps('start_date')}
                            description="Start date for the commission"
                            label="Start date"
                            required/>
        </Group>
        <Group grow>

            <DateTimePicker leftSection={<PiClockCountdownBold size="1.1rem"/>}
                            valueFormat="DD MMM YYYY hh:mm A" {...form.getInputProps('deadline')}
                            description="Deadline for the commission"
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
            <Button c="white" onClick={toggleCreateModal} size="xs" variant="light">Cancel</Button>
            <Button onClick={handleCreate} size="xs">Create</Button>
        </Group>
    </Modal>)
}