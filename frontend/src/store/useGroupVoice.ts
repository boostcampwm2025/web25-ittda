import { create } from 'zustand';

interface State {
  isVoiceActive: boolean;
}

interface Action {
  setIsVoiceActive: (voiceActive: boolean) => void;
}

export const useGroupVoice = create<State & Action>((set) => ({
  isVoiceActive: false,

  setIsVoiceActive: (voiceActive) => {
    set({ isVoiceActive: voiceActive });
  },
}));
