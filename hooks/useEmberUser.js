'use client'

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabaseClient } from "../utils/supabaseClient";

const UserContext = createContext();

export const useEmberUser = () => useContext(UserContext);

export const UserContextProvider = ({ children }) => {
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        const checkUserAndCreateIfNeeded = async () => {
            supabaseClient.auth.onAuthStateChange((event, session) => {
                setTimeout(() => {
                    if (event === 'SIGNED_IN' || event === "INITIAL_SESSION" && session) {
                        if (!userData) {
                            supabaseClient
                                .from('panel_settings')
                                .select('display_name, discord, logo, terms, avatar_url, settings')
                                .eq('id', session.user.id).single()
                                .then(({ data, error }) => {
                                    if (data || !error) {
                                        setUserData({
                                            id: session.user.id,
                                            display_name: data.display_name,
                                            email: session.user.email,
                                            logo: data.logo,
                                            avatar_url: data.avatar_url,
                                            settings: data.settings
                                        });
                                    }
                                });
                        }
                    }

                    if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
                        const expires = new Date(0).toUTCString();
                        document.cookie = `access-token=; path=/; expires=${expires}; SameSite=Lax; secure`;
                        document.cookie = `refresh-token=; path=/; expires=${expires}; SameSite=Lax; secure`;
                    } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                        const maxAge = 100 * 365 * 24 * 60 * 60;
                        document.cookie = `access-token=${session.access_token}; path=/; max-age=${maxAge}; SameSite=Lax; secure`;
                        document.cookie = `refresh-token=${session.refresh_token}; path=/; max-age=${maxAge}; SameSite=Lax; secure`;
                    }
                });
            }, 0);
        }

        checkUserAndCreateIfNeeded()
    }, []);

    const updateContext = (newData) => {
        setUserData(newData);
    };

    return (<UserContext.Provider value={{ userData, updateContext }}>
        {children}
    </UserContext.Provider>);
};
