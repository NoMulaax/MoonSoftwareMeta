'use client'

import { Button, Center, Flex, Group, Modal, Paper, Stack, Text, TextInput, UnstyledButton } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure, useFocusTrap, useWindowEvent } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import Head from "next/head";
import { useEffect, useState } from "react";
import { supabaseClient } from "../utils/supabaseClient";

export default function ProductsPage({ data }) {
    const [products, setProducts] = useState(data)
    const [createModalOpened, { toggle }] = useDisclosure(false);
    const [editingProductId, setEditingProductId] = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            const { data, error } = await supabaseClient
                .from('products')
                .select('id, description')

            if (error) {
                console.error('Error fetching products:', error);
                notifications.show({
                    title: 'Error', message: 'Failed to fetch products', color: 'red',
                });
            } else {
                setProducts(data || []);
            }
        };

        fetchProducts();
    }, []);

    const handleCreateProduct = async (product) => {
        if (createModalOpened) {
            toggle();

            if (products.find(p => p.description.toLowerCase() === product.toLowerCase())) {
                notifications.show({
                    title: 'Whoops!', message: 'You already have a product with that name.', color: "red"
                })
                return;
            }
            const { data, error } = await supabaseClient.from('products').insert({
                description: product
            }).select();
            if (!error) {
                setProducts([...products, data[0]])
                notifications.show({
                    title: 'Success!', message: 'Your product has been created!', color: "green"
                })
            } else {
                notifications.show({
                    title: 'Whoops!', message: 'Sorry, there was an error when creating your product.', color: "red"
                })
            }
        }
    }

    const handleDeleteProduct = (product) => {
        const updatedProducts = products.filter((item) => item !== product);
        setProducts(updatedProducts);
    }

    const handleProductEdit = async (id, oldName, newName) => {
        if (oldName === newName || newName.trim() === '') {
            return;
        }
        if (products.find(p => p.description.toLowerCase() === newName.toLowerCase())) {
            notifications.show({
                title: 'Whoops!', message: 'You already have a product with that name!.', color: "red"
            })
            return;
        }
        const { error } = await supabaseClient.from('products').update({ description: newName }).eq('id', id);
        if (!error) {
            notifications.show({
                title: 'Success!', message: 'You have updated ' + oldName + '!', color: "green"
            })
            setProducts(products.map((product) => {
                if (product.id === id) {
                    return { ...product, description: newName }
                }
                return product;
            }))
        } else {
            notifications.show({
                title: 'Whoops!', message: 'Sorry, there was an error when updating your product.', color: "red"
            })
        }
        setEditingProductId(null);
    }

    return (<>
        <Head>
            <title>Products | Ember</title>
        </Head>
        <Text>Your products</Text>
        <Text maw="40rem" c="dimmed" mb="1rem">Here you can manage your products and services. Add a new product or
            service to start tracking them in commissions</Text>
        <CreateProductModal opened={createModalOpened} handleClose={toggle} handleSubmit={handleCreateProduct} />
        <Flex direction="row" wrap="wrap" gap="1rem">
            {products?.length > 0 && products.map((product) => (<ProductWidget
                editingProductId={editingProductId}
                setEditingProductId={setEditingProductId}
                handleProductEdit={handleProductEdit}
                key={product.id}
                product={product}
                onProductDelete={handleDeleteProduct}
            />))}
            {products?.length < 20 && <CreateProductWidget onClick={toggle} />}
        </Flex>
    </>)
}

