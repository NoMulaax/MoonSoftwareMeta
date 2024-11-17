'use client'

import { Grid, Group, Skeleton } from "@mantine/core";
import Head from "next/head";
import { useEffect, useState } from 'react';
import OverallChart from "./OverallChart/OverallChart";
import PopularProducts from "./PopularProducts/PopularProducts";
import ProductRevenueChart from "./ProductRevenueChart/ProductRevenueChart";
import StatWidget from "./StatWidget/StatWidget";
import UnpaidCommissionsTable from "./UnpaidCommissionsTable/UnpaidCommissionsTable";
import WeeklyRevenueChart from "./WeeklyRevenueChart/WeeklyRevenueChart";
import { getUnpaidCommissions } from "../utils/chartdata/getUnpaidCommissions";
import { calculateMonthlyRevenue } from "../utils/chartdata/monthlyRevenue";
import { getWeekData } from "../utils/chartdata/overallChart";
import { popularProductData } from "../utils/chartdata/popularProductData";
import { getTotalRevenueByProduct } from "../utils/chartdata/productRevenue";
import { supabaseClient } from "../utils/supabaseClient";

export default function Overview({ settings }) {
    const [initialData, setInitialData] = useState({ commissions: [], requests: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const { data: commissionData, error: commissionError } = await supabaseClient
                    .from('panel_commissions')
                    .select('*, client ( avatar_url ), product ( description )')

                const { data: requestsData, error: requestsError } = await supabaseClient
                    .from('panel_requests')
                    .select('status')

                if (commissionError || requestsError) {
                    console.log("Error when fetching data!");
                }

                setInitialData({ commissions: commissionData, requests: requestsData });
            } catch (err) {
                console.log(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    const commissions = initialData.commissions;

    return (<>
        <Group grow gap="1rem" wrap="wrap">
            <StatWidget currencyPrefix={settings?.currency_prefix} link="/commissions?page=1&sort=deadline&descending=false" title="Total revenue"
                value={commissions.reduce((total, commission) => total + commission.total_paid, 0)} isMoney />
            <StatWidget link="/commissions?page=1&sort=deadline&descending=false&status=completed"
                title="Total completed commissions"
                value={commissions.filter(item => item.status === "completed").length} />
            <StatWidget currencyPrefix={settings?.currency_prefix} link="/commissions?page=1&sort=deadline&descending=false" title="Total owed"
                value={commissions.reduce((total, commission) => total + (commission.total_value - commission.total_paid), 0)}
                isMoney />
            <StatWidget link="/requests?page=1&sort=deadline&descending=false" title="Open change requests"
                value={initialData.requests.filter(item => item.status !== "completed" && item.status !== "cancelled" && item.status !== "rejected").length} />
        </Group>

        <Grid mt="2rem">
            <Grid.Col span={{ base: 12, lg: 12, xl: 6 }}>
                <Skeleton radius={16} height="100%" visible={loading}>
                    <ProductRevenueChart currencyPrefix={settings?.currency_prefix} data={getTotalRevenueByProduct(commissions)} />
                </Skeleton>
            </Grid.Col>
            <Grid.Col span={{ base: 12, lg: 12, xl: 6 }}>
                <Skeleton radius={16} height="100%" visible={loading}>
                    <PopularProducts data={popularProductData(commissions)} />
                </Skeleton>
            </Grid.Col>
        </Grid>
        <Grid mt="1rem">
            <Grid.Col span={{ base: 12, lg: 6, xl: 7 }}>
                <Skeleton radius={16} height="100%" visible={loading}>
                    <OverallChart currencyPrefix={settings?.currency_prefix} data={getWeekData(commissions)} />
                </Skeleton>
            </Grid.Col>
            <Grid.Col span={{ base: 12, lg: 6, xl: 5 }}>
                <Skeleton radius={16} height="100%" visible={loading}>
                    <UnpaidCommissionsTable data={getUnpaidCommissions(commissions)} />
                </Skeleton>
            </Grid.Col>
        </Grid>
        <Skeleton radius={16} height="100%" visible={loading}>
            <WeeklyRevenueChart currencyPrefix={settings?.currency_prefix} data={calculateMonthlyRevenue(commissions)} />
        </Skeleton>
    </>);
}
