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
    Textarea,
    useCombobox
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { hasLength, isInRange, useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconBrandPaypal, IconBrandStripe } from '@tabler/icons-react';
import React, { useState } from "react";
import { PiClockCountdownBold } from "react-icons/pi";

export default function CreateModal({ currencyPrefix, clients, open, toggleCreateModal, handleUpdate }) {
    const [loading, setLoading] = useState(false);
    const [paymentProvider, setPaymentProvider] = useState('stripe');
    const clientCombobox = useCombobox();
    const providerCombobox = useCombobox();
    const form = useForm({
        initialValues: {
            client: null,
            amount: 0,
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            title: "",
            memo: "",
        }, validate: {
            client: (value) => value ? null : "Client must be selected",
            title: hasLength({ min: 3, max: 50 }, 'Title must be between 3 and 50 characters'),
            memo: hasLength({ max: 500 }, 'Memo must be less than 500 characters'),
            amount: isInRange({ min: 1, max: 1000000 }, 'Amount must be at least $1'),
        }
    });

    const handleCreate = async () => {
        if (form.validate().hasErrors) {
            return;
        }
        setLoading(true);

        const endpoint = paymentProvider === 'stripe'
            ? '/api/invoices/create'
            : '/api/invoices/create-paypal';

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: form.values.amount,
                due_date: form.values.due_date,
                title: form.values.title,
                memo: form.values.memo,
                client: selectedClient,
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            notifications.show({
                title: 'Error!', message: data.message || 'New invoice could not be made!', color: 'red',
            });
        } else {
            if (paymentProvider === 'stripe') {
                handleUpdate({
                    ...data,
                    client: selectedClient,
                });
            } else {
                console.log(data);
                handleUpdate({
                    ...data,
                    client: selectedClient,
                });
            }
            notifications.show({
                title: 'Done!', message: 'New invoice has been made!', color: 'green',
            });
        }
        toggleCreateModal();
        form.reset();
        setLoading(false);
    }

    const selectedClient = clients?.find(client => client.id === form.values.client);

    const providers = [
        {
            value: 'stripe',
            label: 'Stripe',
            icon: <IconBrandStripe size="1.2rem" stroke={1.5} />
        },
        {
            value: 'paypal',
            label: 'PayPal',
            icon: <IconBrandPaypal size="1.2rem" stroke={1.5} />
        }
    ];

    const selectedProvider = providers.find(p => p.value === paymentProvider);

    return (<Modal size="48rem" opened={open}
        onClose={toggleCreateModal} title="Create a new invoice">
        <Combobox
            store={providerCombobox}
            onOptionSubmit={(value) => {
                setPaymentProvider(value);
                providerCombobox.closeDropdown();
            }}
        >
            <Combobox.Target>
                <InputBase
                    component="button"
                    type="button"
                    pointer
                    rightSection={<Combobox.Chevron />}
                    onClick={() => providerCombobox.toggleDropdown()}
                    mb="1rem"
                >
                    <Group gap="xs">
                        {selectedProvider.icon}
                        <Text size="sm">{selectedProvider.label}</Text>
                    </Group>
                </InputBase>
            </Combobox.Target>

            <Combobox.Dropdown>
                <Combobox.Options>
                    {providers.map((provider) => (
                        <Combobox.Option value={provider.value} key={provider.value}>
                            <Group gap="xs">
                                {provider.icon}
                                <Text size="sm">{provider.label}</Text>
                            </Group>
                        </Combobox.Option>
                    ))}
                </Combobox.Options>
            </Combobox.Dropdown>
        </Combobox>
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
                        error={form.errors.client}
                        pointer
                        rightSection={<Combobox.Chevron />}
                        onClick={() => clientCombobox.toggleDropdown()}
                        placeholder="Select a client"
                    >
                        {selectedClient ? <Group gap="0.6rem">
                            <Avatar size="1.4rem" src={selectedClient.avatar_url} />
                            <Text size="sm">{selectedClient.username}</Text>
                        </Group> : "Select a client"}
                    </InputBase>
                </Combobox.Target>

                <Combobox.Dropdown>
                    <Combobox.Options>
                        {clients?.map((item) => (
                            <Combobox.Option value={item} key={item.id}>
                                <Group gap="0.6rem">
                                    <Avatar size="1.4rem" src={item.avatar_url} />
                                    <Text size="sm">{item.username}</Text>
                                </Group>
                            </Combobox.Option>
                        ))}
                    </Combobox.Options>
                </Combobox.Dropdown>
            </Combobox>
            <NumberInput min={0}
                leftSection={currencyPrefix}  {...form.getInputProps('amount')}
                description="Total value of the invoice"
                label="Total value"
                placeholder="Total value"
                required />
        </Group>
        <Group grow>
            <DateTimePicker leftSection={<PiClockCountdownBold size="1.1rem" />}
                valueFormat="DD MMM YYYY hh:mm A" {...form.getInputProps('due_date')}
                description="Due date for the invoice"
                label="Due date"
                required />
            <div />
        </Group>
        <Textarea my="1rem" label="Title" description="Briefly describe what this invoice is for. Visible to the client." autosize minRows={4} maxRows={6} {...form.getInputProps('title')} />
        <Textarea label="Memo" description="Add a longer description for this invoice. Visible to the client. Great for adding terms or other details." autosize minRows={4} maxRows={6} {...form.getInputProps('memo')} />
        <Group mt="1.4rem" justify="space-between">
            <Button c="white" onClick={toggleCreateModal} size="xs" variant="light">Cancel</Button>
            <Button onClick={handleCreate} size="xs" loading={loading}>Create</Button>
        </Group>
    </Modal>)
}