function ProductWidget({
    handleProductEdit, editingProductId, setEditingProductId,
    product, onProductDelete
}) {
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const focusTrapRef = useFocusTrap();
    const newNameForm = useForm({
        initialValues: {
            newName: ''
        }, validate: {
            newName: (value) => (value.trim() === '' ? 'New description is required!' : (value.length > 35 ? 'New description must be less than 35 characters!' : (value.length < 4 ? 'New description must be more than 4 characters!' : null))),
        }
    });

    const isEditModalOpen = editingProductId === product.id;

    const handleEditModalClose = () => {
        setEditingProductId(null);
    };

    const handleEditButtonClick = () => {
        setEditingProductId(product.id);
    };

    const handleProductDelete = async () => {
        const { error } = await supabaseClient.from('products').delete().eq('id', product.id);
        if (!error) {
            notifications.show({
                title: 'Success!', message: 'You have deleted ' + product.description + '!', color: "green"
            })
            onProductDelete(product);
        } else {
            notifications.show({
                title: 'Whoops!', message: 'Sorry, there was an error when deleting your product.', color: "red"
            })
        }
    }

    const handleProductSave = () => {
        if (!newNameForm.validate().hasErrors) {
            handleProductEdit(product.id, product.description, newNameForm.values.newName);
        }
    }

    return (<Paper miw="2rem" w="fit-content" p={16}>
        <DeleteProductModal opened={deleteModalOpen} handleClose={() => setDeleteModalOpen(false)}
            handleSubmit={handleProductDelete} />
        <Modal title="Edit product" opened={isEditModalOpen}
            onClose={handleEditModalClose}>
            <Text c="dimmed" mb="1rem">Enter a new name for this product:</Text>
            <TextInput data-autofocus ref={focusTrapRef} required
                mb="1rem" {...newNameForm.getInputProps('newName')}
                placeholder="Enter new name..." />
            <Group gap={12} justify="space-between">
                <Button c="white" variant="light" onClick={() => {
                    handleEditModalClose(false)
                }}>Cancel</Button>
                <Button
                    onClick={handleProductSave}>Save</Button>
            </Group>
        </Modal>
        <Stack gap={8}>
            <Text mb={0} size="sm" fw={600}>{product.description}</Text>
            <Group gap={8}>
                <Text className="pointer" c="dimmed" size="sm" mb={0} onClick={handleEditButtonClick}>Edit</Text>
                <Text c="dimmed" size="sm" mb={0}>|</Text>
                <Text c="dimmed" className="pointer" size="sm" mb={0}
                    onClick={() => setDeleteModalOpen(true)}>Delete</Text>
            </Group>
        </Stack>
    </Paper>)
}

function CreateProductWidget({ onClick }) {
    return (<UnstyledButton onClick={onClick}>
        <Paper style={{ border: "1px dashed grey" }} w="fit-content" p={40}>
            <Center>
                <Text size="sm" c="gray.7" mb={0}>
                    + New product
                </Text>
            </Center>
        </Paper>
    </UnstyledButton>)
}

function DeleteProductModal({ opened, handleClose, handleSubmit }) {
    const [loading, setLoading] = useState(false);

    const handleButtonClick = () => {
        setLoading(true)
        setTimeout(function () {
            handleSubmit();
            setLoading(false)
        }, 300)
    }

    return (<Modal transitionProps={{ transition: 'pop', duration: 150 }} centered opened={opened} onClose={handleClose}
        title="Delete this product?">
        <Text mb="1rem" c="dimmed">Are you sure you want to delete this product?</Text>
        <Group justify="space-between">
            <Button c="white" variant="light" onClick={handleClose}>Cancel</Button>
            <Button loading={loading} onClick={handleButtonClick}>Yes, delete!</Button>
        </Group>
    </Modal>)
}

function CreateProductModal({ opened, handleClose, handleSubmit }) {
    const focusTrapRef = useFocusTrap();
    const [loading, setLoading] = useState(false);
    const form = useForm({
        initialValues: {
            description: '',
        }, validate: {
            description: (value) => (value.trim() === '' ? 'Description is required!' : (value.length > 35 ? 'Description must be less than 35 characters!' : (value.length < 4 ? 'Description must be more than 4 characters!' : null))),
        }
    })

    useWindowEvent('keydown', (event) => {
        if (event.code === 'Enter' && opened) {
            event.preventDefault();
            handleButtonClick();
        }
    });

    const handleButtonClick = () => {
        setLoading(true)
        if (form.validate().hasErrors) {
            setLoading(false)
            return;
        }
        setTimeout(function () {
            handleSubmit(form.values.description);
            form.reset();
            setLoading(false)
        }, 300)
    }

    return (<Modal opened={opened} onClose={handleClose} title="Create a product">
        <Text mb={8} c="dimmed">Add a new product or service to start collecting reviews for it.</Text>
        <TextInput mb="1rem" data-autofocus ref={focusTrapRef} {...form.getInputProps('description')}
            placeholder="Product description" label="Description" required />
        <Group justify="space-between">
            <Button c="white" variant="light" onClick={handleClose}>Cancel</Button>
            <Button loading={loading} onClick={handleButtonClick}>Add product</Button>
        </Group>
    </Modal>)
}
