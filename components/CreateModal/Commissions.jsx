'use client'

import {
    Avatar,
    Button,
    Combobox,
    Group,
    InputBase,
    Modal,
    NumberInput, Stack,
    Text,
    TextInput,
    useCombobox
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { matches, useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { Link } from "@mantine/tiptap";
import Highlight from "@tiptap/extension-highlight";
import SubScript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React, { forwardRef } from "react";
import { PiClockCountdownBold, PiSubtitlesBold } from "react-icons/pi";
import { RiCloseFill } from "react-icons/ri";
import { TbBrandShopee } from "react-icons/tb";
import { useAllClients } from "../../hooks/useAllClients";
import { useAllProducts } from "../../hooks/useAllProducts";
import { supabaseClient } from "../../utils/supabaseClient";
import StatusBadge from "../StatusBadge/StatusBadge";
import Wysiwyg from "../Wysiwyg/Wysiwyg";

export default function CreateModal({currencyPrefix, open, toggleCreateModal, handleUpdate}) {
    const clients = useAllClients();
    const clientCombobox = useCombobox();
    const products = useAllProducts();
    const combobox = useCombobox();
    const productCombobox = useCombobox();
    const form = useForm({
        initialValues: {
            title: "",
            client: null,
            total_value: 0,
            total_paid: 0,
            deadline: new Date(),
            product: null,
            start_date: new Date(),
            status: "not_started",
        }, validate: {
            title: matches(/^.{3,30}$/, 'Title must be between 3 and 30 characters'),
            client: (value) => value ? null : "Client must be selected",
        }
    });

    const editor = useEditor({
        extensions: [StarterKit, Underline, Link, Superscript, SubScript, Highlight, TextAlign.configure({types: ['heading', 'paragraph']}),],
        content: "",
    })

    const handleCreate = async () => {
        if (form.validate().hasErrors || !form.values.client) {
            return;
        }

        const {data, error} = await supabaseClient.from('panel_commissions').insert({
            title: form.values.title,
            client: form.values.client,
            total_value: form.values.total_value,
            total_paid: form.values.total_paid,
            deadline: form.values.deadline,
            product: form.values.product,
            start_date: form.values.start_date,
            status: form.values.status,
            notes: editor.getHTML(),
        }).select().single();
        if (error) {
            notifications.show({
                title: 'Error!', message: 'New commission could not be made!', color: 'red',
            })
        } else {
            handleUpdate({...data,
                notes: editor.getHTML(),
                client: clients?.find(item => item.id === data.client),
                product: products.find(p => p.id === form.values.product),});
            notifications.show({
                title: 'Done!', message: 'New commission has been made!', color: 'green',
            })
        }
        toggleCreateModal();
        form.reset();
    }

    const selectedClient = clients?.find(item => item.id === form.values.client);

    const ProductAutoCompleteItem =
        React.memo(forwardRef(function ProductAutoCompleteItem({value, description, ...others}, ref) {
            return (<div ref={ref} {...others} id={value}>
                <Stack gap={0}>
                    <Text size="sm" mb={0}
                          fw={600}>{description}</Text>
                    <Text c="dimmed" size="xs"
                          mb={0}>{value ? "Select this product" : "This user does not have any products"}</Text>
                </Stack>
            </div>)
        }), (prevProps, nextProps) => prevProps.value === nextProps.value);

    return (<Modal size="48rem" opened={open}
                   onClose={toggleCreateModal} title="Create a new commission">
        <Group mb="1rem" grow>
            <TextInput leftSection={<PiSubtitlesBold size="1.1rem"/>} {...form.getInputProps('title')}
                       description="The title of the commission"
                       label="Title" placeholder="Title" required/>
            <Combobox
                leftSection={<TbBrandShopee size="1.1rem"/>}
                value={products.find(p => p.id === form.values.product)?.description || ''}
                placeholder="Select product"
                store={productCombobox}
                onOptionSubmit={(productId) => {
                    productCombobox.closeDropdown();
                    form.setFieldValue('product', productId);
                }}
            >
                <Combobox.Target>
                    <InputBase
                        label="Product"
                        description="The product or service for this commission"
                        onClick={() => productCombobox.openDropdown()}
                        rightSection={form.values.product !== null ? (
                            <RiCloseFill
                                size={15}
                                className="pointer"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    form.setFieldValue('product', null);
                                }}
                                aria-label="Clear value"
                            />
                        ) : (
                            <Combobox.Chevron/>
                        )}
                        placeholder="Select product"
                        onBlur={() => productCombobox.closeDropdown()}
                    />
                </Combobox.Target>
                <Combobox.Dropdown>
                    <Combobox.Options>
                        {(products && products.length > 0) ? (
                            <Stack gap={2}>
                                {products.map((product, index) => (
                                    <Combobox.Option value={product.id} key={index}>
                                        <ProductAutoCompleteItem
                                            value={product.id}
                                            description={product.description}
                                        />
                                    </Combobox.Option>
                                ))}
                            </Stack>
                        ) : (
                            <Combobox.Empty>
                                <Text my="0.4rem" size="xs" mb={-12}>Nothing found!</Text>
                            </Combobox.Empty>
                        )}
                    </Combobox.Options>
                </Combobox.Dropdown>
            </Combobox>
        </Group>
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
                        rightSection={<Combobox.Chevron/>}
                        onClick={() => clientCombobox.toggleDropdown()}
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
            <NumberInput min={0}
                         leftSection={currencyPrefix}  {...form.getInputProps('total_value')}
                         description="Total value of the commission"
                         label="Total value"
                         placeholder="Total value"
                         required/>
            <NumberInput min={0}
                         leftSection={currencyPrefix} {...form.getInputProps('total_paid')}
                         description="Amount paid for the commission so far"
                         label="Total paid"
                         placeholder="Total paid"
                         required/>
        </Group>
        <Group grow>
            <DateTimePicker leftSection={<PiClockCountdownBold size="1.1rem"/>}
                            valueFormat="DD MMM YYYY hh:mm A" {...form.getInputProps('start_date')}
                            description="Start date for the commission"
                            label="Start date"
                            required/>
            <DateTimePicker leftSection={<PiClockCountdownBold size="1.1rem"/>}
                            valueFormat="DD MMM YYYY hh:mm A" {...form.getInputProps('deadline')}
                            description="Deadline for the commission"
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
                        description="The current status of this commission"
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
                    <Combobox.Options>{[{value: 'not_started'}, {value: 'in_progress'}, {value: 'completed'}, {value: 'cancelled'}, {value: 'paused'},].map((item) => (
                        <Combobox.Option value={item.value} key={item.value}>
                            <StatusBadge status={item.value}/>
                        </Combobox.Option>))}</Combobox.Options>
                </Combobox.Dropdown>
            </Combobox>
        </Group>
        <Text mt="1rem" size="sm">Notes</Text>
        <Text size="xs" c="dimmed">Any additional notes for this commission</Text>
        <Wysiwyg editor={editor} mt="0.4rem" mb="1rem" style={{border: "1px solid #2D2D2D"}} />
        <Group mt="1.4rem" justify="space-between">
            <Button c="white" onClick={toggleCreateModal} size="xs" variant="light">Cancel</Button>
            <Button onClick={handleCreate} size="xs">Create</Button>
        </Group>
    </Modal>)
}