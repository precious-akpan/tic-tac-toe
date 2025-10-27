
import { describe, expect, it, beforeAll } from "vitest";
import { Cl, ClarityType } from "@stacks/transactions";

/*
  The test below is an example. To learn more, read the testing documentation here:
  https://docs.hiro.so/stacks/clarinet-js-sdk
*/

let accounts: Map<string, string>;
let alice: string;
let bob: string;

beforeAll(() => {
    accounts = simnet.getAccounts();
    alice = accounts.get("wallet_1")!;
    bob = accounts.get("wallet_2")!;
});

// Helper function to create a new game with the given bet amount, move index, and move
// on behalf of the `user` address
function createGame(
    betAmount: number,
    moveIndex: number,
    move: number,
    user: string
) {
    return simnet.callPublicFn(
        "tic-tac-toe",
        "create-game",
        [Cl.uint(betAmount), Cl.uint(moveIndex), Cl.uint(move)],
        user
    );
}

// Helper function to join a game with the given move index and move on behalf of the `user` address
function joinGame(moveIndex: number, move: number, user: string) {
    return simnet.callPublicFn(
        "tic-tac-toe",
        "join-game",
        [Cl.uint(0), Cl.uint(moveIndex), Cl.uint(move)],
        user
    );
}

// Helper function to play a move with the given move index and move on behalf of the `user` address
function play(moveIndex: number, move: number, user: string) {
    return simnet.callPublicFn(
        "tic-tac-toe",
        "play",
        [Cl.uint(0), Cl.uint(moveIndex), Cl.uint(move)],
        user
    );
}

// Helper function to cancel a game on behalf of the `user` address
function cancelGame(gameId: number, user: string) {
    return simnet.callPublicFn(
        "tic-tac-toe",
        "cancel-game",
        [Cl.uint(gameId)],
        user
    );
}

