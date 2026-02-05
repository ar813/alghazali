"use client";

import { Box, Container, Flex, Heading, Text, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import NavBar from "@/components/NavBar/NavBar";
import Footer from "@/components/Footer/Footer";
import AgentChat from "@/components/Agent/AgentChat";
import { initAgentSDK } from "@/lib/agent/sdk-config";

export default function AgentPage() {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Initialize SDK with OpenRouter on client side
        initAgentSDK();
        setIsLoaded(true);
    }, []);

    return (
        <main className="min-h-screen bg-background relative flex flex-col w-full overflow-x-hidden">
            {/* Vercel Grid Background */}
            <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
                <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
            </div>

            <NavBar />

            <Container maxW="container.md" pt={24} pb={10} flex="1" display="flex" flexDirection="column">
                <VStack spacing={6} align="stretch" h="full" flex="1">
                    <Box textAlign="center">
                        <Heading size="xl" mb={2}>Al Ghazali AI Agent</Heading>
                        <Text color="muted.foreground">How can I help you today with your school queries?</Text>
                    </Box>

                    <Box flex="1" bg="bg.panel" rounded="xl" border="1px solid" borderColor="border" overflow="hidden" shadow="sm">
                        {isLoaded ? <AgentChat /> : <Flex align="center" justify="center" h="full"><Text>Initializing Agent...</Text></Flex>}
                    </Box>
                </VStack>
            </Container>

            <Footer />
        </main>
    );
}
