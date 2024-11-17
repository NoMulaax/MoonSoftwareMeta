'use client'

import React, {createContext, useContext, useEffect, useState} from 'react';
import {supabaseClient} from "../utils/supabaseClient";

const ViewsContext = createContext();

export const useViews = () => useContext(ViewsContext);

export const ViewsProvider = ({children}) => {
    const [viewsData, setViewsData] = useState([]);


    const fetchData = async () => {
        const {error, data: views} = await supabaseClient.from('panel_views').select('id, name, data');
        if (error) {
            console.log("An error occurred: " + error.message);
        } else {
            const transformedData = views.map(view => {
                const queryParams = [];

                if (view.data.sort) queryParams.push(`sort=${view.data.sort}`);
                if (view.data.sortOrder) queryParams.push(`descending=${view.data.sortOrder !== 'ascending'}`);
                if (view.data.filterClient) queryParams.push(`filter=${view.data.filterClient}`);
                if (view.data.filterStatus) queryParams.push(`status=${view.data.filterStatus}`);

                const queryString = queryParams.join('&');
                const link = `${view.data.page}/?${queryString}`;

                return { id: view.id, label: view.name, link };
            });
            setViewsData(transformedData);
        }
    };

    const refreshData = () => {
        fetchData();
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <ViewsContext.Provider value={{viewsData, refreshData}}>
            {children}
        </ViewsContext.Provider>
    );
};
