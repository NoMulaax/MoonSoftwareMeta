'use client'

import {Avatar, Flex, Group, Modal, Paper, ScrollArea, Stack, Text} from "@mantine/core";
import {useDisclosure, useHover} from "@mantine/hooks";
import {PiArrowSquareUpRightDuotone} from "react-icons/pi";
import Link from "next/link";

export default function CalendarWidget({date, commissionsDue, requestsDue}) {
    const [open, {toggle}] = useDisclosure(false);
    const {hovered, ref} = useHover();
    const isToday = new Date().toDateString() === new Date(date).toDateString();

    const content = (withLinks) => {
        return (<>
           <Stack gap="0.2rem">
               {commissionsDue.map((commission, index) => (<Paper component={withLinks ? Link : null}
                                                                  href={`/commissions?page=1&sort=deadline&descending=false&search=${commission.id}`}
                                                                  radius={4} p="0.2rem 0.4rem" bg="indigo.9"
                                                                  key={`commission-${index}`}>
                   <Flex align="center" gap="0.4rem">
                       <Avatar src={commission.client.avatar_url} size="xs"/>
                       <Text c="white" lineClamp={1} size="xs">{commission.title}</Text>
                   </Flex>
               </Paper>))}
               {requestsDue.map((request, index) => (<Paper component={withLinks ? Link : null}
                                                            href={`/requests?sort=deadline&descending=false&page=1&search=${request.id}`}
                                                            radius={4}
                                                            p="0.2rem 0.4rem" bg="yellow.9" key={`request-${index}`}>
                   <Flex align="center" gap="0.4rem">
                       <Avatar src={request.commission_avatar_url} size="xs"/>
                       <Text lineClamp={1} size="xs">{request.description}</Text>
                   </Flex>
               </Paper>))}
           </Stack>
        </>);
    }

    return (<>
        <Paper onClick={(e) => {
            toggle()
            e.preventDefault()
            e.stopPropagation();
        }} className="pointer" ref={ref} radius={8} mih="8rem" c={isToday ? "dark.6" : "#d2d2d2"}
               bg={isToday ? '#d2d2d2' : 'dark.6'}>
            <Group mb="0.6rem" justify="space-between">
                <Text>{new Date(date).toLocaleDateString('en-GB', {weekday: 'short', day: 'numeric'})}</Text>
                {hovered && <PiArrowSquareUpRightDuotone size="1.4rem"/>}
            </Group>
            <ScrollArea h="3.4rem">
                {content(false)}
            </ScrollArea>
        </Paper>

        <Modal opened={open} onClose={toggle}
               title={new Date(date).toLocaleDateString('en-GB', {weekday: 'short', day: 'numeric'})}>
            {(commissionsDue.length === 0 && requestsDue.length === 0) ? "You have nothing due on this date." : content(true)}
        </Modal>

    </>);
}
