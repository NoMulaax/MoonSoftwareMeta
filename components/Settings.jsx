'use client'

import {
    ActionIcon,
    Box,
    Button,
    Center,
    Collapse,
    CopyButton,
    Divider,
    Group,
    Paper,
    PasswordInput,
    Progress,
    rem,
    SimpleGrid,
    Tabs,
    Text,
    TextInput,
    Title,
    Tooltip
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure, useInputState } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconCopy, IconX } from "@tabler/icons-react";
import Highlight from '@tiptap/extension-highlight';
import { Link as TiptapLink } from '@tiptap/extension-link';
import SubScript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from "next/link";
import { useEffect, useState } from "react";
import Wysiwyg from "../components/Wysiwyg/Wysiwyg";
import { useEmberUser } from "../hooks/useEmberUser";
import { supabaseClient } from "../utils/supabaseClient";

const requirements = [
    { re: /[0-9]/, label: 'Includes number' },
    { re: /[a-z]/, label: 'Includes lowercase letter' },
    { re: /[A-Z]/, label: 'Includes uppercase letter' },
];


export default function Settings() {
    const [passwordOpen, { toggle }] = useDisclosure(false)
    const user = useEmberUser();
    const [tcsSaveLoading, setTcsSaveLoading] = useState(false)
    const [loading, setLoading] = useState(false)
    const detailsForm = useForm({
        validate: {
            display_name: (value) => value.trim().length > 0 ? (value.length > 50 ? "Display name is too long" : null) : 'Name is required',
            discord: (value) => value.length > 20 ? "Discord is too long" : null,
        }
    })

    // password settings
    const [value, setValue] = useInputState('');
    const strength = getStrength(value);
    const checks = requirements.map((requirement, index) => (
        <PasswordRequirement key={index} label={requirement.label} meets={requirement.re.test(value)} />
    ));

    const bars = Array(4)
        .fill(0)
        .map((_, index) => (
            <Progress
                styles={{ section: { transitionDuration: '0ms' } }}
                value={
                    value.length > 0 && index === 0 ? 100 : strength >= ((index + 1) / 4) * 100 ? 100 : 0
                }
                color={strength > 80 ? 'teal' : strength > 50 ? 'yellow' : 'red'}
                key={index}
                size={4}
            />
        ));

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link,
            Superscript,
            SubScript,
            Highlight,
            TiptapLink,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
        ],
    })

    useEffect(() => {
        const userData = user.userData;

        async function fetchData() {
            const {
                error,
                data
            } = await supabaseClient.from('panel_settings').select('terms, discord, api_key, api_uses_left, settings').single()
            if (error) {
                notifications.show({
                    title: 'Error!', message: 'Something went wrong!', color: 'red',
                })
            } else {
                if (userData) {
                    detailsForm.setValues({
                        display_name: userData.display_name || "",
                        logo: userData.logo || "",
                        avatar_url: userData.avatar_url || "",
                        discord: data.discord || "",
                        api_key: data.api_key || "",
                        api_uses_left: data.api_uses_left || "",
                        billing_cycle: data.plan || "",
                        settings: {
                            currency_prefix: data.settings?.currency_prefix || "",
                        }
                    })
                    if (editor) {
                        editor.commands.setContent(data.terms || "")
                    }
                }
            }
        }

        fetchData()
    }, [user.userData, editor]);

    const handleTosSave = () => {
        if (editor.getHTML().length > 500) {
            notifications.show({
                title: 'Error!', message: 'Your terms and conditions can not exceed 500 characters!', color: 'red',
            })
            return;
        }

        setTcsSaveLoading(true)

        setTimeout(async () => {
            setTcsSaveLoading(true)
            const { error } = await supabaseClient.from('panel_settings').upsert({
                id: user.userData.id,
                terms: editor.getHTML(),
            }).eq('id', user.userData.id)

            if (!error) {
                notifications.show({
                    title: 'Done!', message: 'Terms and conditions have been saved!', color: 'green',
                })
            } else {
                notifications.show({
                    title: 'Error!', message: 'Something went wrong!', color: 'red',
                })
            }
            setTcsSaveLoading(false)
        }, 400)
    }

    const handleDetailsSave = async () => {
        setLoading(true)
        if (detailsForm.validate().hasErrors) {
            setLoading(false)
            return;
        }
        const { error } = await supabaseClient.from('panel_settings').upsert({
            id: user.userData.id,
            display_name: detailsForm.values.display_name,
            discord: detailsForm.values.discord,
            logo: detailsForm.values.logo,
            avatar_url: detailsForm.values.avatar_url,
            settings: {
                currency_prefix: detailsForm.values.settings.currency_prefix,
            }
        }).eq('id', user.userData.id)

        setTimeout(() => {
            if (!error) {
                notifications.show({
                    title: 'Done!', message: 'Details have been saved!', color: 'green',
                })
                user.updateContext(
                    {
                        ...user.userData,
                        display_name: detailsForm.values.display_name,
                        discord: detailsForm.values.discord,
                        logo: detailsForm.values.logo,
                        avatar_url: detailsForm.values.avatar_url,
                        settings: {
                            currency_prefix: detailsForm.values.currency_prefix,
                        }
                    }
                )
            } else {
                notifications.show({
                    title: 'Error!', message: 'Something went wrong!', color: 'red',
                })
            }
            setLoading(false)
        }, 400)
    }

    const handleUpdatePassword = async () => {
        if (user.userData.email === 'demo@vouchley.com') {
            notifications.show({
                title: 'Done!', message: 'Password has been updated!', color: 'green',
            })
            return;
        }

        if (strength !== 100) {
            notifications.show({
                title: 'Error!', message: 'Your password does not meet the requirements!', color: 'red',
            })
        } else {
            setLoading(true)
            const { error } = await supabaseClient.auth.updateUser({
                password: value,
            })
            if (!error) {
                notifications.show({
                    title: 'Done!', message: 'Password has been updated!', color: 'green',
                })
            } else {
                notifications.show({
                    title: 'Error!', message: 'Something went wrong!', color: 'red',
                })
            }
            setLoading(false)
        }
    }

    return (<Box maw="40rem">
        <Tabs className="settings__tabs" variant="default" radius="xs" defaultValue="general">
            <Tabs.List mb="1.4rem">
                <Tabs.Tab value="general">
                    General
                </Tabs.Tab>
                <Tabs.Tab value="terms_and_conditions">
                    Terms and conditions
                </Tabs.Tab>
                <Tabs.Tab value="api">
                    API
                </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="general">
                <Title mb="1rem" order={3}>Profile details</Title>
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    <TextInput label="Display name"
                        description="Public name for your clients" {...detailsForm.getInputProps('display_name')} />
                    <TextInput label="Discord"
                        description="Public Discord for client communication" {...detailsForm.getInputProps('discord')} />
                    <TextInput label="Logo URL"
                        description="Logo will appear on quotes and other pages" {...detailsForm.getInputProps('logo')} />
                    <TextInput label="Avatar URL"
                        description="Your avatar to appear on quotes and your panel" {...detailsForm.getInputProps('avatar_url')} />
                    <TextInput placeholder="e.g. $ or €" label="Currency"
                        description="Prefix for your currency. e.g. '$' or '€'" {...detailsForm.getInputProps('settings.currency_prefix')} />
                </SimpleGrid>
                <Group mt="2rem" grow>
                    <div>
                        <Button color="dark.8" c="#fff" mb="1rem" onClick={toggle}>Change password</Button>
                        <Collapse in={passwordOpen}>
                            <PasswordInput
                                value={value}
                                onChange={setValue}
                                placeholder="Your password"
                                label="Password"
                                required
                            />

                            <Group gap={5} grow mt="xs" mb="md">
                                {bars}
                            </Group>

                            <PasswordRequirement label="Has at least 6 characters" meets={value.length > 5} />
                            {checks}
                            <Button size="xs" mt="0.4rem" onClick={handleUpdatePassword}>
                                Update password
                            </Button>
                        </Collapse>
                    </div>
                    <div />
                </Group>
                <Divider my="1rem" />
                <Button mt="1rem" loading={loading} onClick={handleDetailsSave}>Save</Button>
            </Tabs.Panel>

            <Tabs.Panel value="terms_and_conditions">
                <Paper>
                    <Title mb="1rem" order={3}>Terms and conditions</Title>
                    <Text size="sm" mb="2rem">Enter your terms and conditions here. Clients will be forced to accept
                        them when
                        accepting a
                        quote for a commission.</Text>
                    <Wysiwyg my="1rem" editor={editor} />
                    <Button loading={tcsSaveLoading} onClick={handleTosSave}>Save</Button>
                </Paper>
            </Tabs.Panel>

            <Tabs.Panel value="api">
                <Title mb="1rem" order={3}>Ember API</Title>
                <Group>
                    <TextInput rightSection={
                        <CopyButton value={detailsForm.values.api_key} timeout={2000}>
                            {({ copied, copy }) => (
                                <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
                                    <ActionIcon color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
                                        {copied ? (
                                            <IconCheck style={{ width: rem(16) }} />
                                        ) : (
                                            <IconCopy style={{ width: rem(16) }} />
                                        )}
                                    </ActionIcon>
                                </Tooltip>
                            )}
                        </CopyButton>
                    } w="26rem" label="Your API key" description="This is a secret key, do not share" readOnly
                        value={detailsForm.values.api_key} />
                    <TextInput w="10rem" label="API credits" description="Credits reset each month" readOnly
                        value={detailsForm.values.api_uses_left} />
                </Group>
            </Tabs.Panel>
        </Tabs>
    </Box>)
}

function PasswordRequirement({ meets, label }) {
    return (
        <Text component="div" c={meets ? 'teal' : 'red'} mt={5} size="sm">
            <Center inline>
                {meets ? <IconCheck size="0.9rem" stroke={1.5} /> : <IconX size="0.9rem" stroke={1.5} />}
                <Box ml={7}>{label}</Box>
            </Center>
        </Text>
    );
}

function getStrength(password) {
    let multiplier = password.length > 5 ? 0 : 1;

    requirements.forEach((requirement) => {
        if (!requirement.re.test(password)) {
            multiplier += 1;
        }
    });

    return Math.max(100 - (100 / (requirements.length + 1)) * multiplier, 0);
}
