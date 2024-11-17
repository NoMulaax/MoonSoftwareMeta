import '@mantine/charts/styles.css';
import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import "@mantine/core/styles.layer.css";
import '@mantine/dates/styles.css';
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import '@mantine/tiptap/styles.css';
import Head from "next/head";
import { UserContextProvider } from "../hooks/useEmberUser";
import { ViewsProvider } from "../hooks/useViews";
import "../styles/App.css";
import { theme } from "../theme";

export const BASE_URL = "https://ember.buzz.dev/"
// export const BASE_URL = 'http://localhost:3000/'

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <Head>
                <link rel="shortcut icon" href="/favicon.ico" />
                <meta name="viewport" content="width=device-width,initial-scale=1" />
                <meta name="description" content="A product by Vouchley" />
                <link rel="mask-icon" href="/android-chrome-512x512.png" color="#EA3989" />
                <meta name="theme-color" content="#EA3989" />
                <link rel="apple-touch-icon" href="/android-chrome-512x512.png" />
                <link
                    rel="apple-touch-icon"
                    sizes="152x152"
                    href="/android-chrome-512x512.png"
                />
                <link
                    rel="apple-touch-icon"
                    sizes="180x180"
                    href="/android-chrome-512x512.png"
                />
                <link
                    rel="apple-touch-icon"
                    sizes="167x167"
                    href="/android-chrome-512x512.png"
                />
                <link rel="manifest" href="/manifest.json" />
                <meta name="twitter:card" content="summary" />
                <meta name="twitter:url" content="https://ember.buzz.dev" />
                <meta name="twitter:title" content="Ember" />
                <meta name="twitter:description" content="A product by Vouchley" />
                <meta name="twitter:image" content="/android-chrome-512x512.png" />
                <meta name="twitter:creator" content="@vouchleyapp" />
                <meta property="og:type" content="website" />
                <meta property="og:title" content="A product by Vouchley" />
                <meta property="og:description" content="A product by Vouchley" />
                <meta property="og:site_name" content="Ember" />
                <meta property="og:url" content="https://ember.buzz.dev" />
                <meta property="og:image" content="/android-chrome-512x512.png" />
                <link
                    rel="apple-touch-startup-image"
                    href="/android-chrome-512x512.png"
                    sizes="2048x2732"
                />
                <link
                    rel="apple-touch-startup-image"
                    href="/android-chrome-512x512.png"
                    sizes="1668x2224"
                />
                <link
                    rel="apple-touch-startup-image"
                    href="/android-chrome-512x512.png"
                    sizes="1536x2048"
                />
                <link
                    rel="apple-touch-startup-image"
                    href="/android-chrome-512x512.png"
                    sizes="1125x2436"
                />
                <link
                    rel="apple-touch-startup-image"
                    href="/android-chrome-512x512.png"
                    sizes="1242x2208"
                />
                <link
                    rel="apple-touch-startup-image"
                    href="/android-chrome-512x512.png"
                    sizes="750x1334"
                />
                <link
                    rel="apple-touch-startup-image"
                    href="/android-chrome-512x512.png"
                    sizes="640x1136"
                />
            </Head>
            <body>
                <MantineProvider theme={theme} forceColorScheme="dark">
                    <ColorSchemeScript forceColorScheme="dark" />
                    <Notifications position="bottom-center" />
                    <UserContextProvider>
                        <ViewsProvider>
                            {children}
                        </ViewsProvider>
                    </UserContextProvider>
                </MantineProvider>
            </body>
        </html>);
}
