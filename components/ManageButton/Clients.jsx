'use client'

import React, {useState} from "react";
import {useDisclosure} from "@mantine/hooks";
import {ActionIcon, Button, Group, Menu, Modal, Text, TextInput, useCombobox} from "@mantine/core";
import {useForm} from "@mantine/form";
import {notifications} from "@mantine/notifications";
import {
    PiDotsThreeOutlineFill,
    PiEnvelopeBold,
    PiNotePencilBold,
    PiPictureInPictureBold,
    PiSubtitlesBold,
    PiTrashBold
} from "react-icons/pi";
import {FaDiscord} from "react-icons/fa";
import handleDeleteEntry from "../../utils/handleDeleteEntry";
import {supabaseClient} from "../../utils/supabaseClient";
import {IconDots} from "@tabler/icons-react";

export default function ManageButton({
                                         client,
                                         handleDeleteRefresh,
                                         handleEditRefresh
                                     }) {
    const [editModalOpened, setEditModalOpened] = useState(false);
    const [confirmDeleteModalOpened, {toggle: toggleDeleteConfirmModal}] = useDisclosure(false);
    const combobox = useCombobox({
        onDropdownClose: () => combobox.resetSelectedOption(),
    });
    const form = useForm({
        initialValues: {
            username: client.username, discord: client.discord, email: client.email, avatar_url: client.avatar_url,
        }, validate: {
            username: (value) => {
                if (value.trim().length < 1 || value.trim().length > 30) {
                    return 'Name must be between 1 and 30 characters';
                }
            },
        }
    });

    const handleEditSave = async () => {
        setEditModalOpened(false);
        notifications.show({
            title: 'Done!', message: 'Client ' + client.id + ' has been edited!', color: 'green',
        })

        const {error} = await supabaseClient.from('panel_clients').update({
            username: form.values.username,
            discord: form.values.discord,
            email: form.values.email,
            avatar_url: form.values.avatar_url,
        }).eq('id', client.id);
        if (error) {
            notifications.show({
                title: 'Error!', message: 'Something went wrong', color: 'red',
            })
        } else {
            handleEditRefresh(client.id, form.values)
        }
    }

    const handleDelete = () => {
        toggleDeleteConfirmModal();
        handleDeleteEntry('panel_clients', client.id)
        handleDeleteRefresh(client.id);
    }

    return (<>
        <Modal size="48rem" opened={editModalOpened} onClose={() => setEditModalOpened(false)}
               title={"Edit client " + client.id}>
            <TextInput
                leftSection={<PiSubtitlesBold size="1.1rem"/>}
                {...form.getInputProps('username')}
                mb="1rem"
                label="Name"
                placeholder="e.g. JohnDoe23"
                required
            />
            <TextInput
                leftSection={<FaDiscord size="1.1rem"/>}
                {...form.getInputProps('discord')}
                mb="1rem"
                label="Discord Username"
                placeholder="e.g. buzzthedev"
                required
            />
            <TextInput
                leftSection={<PiEnvelopeBold size="1.1rem"/>}
                {...form.getInputProps('email')}
                mb="1rem"
                label="Email Address"
                placeholder="e.g. johndoe@mail.com"
                required
            />
            <TextInput
                leftSection={<PiPictureInPictureBold size="1.1rem"/>}
                {...form.getInputProps('avatar_url')}
                mb="1rem"
                label="Avatar URL"
                description="Get this from their Vouchley profile"
                placeholder="e.g. https://www.example.com/avatar.png"
                required
            />
            <Group mt="1.4rem" justify="space-between">
                <Button c="white" onClick={() => setEditModalOpened(false)} size="xs" variant="light">Cancel</Button>
                <Button onClick={handleEditSave} size="xs">Save</Button>
            </Group>
        </Modal>

        <Modal opened={confirmDeleteModalOpened} onClose={toggleDeleteConfirmModal} title="Delete client">
            <Text c="dimmed" fw={400} mb="1rem">Are you sure you want to delete this client? This will also delete all commissions for this client.</Text>
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
                <Menu.Divider/>
                <Menu.Item onClick={toggleDeleteConfirmModal} color="red" leftSection={<PiTrashBold size={16}/>}>
                    Delete
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    </>)
}