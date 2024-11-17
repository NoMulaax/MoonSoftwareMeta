'use client'

import {useForm} from "@mantine/form";
import {notifications} from "@mantine/notifications";
import {Button, Group, Modal, TextInput} from "@mantine/core";
import {PiEnvelopeBold, PiPictureInPictureBold, PiSubtitlesBold} from "react-icons/pi";
import {FaDiscord} from "react-icons/fa";
import React from "react";
import {supabaseClient} from "../../utils/supabaseClient";

export default function CreateModal({open, toggleCreateModal, handleUpdate}) {
    const form = useForm({
        initialValues: {
            username: "", discord: "", email: "", avatar_url: null,
        }, validate: {
            username: (value) => {
                if (value.trim().length < 1 || value.trim().length > 30) {
                    return 'Name must be between 1 and 30 characters';
                }
            }
        }
    });


    const handleCreate = async () => {
        if (form.validate().hasErrors) {
            return;
        }

        const {data, error} = await supabaseClient.from('panel_clients').insert({
            username: form.values.username,
            discord: form.values.discord,
            email: form.values.email,
            avatar_url: form.values.avatar_url,
        }).select().single();
        if (error) {
            notifications.show({
                title: 'Error!', message: 'New client could not be made!', color: 'red',
            })
        } else {
            handleUpdate(data);
            notifications.show({
                title: 'Done!', message: 'New client has been made!', color: 'green',
            })
        }
        toggleCreateModal();
        form.reset();
    }


    return (<Modal size="48rem" opened={open} onClose={toggleCreateModal} title="Create a new client">
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
            <Button c="white" onClick={toggleCreateModal} size="xs" variant="light">Cancel</Button>
            <Button onClick={handleCreate} size="xs">Create</Button>
        </Group>
    </Modal>)
}