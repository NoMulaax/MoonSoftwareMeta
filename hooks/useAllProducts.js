'use client'

import { useEffect, useState } from "react";
import { supabaseClient } from "../utils/supabaseClient";
import { useEmberUser } from "./useEmberUser";

const productsCache = {
    data: [],
    error: null,
    promise: null,
};

export const useAllProducts = () => {
    const { userData: user } = useEmberUser();
    const [products, setProducts] = useState([]);

    useEffect(() => {
        if (!user) return;

        if (!productsCache.promise) {
            productsCache.promise = supabaseClient
                .from('products')
                .select('id, description')
                .eq('creator', user.id)
                .then(({ data, error }) => {
                    if (error) {
                        console.log("Error when fetching data!", error);
                        productsCache.error = error;
                    } else {
                        productsCache.data = data;
                    }
                    productsCache.promise = null;
                    return { data, error };
                });
        }

        productsCache.promise.then(({ data, error }) => {
            if (!error) {
                setProducts(data);
            }
        });
    }, [user]);

    return products;
};
