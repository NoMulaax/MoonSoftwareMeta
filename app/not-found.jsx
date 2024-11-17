import {Button, Container, Group, Text, Title} from '@mantine/core';
import classes from '../components/404Page/404Page.module.css'
import {Illustration404} from "../components/404Page/Illustration";
import Link from "next/link";
import Head from "next/head";

export default function Page() {
    return (
       <>
           <Head>
               <title>404 | Ember</title>
           </Head>
           <Container mt="6%" className={classes.root}>
               <div className={classes.inner}>
                   <Illustration404 className={classes.image}/>
                   <div className={classes.content}>
                       <Title className={classes.title}>Nothing to see here!</Title>
                       <Text c="dimmed" size="lg" ta="center" className={classes.description}>
                           The page you are trying to open does not exist. You may have mistyped the address, or the
                           page has been moved to another URL. If you think this is an error, please contact support.
                       </Text>
                       <Group justify="center">
                           <Button c="white" component={Link} href="/overview">Take me back to home page</Button>
                       </Group>
                   </div>
               </div>
           </Container>
       </>
    );
}