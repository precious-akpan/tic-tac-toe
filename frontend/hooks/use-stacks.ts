"use client";

import { useEffect, useState } from "react";
import {
    AppConfig,
    showConnect,
    openContractCall,
    UserSession,
    type UserData,
} from "@stacks/connect";
import { PostConditionMode } from "@stacks/transactions";
import { createNewGame, joinGame, Move, play } from "@/lib/contract";
import { getStxBalance } from "@/lib/stx-utils";

const appDetails = {
    name: "Tic Tac Toe",
    icon: "https://cryptologos.cc/logos/stacks-stx-logo.png",
};

const appConfig = new AppConfig(["store_write"]);
const userSession = new UserSession({ appConfig });

export function useStacks() {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [stxBalance, setStxBalance] = useState<number>(0);

    const connectWallet = () => {
        showConnect({
            appDetails,
            userSession,
            onFinish: () => window.location.reload(),
        });
    };

    const disconnectWallet = () => {
        userSession.signUserOut();
        setUserData(null);
    };

    async function handleCreateGame(betAmount: number, moveIndex: number, move: Move) {
        if (typeof window === "undefined") return;
        if (moveIndex < 0 || moveIndex > 8) return alert("Invalid move index");
        if (!betAmount) return alert("Please make a bet");

        try {
            if (!userData) throw new Error("User not connected");
            const txOptions = await createNewGame(betAmount, moveIndex, move);

            await openContractCall({
                ...txOptions,
                appDetails,
                postConditionMode: PostConditionMode.Allow,
                onFinish: (data) => {
                    console.log("Transaction submitted:", data);
                    alert("Create game transaction sent");
                },
            });
        } catch (err) {
            console.error(err);
            alert((err as Error).message);
        }
    }

    async function handleJoinGame(gameId: number, moveIndex: number, move: Move) {
        if (typeof window === "undefined") return;
        if (moveIndex < 0 || moveIndex > 8) return alert("Invalid move index");

        try {
            if (!userData) throw new Error("User not connected");
            const txOptions = await joinGame(gameId, moveIndex, move);

            await openContractCall({
                ...txOptions,
                appDetails,
                postConditionMode: PostConditionMode.Allow,
                onFinish: (data) => {
                    console.log("Transaction submitted:", data);
                    alert("Join game transaction sent");
                },
            });
        } catch (err) {
            console.error(err);
            alert((err as Error).message);
        }
    }

    async function handlePlayGame(gameId: number, moveIndex: number, move: Move) {
        if (typeof window === "undefined") return;
        if (moveIndex < 0 || moveIndex > 8) return alert("Invalid move index");

        try {
            if (!userData) throw new Error("User not connected");
            const txOptions = await play(gameId, moveIndex, move);

            await openContractCall({
                ...txOptions,
                appDetails,
                postConditionMode: PostConditionMode.Allow,
                onFinish: (data) => {
                    console.log("Transaction submitted:", data);
                    alert("Play game transaction sent");
                },
            });
        } catch (err) {
            console.error(err);
            alert((err as Error).message);
        }
    }

    useEffect(() => {
        async function initUser() {
            if (userSession.isSignInPending()) {
                const data = await userSession.handlePendingSignIn();
                setUserData(data);
            } else if (userSession.isUserSignedIn()) {
                setUserData(userSession.loadUserData());
            }
        }
        initUser();
    }, []);

    useEffect(() => {
        if (!userData) return;
        const address = userData.profile?.stxAddress?.testnet;
        if (!address) return;
        getStxBalance(address).then(setStxBalance);
    }, [userData]);

    return {
        userData,
        stxBalance,
        connectWallet,
        disconnectWallet,
        handleCreateGame,
        handleJoinGame,
        handlePlayGame,
    };
}
