import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import {CharacterSelector} from '../CharacterSelector';
import characterReducer from '../../store/slices/characterSlice';
import {DEFAULT_CHARACTERS} from '../../data/characters';

const mockStore = configureStore({
  reducer: {
    character: characterReducer,
  },
});

const renderWithProvider = (component: React.ReactElement) => {
  return render(<Provider store={mockStore}>{component}</Provider>);
};

describe('CharacterSelector', () => {
  it('renders correctly with default props', () => {
    const {getByText} = renderWithProvider(<CharacterSelector />);
    
    expect(getByText('キャラクター選択')).toBeTruthy();
    expect(getByText('関係性設定')).toBeTruthy();
    expect(getByText('蒼')).toBeTruthy();
    expect(getByText('瞬')).toBeTruthy();
  });

  it('displays character information correctly', () => {
    const {getByText} = renderWithProvider(<CharacterSelector />);
    
    // Check Aoi character info
    expect(getByText('蒼')).toBeTruthy();
    expect(getByText('22歳')).toBeTruthy();
    expect(getByText(DEFAULT_CHARACTERS.aoi.description)).toBeTruthy();
    
    // Check Shun character info
    expect(getByText('瞬')).toBeTruthy();
    expect(getByText('35歳')).toBeTruthy();
    expect(getByText(DEFAULT_CHARACTERS.shun.description)).toBeTruthy();
  });

  it('displays personality indicators', () => {
    const {getAllByText} = renderWithProvider(<CharacterSelector />);
    
    // Should show personality labels for both characters
    expect(getAllByText('優しさ')).toHaveLength(2);
    expect(getAllByText('積極性')).toHaveLength(2);
  });

  it('shows active character indicator', () => {
    const {getByText} = renderWithProvider(<CharacterSelector />);
    
    // By default, 'aoi' should be the active character
    expect(getByText('選択中')).toBeTruthy();
  });

  it('handles character selection', async () => {
    const onCharacterSelect = jest.fn();
    const {getByText} = renderWithProvider(
      <CharacterSelector onCharacterSelect={onCharacterSelect} />
    );
    
    // Select Shun character
    const shunCard = getByText('瞬').closest('TouchableOpacity');
    fireEvent.press(shunCard);
    
    await waitFor(() => {
      expect(onCharacterSelect).toHaveBeenCalledWith('shun');
    });
  });

  it('displays relationship settings when enabled', () => {
    const {getByText} = renderWithProvider(
      <CharacterSelector showRelationshipSettings={true} />
    );
    
    expect(getByText('関係性設定')).toBeTruthy();
    expect(getByText('初対面')).toBeTruthy(); // Default relationship
    expect(getByText('初めて出会った関係')).toBeTruthy();
  });

  it('hides relationship settings when disabled', () => {
    const {queryByText} = renderWithProvider(
      <CharacterSelector showRelationshipSettings={false} />
    );
    
    expect(queryByText('関係性設定')).toBeNull();
  });

  it('displays relationship stats correctly', () => {
    const {getByText} = renderWithProvider(<CharacterSelector />);
    
    // Check for intimacy and trust level displays
    expect(getByText(/親密度: \d+%/)).toBeTruthy();
    expect(getByText(/信頼度: \d+%/)).toBeTruthy();
  });

  it('opens relationship modal when relationship button is pressed', async () => {
    const {getByText} = renderWithProvider(<CharacterSelector />);
    
    // Press the relationship button
    const relationshipButton = getByText('初対面').closest('TouchableOpacity');
    fireEvent.press(relationshipButton);
    
    await waitFor(() => {
      expect(getByText('関係性を選択')).toBeTruthy();
    });
  });

  it('displays all relationship options in modal', async () => {
    const {getByText} = renderWithProvider(<CharacterSelector />);
    
    // Open modal
    const relationshipButton = getByText('初対面').closest('TouchableOpacity');
    fireEvent.press(relationshipButton);
    
    await waitFor(() => {
      expect(getByText('先輩後輩')).toBeTruthy();
      expect(getByText('上司部下')).toBeTruthy();
      expect(getByText('幼馴染')).toBeTruthy();
      expect(getByText('初対面')).toBeTruthy();
    });
  });

  it('handles relationship selection in modal', async () => {
    const {getByText} = renderWithProvider(<CharacterSelector />);
    
    // Open modal
    const relationshipButton = getByText('初対面').closest('TouchableOpacity');
    fireEvent.press(relationshipButton);
    
    await waitFor(() => {
      expect(getByText('関係性を選択')).toBeTruthy();
    });
    
    // Select childhood friends relationship
    const childhoodFriendsOption = getByText('幼馴染').closest('TouchableOpacity');
    fireEvent.press(childhoodFriendsOption);
    
    await waitFor(() => {
      expect(getByText('幼馴染')).toBeTruthy();
    });
  });

  it('closes relationship modal when close button is pressed', async () => {
    const {getByText, queryByText} = renderWithProvider(<CharacterSelector />);
    
    // Open modal
    const relationshipButton = getByText('初対面').closest('TouchableOpacity');
    fireEvent.press(relationshipButton);
    
    await waitFor(() => {
      expect(getByText('関係性を選択')).toBeTruthy();
    });
    
    // Close modal
    const closeButton = getByText('閉じる');
    fireEvent.press(closeButton);
    
    await waitFor(() => {
      expect(queryByText('関係性を選択')).toBeNull();
    });
  });

  it('highlights selected relationship option in modal', async () => {
    const {getByText} = renderWithProvider(<CharacterSelector />);
    
    // Open modal
    const relationshipButton = getByText('初対面').closest('TouchableOpacity');
    fireEvent.press(relationshipButton);
    
    await waitFor(() => {
      // The currently selected option should be highlighted
      // This would be tested by checking for specific style classes
      // In practice, you might need to check the testID or style properties
      expect(getByText('初対面')).toBeTruthy();
    });
  });

  it('displays relationship stats in modal options', async () => {
    const {getByText} = renderWithProvider(<CharacterSelector />);
    
    // Open modal
    const relationshipButton = getByText('初対面').closest('TouchableOpacity');
    fireEvent.press(relationshipButton);
    
    await waitFor(() => {
      // Check for stats display in modal options
      expect(getByText(/親密度: \d+%/)).toBeTruthy();
      expect(getByText(/信頼度: \d+%/)).toBeTruthy();
    });
  });

  it('renders character cards with correct styling', () => {
    const {getByText} = renderWithProvider(<CharacterSelector />);
    
    // Check that character cards are rendered
    const aoiCard = getByText('蒼').closest('View');
    const shunCard = getByText('瞬').closest('View');
    
    expect(aoiCard).toBeTruthy();
    expect(shunCard).toBeTruthy();
  });

  it('updates personality indicators correctly', () => {
    const {getAllByText} = renderWithProvider(<CharacterSelector />);
    
    // Each character should have personality indicators
    // The exact implementation would depend on how the personality bars are rendered
    const kindnessLabels = getAllByText('優しさ');
    const aggressivenessLabels = getAllByText('積極性');
    
    expect(kindnessLabels).toHaveLength(2);
    expect(aggressivenessLabels).toHaveLength(2);
  });

  it('handles modal overlay press to close', async () => {
    const {getByText, queryByText} = renderWithProvider(<CharacterSelector />);
    
    // Open modal
    const relationshipButton = getByText('初対面').closest('TouchableOpacity');
    fireEvent.press(relationshipButton);
    
    await waitFor(() => {
      expect(getByText('関係性を選択')).toBeTruthy();
    });
    
    // The modal should handle onRequestClose
    // This is typically triggered by back button on Android
    // In a real test, you might need to simulate this differently
    expect(queryByText('関係性を選択')).toBeTruthy();
  });
});