describe("Tic Tac Toe Tests", () => {
    it("allows game creation", () => {
        const { result, events } = createGame(100, 0, 1, alice);

        expect(result).toBeOk(Cl.uint(0));
        expect(events.length).toBe(2); // print_event and stx_transfer_event
    });

    it("allows game joining", () => {
        createGame(100, 0, 1, alice);
        const { result, events } = joinGame(1, 2, bob);

        expect(result).toBeOk(Cl.uint(0));
        expect(events.length).toBe(2); // print_event and stx_transfer_event
    });

    it("allows game playing", () => {
        createGame(100, 0, 1, alice);
        joinGame(1, 2, bob);
        const { result, events } = play(2, 1, alice);

        expect(result).toBeOk(Cl.uint(0));
        expect(events.length).toBe(1); // print_event
    });

    it("does not allow creating a game with a bet amount of 0", () => {
        const { result } = createGame(0, 0, 1, alice);
        expect(result).toBeErr(Cl.uint(100));
    });

    it("does not allow joining a game that has already been joined", () => {
        createGame(100, 0, 1, alice);
        joinGame(1, 2, bob);

        const { result } = joinGame(1, 2, alice);
        expect(result).toBeErr(Cl.uint(103));
    });

    it("does not allow an out of bounds move", () => {
        createGame(100, 0, 1, alice);
        joinGame(1, 2, bob);

        const { result } = play(10, 1, alice);
        expect(result).toBeErr(Cl.uint(101));
    });

    it("does not allow a non X or O move", () => {
        createGame(100, 0, 1, alice);
        joinGame(1, 2, bob);

        const { result } = play(2, 3, alice);
        expect(result).toBeErr(Cl.uint(101));
    });

    it("does not allow moving on an occupied spot", () => {
        createGame(100, 0, 1, alice);
        joinGame(1, 2, bob);

        const { result } = play(1, 1, alice);
        expect(result).toBeErr(Cl.uint(101));
    });

    it("allows player one to win", () => {
        createGame(100, 0, 1, alice);
        joinGame(3, 2, bob);
        play(1, 1, alice);
        play(4, 2, bob);
        const { result, events } = play(2, 1, alice);

        expect(result).toBeOk(Cl.uint(0)); // Game ends
        expect(events.length).toBe(2); // print_event and stx_transfer_event for prize

        const gameData = simnet.getMapEntry("tic-tac-toe", "games", Cl.uint(0));
        expect(gameData?.type).toBe(ClarityType.OptionalSome);
        const game = (gameData as any).value.data;
        expect(game["last-move-at"]).toBeTypeOf("object");
        expect(Cl.tuple(game)).toEqual(
            Cl.tuple({
                "player-one": Cl.principal(alice),
                "player-two": Cl.some(Cl.principal(bob)),
                "is-player-one-turn": Cl.bool(false),
                "bet-amount": Cl.uint(100),
                board: Cl.list([
                    Cl.uint(1),
                    Cl.uint(1),
                    Cl.uint(1),
                    Cl.uint(2),
                    Cl.uint(2),
                    Cl.uint(0),
                    Cl.uint(0),
                    Cl.uint(0),
                    Cl.uint(0),
                ]),
                winner: Cl.some(Cl.principal(alice)),
                "last-move-at": game["last-move-at"],
            })
        );
    });

    it("allows player two to win", () => {
        createGame(100, 0, 1, alice);
        joinGame(3, 2, bob);
        play(1, 1, alice);
        play(4, 2, bob);
        play(8, 1, alice);
        const { result, events } = play(5, 2, bob);

        expect(result).toBeOk(Cl.uint(0)); // Game ends
        expect(events.length).toBe(2); // print_event and stx_transfer_event for prize

        const gameData = simnet.getMapEntry("tic-tac-toe", "games", Cl.uint(0));
        expect(gameData?.type).toBe(ClarityType.OptionalSome);
        const game = (gameData as any).value.data;
        expect(game["last-move-at"]).toBeTypeOf("object");
        expect(Cl.tuple(game)).toEqual(
            Cl.tuple({
                "player-one": Cl.principal(alice),
                "player-two": Cl.some(Cl.principal(bob)),
                "is-player-one-turn": Cl.bool(true),
                "bet-amount": Cl.uint(100),
                board: Cl.list([
                    Cl.uint(1),
                    Cl.uint(1),
                    Cl.uint(0),
                    Cl.uint(2),
                    Cl.uint(2),
                    Cl.uint(2),
                    Cl.uint(0),
                    Cl.uint(0),
                    Cl.uint(1),
                ]),
                winner: Cl.some(Cl.principal(bob)),
                "last-move-at": game["last-move-at"],
            })
        );
    });

    it("allows a player to cancel a game and claim funds if the opponent times out", () => {
        createGame(100, 0, 1, alice);
        joinGame(1, 2, bob);

        // Advance the chain state by MOVE_TIMEOUT_BLOCKS
        simnet.mineEmptyBlocks(144);

        // It's alice's turn, so bob can cancel
        const { result, events } = cancelGame(0, bob);

        expect(result).toBeOk(Cl.bool(true));
        expect(events.length).toBe(2); // print_event and stx_transfer_event

        // Check that bob is the winner and received the funds
        const gameData = simnet.getMapEntry("tic-tac-toe", "games", Cl.uint(0));
        expect(gameData?.type).toBe(ClarityType.OptionalSome);
        const game = (gameData as any).value.data;
        expect(game["last-move-at"]).toBeTypeOf("object");
        expect(Cl.tuple(game)).toEqual(
            Cl.tuple({
                "player-one": Cl.principal(alice),
                "player-two": Cl.some(Cl.principal(bob)),
                "is-player-one-turn": Cl.bool(true),
                "bet-amount": Cl.uint(100),
                board: Cl.list([
                    Cl.uint(1),
                    Cl.uint(2),
                    Cl.uint(0),
                    Cl.uint(0),
                    Cl.uint(0),
                    Cl.uint(0),
                    Cl.uint(0),
                    Cl.uint(0),
                    Cl.uint(0),
                ]),
                winner: Cl.some(Cl.principal(bob)),
                "last-move-at": game["last-move-at"], // last-move-at is updated
            })
        );
    });

    it("does not allow cancelling a game before the timeout", () => {
        createGame(100, 0, 1, alice);
        joinGame(1, 2, bob);

        // Only advance a few blocks, not enough for a timeout
        simnet.mineEmptyBlocks(10);

        const { result } = cancelGame(0, bob);
        expect(result).toBeErr(Cl.uint(105)); // ERR_GAME_NOT_TIMED_OUT
    });

    it("does not allow a player to cancel a game on their own turn", () => {
        createGame(100, 0, 1, alice);
        joinGame(1, 2, bob);

        simnet.mineEmptyBlocks(144);

        const { result } = cancelGame(0, alice);
        expect(result).toBeErr(Cl.uint(106)); // ERR_CANT_CANCEL_OWN_TURN
    });
});
