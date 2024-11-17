'use client'

import { Alert, Button, Container, Paper, PasswordInput, Stack, Text, TextInput, Title } from "@mantine/core";
import { useForm } from '@mantine/form';
import { useWindowEvent } from '@mantine/hooks';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TbLock, TbMail } from 'react-icons/tb';
import { messages } from "../utils/messages";
import { supabaseClient } from "../utils/supabaseClient";

export default function LoginPage() {
    const searchParams = useSearchParams()
    const router = useRouter();
    const [loading, setLoading] = useState(false)
    const [alertMsgs, setAlertMsgs] = useState([])
    const { push } = useRouter()
    const form = useForm({
        initialValues: {
            email: '', password: '',
        },
    })

    useEffect(() => {
        const demo = searchParams.get('demo')
        const password = searchParams.get('password')
        if (demo === 'true') {
            form.setFieldValue('email', 'demo@vouchley.com')
            form.setFieldValue('password', 'demo')
        }

        if (password) {
            form.setFieldValue('password', password)
        }

    }, [router.query])

    const handler = (event) => {
        event.preventDefault()
        if (event.key === 'Enter') {
            handleSubmit()
        }
    }
    useWindowEvent('keyup', handler)

    async function handleSubmit() {
        const tempAlertMsgs = []
        const emailRegex = /^[\w.%+-]+@[\w.-]+\.[a-zA-Z]{2,}$/
        if (!form.values.email.match(emailRegex)) {
            tempAlertMsgs.push('EMAIL_FORMAT')
        }
        if (tempAlertMsgs.length === 0) {
            setLoading(true)
            const { error } = await supabaseClient.auth.signInWithPassword(form.values)
            if (!error) {
                await push('/overview')
            }
            if (error) {
                if (error.message === 'Invalid login credentials') {
                    tempAlertMsgs.push('INCORRECT_LOGIN')
                    setLoading(false)
                }
            }
        }
        setAlertMsgs(tempAlertMsgs)
    }

    return (<>
        <Head>
            <title>Log in | Ember</title>
        </Head>
        <Container my="5%" size={500}>
            <Paper radius={5} p="2rem">
                <Stack gap={0} align="center">
                    <Image src="/android-chrome-512x512.png" alt="Vouchley" width={51} height={51} />
                    <Title order={4} mt="0.8rem" mb={6}>Welcome!</Title>
                    <Text mb="1rem" maw="20rem" c="dimmed" align="center">Log in to view your dashboard.</Text>
                </Stack>
                {alertMsgs.map((field, key) => {
                    return <Alert mb="0.8rem" key={key}>
                        {messages[field].content}
                    </Alert>
                })}
                <TextInput {...form.getInputProps("email")} type="email" placeholder="Email address"
                    label="Billing email address" icon={<TbMail size="1.2rem" stroke="#556987" />} />
                <PasswordInput autocomplete={false} mt="0.6rem" {...form.getInputProps("password")}
                    placeholder="Password"
                    label="Password"
                    icon={<TbLock size="1.2rem" stroke="#556987" />} />

                <Button mt="1rem" loaderProps={{ color: "white" }} c="white" color="primary" fullWidth
                    onClick={handleSubmit}
                    loading={loading} disabled={form.values.email === '' || form.values.password === ''}>
                    Log in
                </Button>
            </Paper>
        </Container>
    </>)
}