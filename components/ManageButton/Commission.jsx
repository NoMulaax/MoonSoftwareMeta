'use client'

import {
    Button,
    Combobox,
    Group,
    InputBase,
    InputPlaceholder,
    Menu,
    Modal,
    NumberInput,
    Stack,
    Text,
    TextInput,
    useCombobox
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { matches, useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { Link } from "@mantine/tiptap";
import { IconDots } from "@tabler/icons-react";
import Highlight from "@tiptap/extension-highlight";
import SubScript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React, { forwardRef, useState } from "react";
import {
    PiBellSimpleRingingBold,
    PiCaretRightBold,
    PiCheckBold,
    PiChecksBold,
    PiCheckThin,
    PiClockCountdownBold,
    PiCopyBold,
    PiFootprintsBold,
    PiLightningBold,
    PiNotePencilBold,
    PiPushPinDuotone,
    PiPushPinSlashDuotone,
    PiSubtitlesBold,
    PiTrashBold,
    PiUserBold
} from "react-icons/pi";
import { RiCloseFill } from "react-icons/ri";
import { TbBrandShopee } from "react-icons/tb";
import { useAllProducts } from "../../hooks/useAllProducts";
import handleDeleteEntry from "../../utils/handleDeleteEntry";
import handleStatusChange from "../../utils/handleStatusChange";
import { supabaseClient } from "../../utils/supabaseClient";
import StatusBadge from "../StatusBadge/StatusBadge";
import Wysiwyg from "../Wysiwyg/Wysiwyg";

export default function ManageButton({
    currencyPrefix,
    handleSetClientFilter,
    commission,
    handleStatusRefresh,
    handlePaidRefresh,
    handleDeleteRefresh,
    handleEditRefresh,
    handlePinRefresh
}) {
    const [editModalOpened, setEditModalOpened] = useState(false);
    const [confirmDeleteModalOpened, { toggle: toggleDeleteConfirmModal }] = useDisclosure(false);
    const products = useAllProducts();
    const combobox = useCombobox();
    const productCombobox = useCombobox();
    const form = useForm({
        initialValues: {
            title: commission.title,
            tracking_id: commission.tracking_id,
            total_value: commission.total_value,
            total_paid: commission.total_paid,
            deadline: new Date(commission.deadline),
            start_date: new Date(commission.start_date),
            product: commission.product?.id,
            status: commission.status,
            notes: commission.notes,
        }, validate: {
            title: matches(/^.{3,30}$/, 'Title must be between 3 and 30 characters'),
            total_value: matches(/^[0-9]{1,8}$/, 'Value must be between 1 and 8 digits'),
            total_paid: matches(/^[0-9]{1,8}$/, 'Paid must be between 1 and 8 digits'),
            notes: (value) => value.length > 0 ? (value.length > 1500 ? "Notes are too long" : null) : null
        }
    });

    const editor = useEditor({
        extensions: [StarterKit, Underline, Link, Superscript, SubScript, Highlight, TextAlign.configure({ types: ['heading', 'paragraph'] }),],
        content: commission.notes || "",
    })

    const handleCopyTrackingIDClick = () => {
        navigator.clipboard.writeText("https://" + window.location.hostname + "/track/" + commission.tracking_id);
        notifications.show({
            title: 'Done!', message: 'Tracking ID copied to clipboard', color: 'green',
        })
    }

    const handleEditSave = async () => {
        const { error } = await supabaseClient.from('panel_commissions').update({
            title: form.values.title,
            total_value: form.values.total_value,
            total_paid: form.values.total_paid,
            deadline: form.values.deadline,
            start_date: form.values.start_date,
            product: form.values.product,
            status: form.values.status,
            notes: editor.getHTML(),
        }).eq('id', commission.id);
        if (error) {
            notifications.show({
                title: 'Error!', message: 'Something went wrong', color: 'red',
            })
        } else {
            handleEditRefresh(commission.id, {
                ...form.values,
                notes: editor.getHTML(),
                product: products.find(p => p.id === form.values.product)
            })
            notifications.show({
                title: 'Done!', message: 'Commission ' + commission.id + ' has been edited!', color: 'green',
            })
        }
        setEditModalOpened(false);
    }

    const handleDelete = () => {
        toggleDeleteConfirmModal();
        handleDeleteEntry('panel_commissions', commission.id)
        handleDeleteRefresh(commission.id);
    }

    const markAsPaid = (amount) => {
        switch (amount) {
            case 10:
                handlePaidRefresh(commission.id, 10);
                notifications.show({
                    title: 'Done!',
                    message: 'Commission ' + commission.id + ' has been marked as 10% paid!',
                    color: 'green',
                })
                break;
            case 25:
                handlePaidRefresh(commission.id, 25);
                notifications.show({
                    title: 'Done!',
                    message: 'Commission ' + commission.id + ' has been marked as 25% paid!',
                    color: 'green',
                })
                break;
            case 50:
                handlePaidRefresh(commission.id, 50);
                notifications.show({
                    title: 'Done!',
                    message: 'Commission ' + commission.id + ' has been marked as 50% paid!',
                    color: 'green',
                })
                break;
            case 75:
                handlePaidRefresh(commission.id, 75);
                notifications.show({
                    title: 'Done!',
                    message: 'Commission ' + commission.id + ' has been marked as 75% paid!',
                    color: 'green',
                })
                break;
            case 100:
                handlePaidRefresh(commission.id, 100);
                notifications.show({
                    title: 'Done!',
                    message: 'Commission ' + commission.id + ' has been marked as fully paid!',
                    color: 'green',
                })
                break;

        }
    }

    const handlePin = async () => {
        const newPinnedStatus = !commission.pinned;
        const { error } = await supabaseClient.from('panel_commissions').update({
            pinned: newPinnedStatus
        }).eq('id', commission.id);

        if (error) {
            notifications.show({
                title: 'Error!',
                message: 'Something went wrong',
                color: 'red',
            });
        } else {
            handlePinRefresh(commission.id, newPinnedStatus);
            notifications.show({
                title: 'Done!',
                message: `Commission ${commission.id} has been ${newPinnedStatus ? "" : "un"}pinned!`,
                color: 'green',
            });
        }
    };

    const ProductAutoCompleteItem =
        React.memo(forwardRef(function ProductAutoCompleteItem({ value, description, ...others }, ref) {
            return (<div ref={ref} {...others} id={value}>
                <Stack gap={0}>
                    <Text size="sm" mb={0}
                        fw={600}>{description}</Text>
                    <Text c="dimmed" size="xs"
                        mb={0}>{value ? "Select this product" : "This user does not have any products"}</Text>
                </Stack>
            </div>)
        }), (prevProps, nextProps) => prevProps.value === nextProps.value);

    return (<>
        <Modal size="48rem" opened={editModalOpened}
            onClose={() => setEditModalOpened(false)} title={"Edit commission " + commission.id}>
            <Group mb="1rem" grow>
                <TextInput leftSection={<PiSubtitlesBold size="1.1rem" />} {...form.getInputProps('title')}
                    description="The title of the commission"
                    label="Title" placeholder="Title" required />
                <Combobox
                    leftSection={<TbBrandShopee size="1.1rem" />}
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
                                <Combobox.Chevron />
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
                <TextInput leftSection={<PiFootprintsBold size="1.1rem" />} {...form.getInputProps('tracking_id')}
                    description="Used for clients to track this order"
                    label="Tracking ID" placeholder="Tracking ID"
                    disabled readOnly />
                <NumberInput startValue={form.values.total_value} min={0} leftSection={currencyPrefix} {...form.getInputProps('total_value')}
                    description="Total value of the commission"
                    label="Total value"
                    placeholder="Total value"
                    required />
                <NumberInput startValue={form.values.total_paid} min={0} leftSection={currencyPrefix} {...form.getInputProps('total_paid')}
                    description="Amount paid for the commission so far"
                    label="Total paid"
                    placeholder="Total paid"
                    required />
            </Group>
            <Group grow>
                <DateTimePicker leftSection={<PiClockCountdownBold size="1.1rem" />}
                    valueFormat="DD MMM YYYY hh:mm A" {...form.getInputProps('start_date')}
                    description="Start date for the commission"
                    label="Start date"
                    required />
                <DateTimePicker leftSection={<PiClockCountdownBold size="1.1rem" />}
                    valueFormat="DD MMM YYYY hh:mm A" {...form.getInputProps('deadline')}
                    description="Deadline for the commission"
                    label="Deadline"
                    required />
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
                            rightSection={<Combobox.Chevron />}
                            onClick={() => combobox.toggleDropdown()}
                            rightSectionPointerEvents="none"
                        >
                            {form.values.status ? (<StatusBadge status={form.values.status} />) : (
                                <InputPlaceholder>Pick value</InputPlaceholder>)}
                        </InputBase>
                    </Combobox.Target>

                    <Combobox.Dropdown>
                        <Combobox.Options>{[{ value: 'not_started' }, { value: 'in_progress' }, { value: 'completed' }, { value: 'cancelled' }, { value: 'paused' },].map((item) => (
                            <Combobox.Option value={item.value} key={item.value}>
                                <StatusBadge status={item.value} />
                            </Combobox.Option>))}</Combobox.Options>
                    </Combobox.Dropdown>
                </Combobox>
            </Group>
            <Text mt="1rem" size="sm">Notes</Text>
            <Text size="xs" c="dimmed">Any additional notes for this commission</Text>
            <Wysiwyg editor={editor} mt="0.4rem" mb="1rem" style={{ border: "1px solid #2D2D2D" }} />
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
                <Menu.Item onClick={handlePin}
                    leftSection={commission.pinned ? <PiPushPinSlashDuotone /> : <PiPushPinDuotone />}>
                    {commission.pinned ? "Unpin" : "Pin"}
                </Menu.Item>
                <Menu.Item onClick={handleCopyTrackingIDClick} leftSection={<PiCopyBold />}>
                    Copy tracking URL
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
                            <Menu.Item
                                onClick={() => handleStatusChange('panel_commissions', commission.id, "not_started", handleStatusRefresh)}>
                                <StatusBadge status="not_started" />
                            </Menu.Item>
                            <Menu.Item
                                onClick={() => handleStatusChange('panel_commissions', commission.id, "in_progress", handleStatusRefresh)}>
                                <StatusBadge status="in_progress" />
                            </Menu.Item>
                            <Menu.Item
                                onClick={() => handleStatusChange('panel_commissions', commission.id, "completed", handleStatusRefresh)}>
                                <StatusBadge status="completed" />
                            </Menu.Item>
                            <Menu.Item
                                onClick={() => handleStatusChange('panel_commissions', commission.id, "cancelled", handleStatusRefresh)}>
                                <StatusBadge status="cancelled" />
                            </Menu.Item>
                            <Menu.Item
                                onClick={() => handleStatusChange('panel_commissions', commission.id, "paused", handleStatusRefresh)}>
                                <StatusBadge status="paused" />
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

                        <Menu.Dropdown w="14rem">
                            <Menu.Label>Mark paid</Menu.Label>
                            <Menu.Item onClick={() => markAsPaid(100)} c="green" leftSection={<PiChecksBold />}>
                                Mark as fully paid
                            </Menu.Item>
                            <Menu.Item onClick={() => markAsPaid(75)} c="orange" leftSection={<PiCheckBold />}>
                                Mark as 75% paid
                            </Menu.Item>
                            <Menu.Item onClick={() => markAsPaid(50)} c="orange" leftSection={<PiCheckBold />}>
                                Mark as 50% paid
                            </Menu.Item>
                            <Menu.Item c="gray.5" onClick={() => markAsPaid(25)} leftSection={<PiCheckThin />}>
                                Mark as 25% paid
                            </Menu.Item>
                            <Menu.Item c="gray.5" onClick={() => markAsPaid(10)} leftSection={<PiCheckThin />}>
                                Mark as 10% paid
                            </Menu.Item>

                            <Menu.Label>
                                Other
                            </Menu.Label>
                            <Menu.Item onClick={() => {
                                handleSetClientFilter(commission.client.id)
                            }} leftSection={<PiUserBold />}>
                                More from this client
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