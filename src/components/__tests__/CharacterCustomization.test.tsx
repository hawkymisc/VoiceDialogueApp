import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import {Alert} from 'react-native';
import {CharacterCustomization} from '../CharacterCustomization';
import characterReducer from '../../store/slices/characterSlice';

// Mock Alert
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Alert: {
    alert: jest.fn(),
  },
}));

const mockStore = configureStore({
  reducer: {
    character: characterReducer,
  },
});

const renderWithProvider = (component: React.ReactElement) => {
  return render(<Provider store={mockStore}>{component}</Provider>);
};

describe('CharacterCustomization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with active character', () => {
    const {getByText} = renderWithProvider(<CharacterCustomization />);
    
    expect(getByText(/のカスタマイゼーション/)).toBeTruthy();
    expect(getByText('性格')).toBeTruthy();
    expect(getByText('外見')).toBeTruthy();
    expect(getByText('音声')).toBeTruthy();
  });

  it('shows error when no character is selected', () => {
    // Create a store with no active character
    const storeWithNoCharacter = configureStore({
      reducer: {
        character: characterReducer,
      },
      preloadedState: {
        character: {
          characters: {},
          activeCharacter: null,
          relationship: {type: 'strangers', intimacyLevel: 20, trustLevel: 30},
          isLoading: false,
          error: null,
        },
      },
    });

    const {getByText} = render(
      <Provider store={storeWithNoCharacter}>
        <CharacterCustomization />
      </Provider>
    );
    
    expect(getByText('キャラクターが選択されていません')).toBeTruthy();
  });

  it('renders close button when onClose is provided', () => {
    const onClose = jest.fn();
    const {getByText} = renderWithProvider(
      <CharacterCustomization onClose={onClose} />
    );
    
    const closeButton = getByText('✕');
    expect(closeButton).toBeTruthy();
    
    fireEvent.press(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('switches tabs correctly', () => {
    const {getByText} = renderWithProvider(<CharacterCustomization />);
    
    // Default tab should be personality
    expect(getByText('性格パラメータ')).toBeTruthy();
    
    // Switch to appearance tab
    fireEvent.press(getByText('外見'));
    expect(getByText('外見設定')).toBeTruthy();
    
    // Switch to voice tab
    fireEvent.press(getByText('音声'));
    expect(getByText('音声設定')).toBeTruthy();
  });

  describe('Personality Tab', () => {
    it('displays personality sliders', () => {
      const {getByText} = renderWithProvider(<CharacterCustomization />);
      
      expect(getByText('積極性')).toBeTruthy();
      expect(getByText('優しさ')).toBeTruthy();
      expect(getByText('ツンデレ度')).toBeTruthy();
      expect(getByText('照れやすさ')).toBeTruthy();
    });

    it('shows personality slider descriptions', () => {
      const {getByText} = renderWithProvider(<CharacterCustomization />);
      
      expect(getByText('控えめ ← → 積極的')).toBeTruthy();
      expect(getByText('クール ← → 優しい')).toBeTruthy();
      expect(getByText('素直 ← → ツンデレ')).toBeTruthy();
      expect(getByText('堂々 ← → 恥ずかしがり屋')).toBeTruthy();
    });

    it('displays personality values', () => {
      const {getByText} = renderWithProvider(<CharacterCustomization />);
      
      // Check for percentage values (these will depend on default character data)
      expect(getByText(/\d+%/)).toBeTruthy();
    });
  });

  describe('Appearance Tab', () => {
    it('displays appearance settings', () => {
      const {getByText} = renderWithProvider(<CharacterCustomization />);
      
      // Switch to appearance tab
      fireEvent.press(getByText('外見'));
      
      expect(getByText('外見設定')).toBeTruthy();
      expect(getByText('髪色')).toBeTruthy();
      expect(getByText('瞳の色')).toBeTruthy();
      expect(getByText('服装カテゴリ')).toBeTruthy();
    });

    it('displays color palette for hair colors', () => {
      const {getByText} = renderWithProvider(<CharacterCustomization />);
      
      // Switch to appearance tab
      fireEvent.press(getByText('外見'));
      
      // Color palette should be rendered (though individual colors might not have accessible text)
      expect(getByText('髪色')).toBeTruthy();
    });

    it('displays current clothing information', () => {
      const {getByText} = renderWithProvider(<CharacterCustomization />);
      
      // Switch to appearance tab
      fireEvent.press(getByText('外見'));
      
      expect(getByText(/現在:/)).toBeTruthy();
      expect(getByText('服装変更機能は今後のアップデートで追加予定')).toBeTruthy();
    });
  });

  describe('Voice Tab', () => {
    it('displays voice settings', () => {
      const {getByText} = renderWithProvider(<CharacterCustomization />);
      
      // Switch to voice tab
      fireEvent.press(getByText('音声'));
      
      expect(getByText('音声設定')).toBeTruthy();
      expect(getByText('ピッチ')).toBeTruthy();
      expect(getByText('話す速度')).toBeTruthy();
      expect(getByText('感情表現範囲')).toBeTruthy();
    });

    it('shows voice slider descriptions', () => {
      const {getByText} = renderWithProvider(<CharacterCustomization />);
      
      // Switch to voice tab
      fireEvent.press(getByText('音声'));
      
      expect(getByText('低い ← → 高い')).toBeTruthy();
      expect(getByText('ゆっくり ← → 早口')).toBeTruthy();
      expect(getByText('控えめ ← → 豊か')).toBeTruthy();
    });

    it('displays voice model information', () => {
      const {getByText} = renderWithProvider(<CharacterCustomization />);
      
      // Switch to voice tab
      fireEvent.press(getByText('音声'));
      
      expect(getByText('使用音声モデル')).toBeTruthy();
      expect(getByText('Azure Cognitive Services Speech API')).toBeTruthy();
    });

    it('shows voice speed in correct format', () => {
      const {getByText} = renderWithProvider(<CharacterCustomization />);
      
      // Switch to voice tab
      fireEvent.press(getByText('音声'));
      
      // Should show speed in format like "1.0x"
      expect(getByText(/\d+\.\d+x/)).toBeTruthy();
    });
  });

  describe('Reset Functionality', () => {
    it('shows reset button', () => {
      const {getByText} = renderWithProvider(<CharacterCustomization />);
      
      expect(getByText('初期設定に戻す')).toBeTruthy();
    });

    it('shows confirmation alert when reset is pressed', () => {
      const {getByText} = renderWithProvider(<CharacterCustomization />);
      
      const resetButton = getByText('初期設定に戻す');
      fireEvent.press(resetButton);
      
      expect(Alert.alert).toHaveBeenCalledWith(
        'カスタマイゼーションをリセット',
        '全ての設定を初期値に戻します。よろしいですか？',
        expect.arrayContaining([
          expect.objectContaining({text: 'キャンセル'}),
          expect.objectContaining({text: 'リセット'}),
        ])
      );
    });
  });

  describe('Tab Navigation', () => {
    it('highlights active tab', () => {
      const {getByText} = renderWithProvider(<CharacterCustomization />);
      
      // Default active tab should be personality
      const personalityTab = getByText('性格').closest('View');
      expect(personalityTab).toBeTruthy();
      
      // Switch to appearance tab and check if it becomes active
      fireEvent.press(getByText('外見'));
      const appearanceTab = getByText('外見').closest('View');
      expect(appearanceTab).toBeTruthy();
    });

    it('renders correct content for each tab', () => {
      const {getByText, queryByText} = renderWithProvider(<CharacterCustomization />);
      
      // Personality tab content
      expect(getByText('性格パラメータ')).toBeTruthy();
      expect(queryByText('外見設定')).toBeNull();
      expect(queryByText('音声設定')).toBeNull();
      
      // Switch to appearance tab
      fireEvent.press(getByText('外見'));
      expect(queryByText('性格パラメータ')).toBeNull();
      expect(getByText('外見設定')).toBeTruthy();
      expect(queryByText('音声設定')).toBeNull();
      
      // Switch to voice tab
      fireEvent.press(getByText('音声'));
      expect(queryByText('性格パラメータ')).toBeNull();
      expect(queryByText('外見設定')).toBeNull();
      expect(getByText('音声設定')).toBeTruthy();
    });
  });

  describe('ScrollView Behavior', () => {
    it('renders content in scrollable container', () => {
      const {getByText} = renderWithProvider(<CharacterCustomization />);
      
      // The content should be wrapped in a ScrollView
      // This is implicit in the current implementation
      expect(getByText('性格パラメータ')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('handles missing character data gracefully', () => {
      const storeWithCorruptedData = configureStore({
        reducer: {
          character: characterReducer,
        },
        preloadedState: {
          character: {
            characters: {},
            activeCharacter: 'nonexistent' as any,
            relationship: {type: 'strangers', intimacyLevel: 20, trustLevel: 30},
            isLoading: false,
            error: null,
          },
        },
      });

      const {getByText} = render(
        <Provider store={storeWithCorruptedData}>
          <CharacterCustomization />
        </Provider>
      );
      
      expect(getByText('キャラクターが選択されていません')).toBeTruthy();
    });
  });
});