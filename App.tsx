import React from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Provider} from 'react-redux';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

import {store} from './src/store';
import {HomeScreen, CharacterScreen, DialogueScreen} from './src/screens';

const Stack = createStackNavigator();

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Home">
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{title: 'Voice Dialogue'}}
            />
            <Stack.Screen
              name="Character"
              component={CharacterScreen}
              options={{title: 'キャラクター選択'}}
            />
            <Stack.Screen
              name="Dialogue"
              component={DialogueScreen}
              options={{title: '対話'}}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </Provider>
  );
};

export default App;
