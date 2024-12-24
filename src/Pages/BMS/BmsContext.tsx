import { PlayerAudio } from '@Bms/audio/loader/AudioPlayer';
import { AudioPreloader } from '@Bms/audio/loader/AudioPreloader';
import GameController from '@Bms/Controller';
import React, { createContext, useState, useRef, ReactNode } from 'react';

interface BmsContextProps {
    isPlaying: boolean;
    setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
    bmsChart: any;
    setBmsChart: React.Dispatch<React.SetStateAction<any>>;
    bmsTiming: any;
    setBmsTiming: React.Dispatch<React.SetStateAction<any>>;
    bmsPositioning: any;
    setBmsPositioning: React.Dispatch<React.SetStateAction<any>>;
    bmsKeySounds: any;
    setBmsKeySounds: React.Dispatch<React.SetStateAction<any>>;
    bmsNotes: any;
    setBmsNotes: React.Dispatch<React.SetStateAction<any>>;
    bmsNoteLoader: any;
    setBmsNoteLoader: React.Dispatch<React.SetStateAction<any>>;
    bmsAutos: any;
    setBmsAutos: React.Dispatch<React.SetStateAction<any>>;
    preloader: AudioPreloader | null;
    setPreloader: React.Dispatch<React.SetStateAction<AudioPreloader | null>>;
    fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
    resourceURL: string | null;
    setResourceURL: React.Dispatch<React.SetStateAction<string | null>>;
    controller: GameController | null;
    setController: React.Dispatch<React.SetStateAction<GameController | null>>;
    nowTime: string | null;
    setNowTime: React.Dispatch<React.SetStateAction<string | null>>;
    logger: log;
    setLogger: React.Dispatch<React.SetStateAction<log>>;
    playerAudio: PlayerAudio | null;
    setPlayerAudio: React.Dispatch<React.SetStateAction<PlayerAudio | null>>;
}
export type log = {
    message: string;
    worker: string;
    date: string;
    now: string;
    log: Map<string, string>;
    warn: Map<string, string>;
};

export const BmsContext = createContext<BmsContextProps | null>(null);

export const BmsProvider = ({ children }: { children: ReactNode }) => {
    const [resourceURL, setResourceURL] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [bmsChart, setBmsChart] = useState<any>(null);
    const [bmsTiming, setBmsTiming] = useState<any>(null);
    const [bmsPositioning, setBmsPositioning] = useState<any>(null);
    const [bmsKeySounds, setBmsKeySounds] = useState<any>(null);
    const [bmsNotes, setBmsNotes] = useState<any>(null);
    const [bmsNoteLoader, setBmsNoteLoader] = useState<any>(null);
    const [preloader, setPreloader] = useState<AudioPreloader | null>(null);
    const [controller, setController] = useState<GameController | null>(null);
    const [nowTime, setNowTime] = useState<string | null>(null);
    const [playerAudio, setPlayerAudio] = useState<PlayerAudio | null>(null);
    const [bmsAutos, setBmsAutos] = useState<any>(null);
    const [logger, setLogger] = useState<log>({
        message: '',
        worker: '',
        date: '',
        now: '',
        log: new Map(),
        warn: new Map(),
    });
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    return (
        <BmsContext.Provider
            value={{
                isPlaying,
                setIsPlaying,
                bmsChart,
                setBmsChart,
                bmsTiming,
                setBmsTiming,
                bmsPositioning,
                setBmsPositioning,
                bmsKeySounds,
                setBmsKeySounds,
                bmsNotes,
                setBmsNotes,
                bmsNoteLoader,
                setBmsNoteLoader,
                preloader,
                setPreloader,
                fileInputRef,
                resourceURL,
                setResourceURL,
                controller,
                setController,
                nowTime,
                setNowTime,
                logger,
                setLogger,
                playerAudio,
                setPlayerAudio,
                bmsAutos,
                setBmsAutos,
            }}
        >
            {children}
        </BmsContext.Provider>
    );
};
