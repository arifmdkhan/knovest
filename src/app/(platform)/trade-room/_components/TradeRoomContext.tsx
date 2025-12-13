"use client";

import { createContext, useContext } from "react";

interface TradeRoomContextType {
    myGroupIds: string[];
    isLoadingGroups: boolean;
}

const TradeRoomContext = createContext<TradeRoomContextType>({
    myGroupIds: [],
    isLoadingGroups: false,
});

export const useTradeRoomContext = () => useContext(TradeRoomContext);

export const TradeRoomProvider = TradeRoomContext.Provider;
