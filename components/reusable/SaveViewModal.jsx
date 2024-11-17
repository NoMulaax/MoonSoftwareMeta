'use client'

import { Button, Group, Modal, Text, TextInput } from "@mantine/core";
import { hasLength, useForm } from "@mantine/form";
import { supabaseClient } from "../../utils/supabaseClient";
import { notifications } from "@mantine/notifications";
import { useState } from "react";
import { useViews } from "../../hooks/useViews";

export default function SaveViewModal({ opened, data, onClose }) {
    const [loading, setLoading] = useState(false)
    const { refreshData } = useViews();

    const form = useForm({
        initialValues: {
            name: '',
        }, validate: {
            name: hasLength({ min: 3, max: 20 }, 'Name must be between 3 and 20 characters')
        }
    })

    const saveView = async () => {
        if (form.validate().hasErrors) return

        setLoading(true)
        const { error } = await supabaseClient.from('panel_views').insert([
            {
                name: form.values.name || "New view",
                data: data,
            },
        ])
        setTimeout(() => {
            if (error) {
                notifications.show({
                    title: 'Error!',
                    message: "View could not be made right now.",
                    color: 'red',
                })
            } else {
                notifications.show({
                    title: 'Done!',
                    message: "View has been saved.",
                    color: 'green',
                })
                setLoading(false)
                onClose()
                form.reset()
                refreshData();

            }
        }, 400)

    }

    return (<Modal opened={opened} title="Save as a view" onClose={onClose}>
        <Text mb="0.6rem" c="dimmed" fw={400}>You can save the current filters and sorting you have applied as a "View" to easily access it later in the sidebar.</Text>
        <TextInput {...form.getInputProps('name')} label="View name" placeholder="Enter view name" />
        <Group mt="1rem" justify="space-between">
            <Button variant="light" c="#fff" onClick={onClose}>Cancel</Button>
            <Button loading={loading} onClick={saveView}>Save view</Button>
        </Group>
    </Modal>)
}