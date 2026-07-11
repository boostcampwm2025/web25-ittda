import { describe, it, expect, afterEach } from 'vitest';
import { useGroupVoice } from './useGroupVoice';

describe('useGroupVoice', () => {
  afterEach(() => {
    useGroupVoice.setState({ isVoiceActive: false });
  });

  it('초기값은 isVoiceActive: false다', () => {
    expect(useGroupVoice.getState().isVoiceActive).toBe(false);
  });

  it('setIsVoiceActive(true)를 호출하면 상태가 true로 바뀐다', () => {
    useGroupVoice.getState().setIsVoiceActive(true);
    expect(useGroupVoice.getState().isVoiceActive).toBe(true);
  });

  it('setIsVoiceActive(false)를 호출하면 상태가 false로 바뀐다', () => {
    useGroupVoice.getState().setIsVoiceActive(true);
    useGroupVoice.getState().setIsVoiceActive(false);
    expect(useGroupVoice.getState().isVoiceActive).toBe(false);
  });
});
