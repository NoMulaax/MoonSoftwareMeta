'use client'

import {
    Button,
    Group,
    Menu,
    Modal,
    Text
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconDots } from "@tabler/icons-react";
import axios from "axios";
import {
    PiCheck,
    PiCopy,
    PiPushPinDuotone,
    PiPushPinSlashDuotone,
    PiTrashBold
} from "react-icons/pi";
import handleDeleteEntry from "../../utils/handleDeleteEntry";
import { supabaseClient } from "../../utils/supabaseClient";

export default function ManageButton({
    invoice,
    handleDeleteRefresh,
    handleEditRefresh,
    handlePinRefresh
}) {
    const [confirmDeleteModalOpened, { toggle: toggleDeleteConfirmModal }] = useDisclosure(false);

    const handleCopyInvoiceLink = () => {
        navigator.clipboard.writeText(invoice.link);
        notifications.show({
            title: 'Done!', message: 'Invoice link copied to clipboard', color: 'green',
        })
    }

    const handleDelete = () => {
        toggleDeleteConfirmModal();
        handleDeleteEntry('panel_invoices', invoice.id)
        handleDeleteRefresh(invoice.id);
    }

    const handlePin = async () => {
        const newPinnedStatus = !invoice.pinned;
        const { error } = await supabaseClient.from('panel_invoices').update({
            pinned: newPinnedStatus
        }).eq('id', invoice.id);

        if (error) {
            notifications.show({
                title: 'Error!',
                message: 'Something went wrong',
                color: 'red',
            });
        } else {
            handlePinRefresh(invoice.id, newPinnedStatus);
            notifications.show({
                title: 'Done!',
                message: `Invoice ${invoice.id} has been ${newPinnedStatus ? "" : "un"}pinned!`,
                color: 'green',
            });
        }
    };

    const handleCheckInvoicePaid = async () => {
        try {
            const endpoint = invoice.type === 'stripe' 
                ? '/api/invoices/check'
                : '/api/invoices/check-paypal';
            
            const response = await axios.post(endpoint, {
                invoice_id: invoice.stripe_invoice_id,
            });

            if (response.data.isPaid) {
                console.log(response.data.paidAt);
                const { error } = await supabaseClient
                    .from('panel_invoices')
                    .update({ 
                        status: 'paid', 
                        paid_at: response.data.paidAt
                    })
                    .eq('id', invoice.id);

                handleEditRefresh(invoice.id, { status: 'paid', paid_at: response.data.paidAt });

                if (error) {
                    console.log(error);
                    throw new Error('Failed to update invoice status');
                }

                notifications.show({
                    title: 'Success!',
                    message: `Invoice ${invoice.id} has been marked as paid.`,
                    color: 'green',
                });

                handleEditRefresh(invoice.id, { status: 'paid' });
            } else {
                notifications.show({
                    title: 'Not Paid',
                    message: `Invoice ${invoice.id} has not been paid yet.`,
                    color: 'yellow',
                });
            }
        } catch (error) {
            console.log(error);
            notifications.show({
                title: 'Error!',
                message: 'Failed to check invoice payment status.',
                color: 'red',
            });
        }
    };

    return (<>
        <Modal opened={confirmDeleteModalOpened} onClose={toggleDeleteConfirmModal} title="Delete invoice">
            <Text c="dimmed" fw={400} mb="1rem">Are you sure you want to delete this invoice?</Text>
            <Text fw={600} c="bright">This will not delete the invoice from Stripe.</Text>
            <Group mt="1.4rem" justify="space-between">
                <Button c="white" onClick={toggleDeleteConfirmModal} size="xs" variant="light">Cancel</Button>
                <Button c="white" size="xs" onClick={handleDelete} color="red" ml="0.5rem">Delete</Button>
            </Group>
        </Modal>

        <Menu shadow="md" width={200}>
            <Menu.Target>
                <IconDots className="pointer" />
            </Menu.Target>

            <Menu.Dropdown w="15rem">
                <Menu.Label>Manage</Menu.Label>
                <Menu.Item onClick={handlePin}
                    leftSection={invoice.pinned ? <PiPushPinSlashDuotone /> : <PiPushPinDuotone />}>
                    {invoice.pinned ? "Unpin" : "Pin"}
                </Menu.Item>
                <Menu.Item onClick={handleCopyInvoiceLink}
                    leftSection={<PiCopy />}>
                    Copy payment link
                </Menu.Item>
                <Menu.Item onClick={handleCheckInvoicePaid}
                    leftSection={<PiCheck />}>
                    Check invoice payment
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item onClick={toggleDeleteConfirmModal} color="red" leftSection={<PiTrashBold size={16} />}>
                    Delete
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    </>)
}