'use client'

import { useEffect, useState } from "react";
import { supabaseClient } from "../utils/supabaseClient";

const clientsCache = {
    data: [],
    error: null,
    promise: null,
};

export const useAllClients = () => {
    const [clients, setClients] = useState([]);

    useEffect(() => {
        if (!clientsCache.promise) {
            clientsCache.promise = supabaseClient
                .from('panel_clients')
                .select('id, username, avatar_url')
                .order('created_at', { ascending: false })
                .then(({ data, error }) => {
                    if (error) {
                        console.log("Error when fetching data!", error);
                        clientsCache.error = error;
                    } else {
                        clientsCache.data = data;
                    }
                    clientsCache.promise = null;
                    return { data, error };
                });
        }

        clientsCache.promise.then(({ data, error }) => {
            if (!error) {
                setClients(data);
            }
        });
    }, []);

    return clients;
};
